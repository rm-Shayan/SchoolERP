import nodemailer from "nodemailer";
import Logger from "../lib/utils/logger.js";
import prisma from "../config/db.js";
import { decryptSecret } from "../lib/utils/secretBox.js";

const logger = new Logger("email-service");

// ── Platform transport (Super Admin env credentials) ──
// Chain ka LAST member / fallback: jab tenant ke paas SMTP na ho, ya saare
// tenant tiers fail ho jayen. Tenant SMTP (DB OrgSecrets) pehle try hota hai.
const platformTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const SMTP_HOLDER = (process.env.SMTP_USER || "").toLowerCase();

// Gmail SMTP: From email HAMESHA authenticated account (holder) hona chahiye,
// warna SPF fail hota hai aur mail spam/drop ho jata hai (org admin ko nahi
// milta). Isliye From = holder Gmail; display name branded (org/branch) rakhte
// hain. Recipient === holder hone par guard skip karta hai taake SUPER_ADMIN ko
// apni hi bheji hui mail ki copy apne inbox me na aaye.
const RAW_FROM = process.env.EMAIL_FROM_ADDRESS || SMTP_HOLDER || "noreply@school-erp.com";
const PLATFORM_SENDER_EMAIL = SMTP_HOLDER || RAW_FROM;
const PLATFORM_SENDER_NAME = process.env.EMAIL_FROM_NAME || "School ERP";

const PLATFORM_MAILER = () => ({
  transporter: platformTransport,
  fromEmail: PLATFORM_SENDER_EMAIL,
  fromName: PLATFORM_SENDER_NAME,
  source: "platform",
  key: "platform",
  holder: SMTP_HOLDER,
});

// ── Tenant transport cache (per OrgSecrets row) ──
// Key = OrgSecrets.id. updatedAt badalne par (settings edit) auto-invalidate.
const TENANT_TTL_MS = 5 * 60 * 1000;
const transportCache = new Map(); // id -> { updatedAtIso, ts, mailer }

/** Build one tenant mailer from an OrgSecrets row (cached). */
async function buildMailer(setting) {
  const updatedIso = setting.updatedAt?.toISOString() || "";
  const cached = transportCache.get(setting.id);
  if (cached && cached.updatedAtIso === updatedIso && Date.now() - cached.ts < TENANT_TTL_MS) {
    return cached.mailer;
  }

  const d = setting.data || {};
  const password = decryptSecret(d.passwordEnc);
  if (!password) {
    throw new Error("Tenant SMTP password decrypt nahi hua — settings dobara save karein");
  }

  const transporter = nodemailer.createTransport({
    host: d.host,
    port: d.port || 587,
    secure: d.secure || false,
    auth: { user: d.username, pass: password },
  });

  let fromName = d.fromName;
  if (!fromName) {
    const [org, school] = await Promise.all([
      prisma.organization.findUnique({ where: { id: setting.organizationId }, select: { name: true } }),
      setting.schoolId
        ? prisma.school.findUnique({ where: { id: setting.schoolId }, select: { name: true } })
        : Promise.resolve(null),
    ]);
    fromName = [org?.name, school?.name].filter(Boolean).join(" - ") || PLATFORM_SENDER_NAME;
  }

  const mailer = {
    transporter,
    fromEmail: d.username,
    fromName,
    source: setting.schoolId ? "branch" : "organization",
    tier: setting.tier || "PRIMARY",
    key: setting.id,
    holder: d.username.toLowerCase(),
    dailyLimit: Number(d.dailyLimit) || 500,
  };
  transportCache.set(setting.id, { updatedAtIso: updatedIso, ts: Date.now(), mailer });
  return mailer;
}

/**
 * Outgoing-mail FAILOVER CHAIN for a tenant, priority order me:
 *   Branch PRIMARY -> Org PRIMARY -> Org SECONDARY -> Org/Branch SECONDARY
 *   -> Platform env (hamesha last).
 * Ek bhi tenant SMTP na ho to sirf [platform] milti hai. Decrypt-fail wali
 * settings skip hoti hain (chain kabhi empty nahi hoti).
 */
export async function getTransportChain({ organizationId, schoolId } = {}) {
  const platform = PLATFORM_MAILER();

  // Sirf schoolId aaye (e.g. notification flows) to uska org nikal lo —
  // warna tenant SMTP kabhi match nahi hota aur sab platform se jati hai.
  let orgId = organizationId;
  if (!orgId && schoolId) {
    try {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { organizationId: true },
      });
      orgId = school?.organizationId;
    } catch (_) {
      /* fallback below */
    }
  }
  if (!orgId) return [platform];

  let settings = [];
  try {
    settings = await prisma.orgSecrets.findMany({ where: { organizationId: orgId, category: "SMTP" } });
  } catch (err) {
    logger.logger.error(`[Routing] Transport chain query failed: ${err.message}`);
    return [platform];
  }

  // Sirf is scope ke settings: requested branch ka override ya org default.
  const relevant = settings.filter((s) => !s.schoolId || s.schoolId === schoolId);
  const rank = (s) =>
    (s.tier === "SECONDARY" ? 2 : 0) + (s.schoolId ? 0 : 1);
  relevant.sort((a, b) => rank(a) - rank(b));

  const chain = [];
  for (const s of relevant) {
    try {
      chain.push(await buildMailer(s));
    } catch (err) {
      logger.logger.warn(`[Routing] Skipping OrgSecrets ${s.id}: ${err.message}`);
    }
  }
  chain.push(platform);
  return chain;
}

