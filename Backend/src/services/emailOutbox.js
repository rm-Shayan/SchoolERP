import Logger from "../lib/utils/logger.js";
import prisma from "../config/db.js";
import { sendEmail } from "./email.service.js";

const logger = new Logger("email-queue");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Per-transport Gmail daily rate-limit detection ──
// 550-5.4.5 = "Daily user sending limit exceeded". Cooldown transport-wise
// hai: ek tenant ki limit hit ho to SIRF uska transport skip hota hai aur
// chain ka agla member (SECONDARY -> platform) foran qaboo leta hai.
const RATE_LIMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_PATTERN = /550[- .]5\.4\.5/;
const rateLimits = new Map(); // transportKey -> cooldown expiry timestamp

const RETRY_SOON_MS = 15 * 60 * 1000; // generic failure → thodi der baad retry
const MAX_PENDING_ATTEMPTS = 5; // iske baad permanent FAILED

function isRateLimited(err) {
  return RATE_LIMIT_PATTERN.test(err?.message || "");
}

function isRateLimitActive(key) {
  return Date.now() < (rateLimits.get(key) || 0);
}

/** Mark rate limit active. Returns true if this was the first call (for logging). */
function markRateLimited(key) {
  if (isRateLimitActive(key)) return false;
  rateLimits.set(key, Date.now() + RATE_LIMIT_COOLDOWN_MS);
  return true;
}

// ── Proactive daily usage counter ──
// Reactive 550-5.4.5 detection ka pehlu ab bhi backstop hai, lekin counter
// se transport limit ke QAREEB pahunchte hi chain ka agla member foran
// qaboo leta hai — Gmail ka rejection error await nahi karna parta.
// Workspace schools apna dailyLimit (2000+) settings me set karte hain.
/**
 * Admin ne dailyLimit zyada set ki ho (e.g. free Gmail par 4000) aur Gmail ne
 * quota pehle hi reject kar diya — OrgSecrets.lastError me hint likh do taake
 * Settings UI par amber warning dikhe. Successful save par ye auto-clear hota hai.
 */
async function flagWrongLimit(mailer) {
  if (!mailer.dailyLimit) return; // platform transport — skip
  const sent = usage.get(mailer.key)?.count ?? 0;
  try {
    await prisma.orgSecrets.update({
      where: { id: mailer.key },
      data: {
        lastError: `Gmail rejected sends after ~${sent} emails today while limit was set to ${mailer.dailyLimit}/day. Aap ka account free Gmail lagta hai — Daily Limit 500/day set karein.`,
      },
    });
    logger.logger.warn(
      `[Rate Limit] Transport "${mailer.key}": configured ${mailer.dailyLimit}/day but Gmail rejected after ~${sent} — lastError hint saved.`
    );
  } catch (e) {
    logger.logger.warn(`[Rate Limit] Could not save lastError hint: ${e.message}`);
  }
}

// ── Payload (de)serialization — attachments Buffers survive JSON round-trip ──
function serializePayload(mail) {
  return JSON.stringify(mail, (_k, v) =>
    Buffer.isBuffer(v) ? { __buffer: true, data: v.toString("base64") } : v
  );
}

function deserializePayload(raw) {
  return JSON.parse(raw, (_k, v) =>
    v && v.__buffer ? Buffer.from(v.data, "base64") : v
  );
}

/**
 * Email ko durable outbox (PendingEmail) me save karo — kuch bhi loss nahi
 * hota. Cron retry job scheduledFor ke baad priority order me nikalta hai.
 */
async function persistPending({ emailData, error, cooldownMs }) {
  const { organizationId, schoolId, priority = "NORMAL", ...mail } = emailData;
  try {
    const row = await prisma.pendingEmail.create({
      data: {
        organizationId: organizationId || null,
        schoolId: schoolId || null,
        payload: serializePayload(mail),
        priority,
        lastError: String(error || "").slice(0, 500),
        scheduledFor: new Date(Date.now() + (cooldownMs || 0)),
      },
    });
    logger.logger.warn(
      `[Outbox] Email #${row.id} for ${mail.to} saved as PENDING (retry at ${row.scheduledFor.toISOString()})`
    );
    return { failed: true, queuedForRetry: true, pendingEmailId: row.id, error };
  } catch (dbErr) {
    logger.logger.error(`[Outbox] Persist failed for ${mail.to}: ${dbErr.message}`);
    return { failed: true, error };
  }
}