/**
 * Backward-compatible single-transport resolver — chain ka pehla member.
 */
export async function resolveTransport(context = {}) {
  const chain = await getTransportChain(context);
  return chain[0];
}

/** Test-only helper: cached tenant transports clear karo. */
export function clearTransportCache() {
  transportCache.clear();
}

/**
 * Email branding resolver — rule:
 *   - Super admin / platform context (no organizationId) → PUBLIC primary
 *     image (CLIENT_URL/screen.png) as logo + "School ERP" display name.
 *   - Org/Branch admin context → org/branch logo (school first, then org)
 *     + branded display name.
 * `logoUrl === null` means the template falls back to the public primary image.
 */
export async function resolveEmailBranding({ organizationId, schoolId } = {}) {
  if (!organizationId) {
    return { fromName: PLATFORM_SENDER_NAME, logoUrl: null, themeColor: null };
  }
  const [org, school] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, logoUrl: true, themeColor: true },
    }),
    schoolId
      ? prisma.school.findUnique({
          where: { id: schoolId },
          select: { name: true, logoUrl: true, themeColor: true },
        })
      : Promise.resolve(null),
  ]);
  const fromName = [org?.name, school?.name].filter(Boolean).join(" - ") || PLATFORM_SENDER_NAME;
  const logoUrl = school?.logoUrl || org?.logoUrl || null;
  const themeColor = school?.themeColor || org?.themeColor || null;
  return { fromName, logoUrl, themeColor };
}

function platformCredsMissing() {
  return !process.env.SMTP_USER || !process.env.SMTP_PASS;
}

/**
 * Core sender. Tenant-first routing: org/branch ki DB me saved SMTP settings
 * (OrgSecrets) se jati hai, failover chain ke mutabiq:
 *   Branch PRIMARY -> Org PRIMARY -> Org SECONDARY -> Platform env (last).
 * Platform env sirf tab use hota hai jab tenant SMTP configured na ho ya fail
 * ho. Har tenant transport ka From uska apna authenticated account hota hai.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments,
  organizationId,
  schoolId,
}) => {
  const chain = await getTransportChain({ organizationId, schoolId });

  // Bilkul kuch configured na ho (na tenant, na env) -> mock (dev).
  const hasTenant = chain.some((m) => m.source !== "platform");
  if (!hasTenant && platformCredsMissing()) {
    logger.logger.warn(`SMTP Credentials missing. Mocking email to ${to} | Subject: ${subject}`);
    console.log(
      `\n--- [MOCK EMAIL SENT] ---\nTo: ${to}\nSubject: ${subject}\nBody:\n${text || html}\n${attachments?.length ? `\n[Attachments: ${attachments.map((a) => a.filename).join(", ")}]` : ""}\n-------------------------\n`
    );
    return { mock: true, source: "platform" };
  }

  let lastErr = null;
  for (const mailer of chain) {
    // Platform transport par bhi creds chahiye; missing hon to agla (koi nahi).
    if (mailer.source === "platform" && platformCredsMissing()) continue;

    // Guard (sirf platform): SUPER_ADMIN credential holder ko apni hi bheji
    // hui mail ki copy na aaye. Tenant transports par skip nahi karte —
    // branch admin apne hi address ko test mail bhej sakta hai.
    if (
      mailer.source === "platform" &&
      mailer.holder &&
      to &&
      to.toLowerCase() === mailer.holder
    ) {
      logger.logger.warn(
        `[Email Guard] Skipping email to credential holder (${to}) — Subject: ${subject}`
      );
      return { skipped: true, reason: "Recipient is the SMTP credential holder" };
    }

    let displayName = mailer.fromName;
    if (mailer.source === "platform" && (organizationId || schoolId)) {
      const branding = await resolveEmailBranding({ organizationId, schoolId });
      displayName = branding.fromName || displayName;
    }
    const options = {
      from: `"${displayName}" <${mailer.fromEmail}>`,
      to,
      subject,
      text,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    try {
      const info = await mailer.transporter.sendMail(options);
      logger.logger.info(
        `[${mailer.source}:${mailer.tier || "PRIMARY"}] Email sent to ${to} via ${mailer.fromEmail}: ${info.messageId}`
      );
      return { ...info, source: mailer.source, transportKey: mailer.key };
    } catch (err) {
      lastErr = err;
      logger.logger.warn(
        `[Routing] Transport "${mailer.key}" (${mailer.source}) failed: ${err.message} — trying next in chain`
      );
    }
  }

  throw lastErr || new Error("No SMTP transport available to send email");
};

/**
 * Dispatch OTP via Email when requested
 */
export const sendOtpEmail = async ({ to, recipientName, otp, organizationId, schoolId }) => {
  return sendEmail({
    to,
    subject: `Your School Portal OTP Code`,
    text: `Hello ${recipientName},\n\nYour OTP for login to the Student/Parent Portal is: ${otp}\nValid for 10 minutes. Do not share this with anyone.`,
    html: `<h3>Portal Login OTP</h3><p>Hello ${recipientName},</p><p>Your OTP code is: <b style="font-size: 20px; color: #2b6cb0;">${otp}</b></p><p>Valid for 10 minutes.</p>`,
    organizationId,
    schoolId,
  });
};