/**
 * Deliver an email tenant-first (branch/org SMTP settings from DB), with the
 * env (platform) transport as last-resort fallback. Fail hone par email outbox
 * me PERSIST hoti hai (drop nahi), cron auto-retry karta hai.
 *
 * Never throws — callers can safely `await queueEmail(...)` in their flows.
 */
export const queueEmail = async (emailData, attempts = 3) => {
  const { organizationId, schoolId, priority = "NORMAL", ...mail } = emailData;

  let lastErr = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const info = await sendEmail({ ...mail, organizationId, schoolId });
      const attachNote = mail.attachments?.length
        ? ` | attachments: ${mail.attachments.map((a) => a.filename).join(", ")}`
        : "";
      logger.logger.info(
        `[${info.source || "platform"}] Email sent to ${mail.to}: ${info.messageId}${attachNote}`
      );
      return info;
    } catch (err) {
      lastErr = err;
      logger.logger.error(
        `Email attempt ${attempt}/${attempts} failed for ${mail.to}: ${err.message}`
      );
      if (attempt < attempts) await sleep(1000 * attempt);
    }
  }

  logger.logger.error(`All attempts exhausted for ${mail.to} — saving to outbox`);
  return persistPending({
    emailData,
    error: lastErr?.message || "Send failed",
    cooldownMs: RETRY_SOON_MS,
  });
};

/**
 * Outbox worker — PENDING emails utha kar priority order me retry karta hai.
 * Cron har 30 min call karta hai. Returns summary for logging.
 */
export const retryPendingEmails = async (limit = 100) => {
  const rows = await prisma.pendingEmail.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: new Date() },
      attempts: { lt: MAX_PENDING_ATTEMPTS },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const summary = { total: rows.length, sent: 0, deferred: 0, failedPermanent: 0 };

  for (const row of rows) {
    let mail;
    try {
      mail = deserializePayload(row.payload);
    } catch {
      await prisma.pendingEmail.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: "Corrupt payload" },
      });
      summary.failedPermanent += 1;
      continue;
    }

    const ctx = {
      organizationId: row.organizationId || undefined,
      schoolId: row.schoolId || undefined,
    };

    let sentInfo = null;
    let lastErr = null;
    try {
      sentInfo = await sendEmail({ ...mail, ...ctx });
    } catch (err) {
      lastErr = err;
    }

    if (sentInfo && !sentInfo.mock && !sentInfo.skipped) {
      await prisma.pendingEmail.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null, attempts: { increment: 1 } },
      });
      logger.logger.info(`[Outbox] Retry OK #${row.id} -> ${mail.to}: ${sentInfo.messageId}`);
      summary.sent += 1;
      continue;
    }
    if (sentInfo) {
      // mock (SMTP not configured) ya skipped — abhi bekar, thodi der baad dobara
      await prisma.pendingEmail.update({
        where: { id: row.id },
        data: { scheduledFor: new Date(Date.now() + RETRY_SOON_MS) },
      });
      summary.deferred += 1;
      continue;
    }

    const attemptsUsed = row.attempts + 1;
    const wasRateLimited = lastErr && isRateLimited(lastErr);
    const permanentlyFailed = !wasRateLimited && attemptsUsed >= MAX_PENDING_ATTEMPTS;
    await prisma.pendingEmail.update({
      where: { id: row.id },
      data: {
        attempts: attemptsUsed,
        lastError: String(lastErr?.message || "All transports rate-limited").slice(0, 500),
        status: permanentlyFailed ? "FAILED" : "PENDING",
        scheduledFor: wasRateLimited
          ? new Date(Date.now() + RATE_LIMIT_COOLDOWN_MS)
          : new Date(Date.now() + RETRY_SOON_MS),
      },
    });
    if (permanentlyFailed) summary.failedPermanent += 1;
    else summary.deferred += 1;
  }

  return summary;
};
