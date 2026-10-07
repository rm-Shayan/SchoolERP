import fs from "fs";
import path from "path";
import { sendEmail } from "./email.service.js";
import { queueEmail } from "./emailOutbox.js";
import { queueWhatsApp } from "./whatsappOutbox.js";
import { normalizePkPhone } from "../lib/utils/phone.js";
import { parentNotificationEmail } from "./email.templates.js";
import { applyMailOverride } from "./emailTemplateRegistry.js";
import emailTemplatesService from "../modules/emailTemplates/emailTemplates.service.js";
import prisma from "../config/db.js";
import storageService from "./storage.service.js";
import Logger from "../lib/utils/logger.js";
import { emitToRoom } from "../config/websocket.js";
import portalNotificationService from "../modules/notification/notification.portalService.js";

const logger = new Logger("notification-service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const EMAIL_LOGO_CACHE = new Map();

// Bulk email latency guards: har send time-bounded, aur recipients ek saath
// (batch) bhejte hain — 300 parents = 300 × SMTP RTT nahi.
const BULK_EMAIL_CONCURRENCY = 5;
const BULK_EMAIL_TIMEOUT_MS = 5000;
// School data cache for circular notifications — avoids N+1 DB lookups
// when sending emails to many parents/staff of the same school.
const SCHOOL_CACHE = new Map();
const SCHOOL_CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch school data with in-memory cache. Same school is hit dozens of
 * times in a single circular dispatch; one DB query replaces them all.
 */
async function getCachedSchool(schoolId) {
  const cached = SCHOOL_CACHE.get(schoolId);
  if (cached && Date.now() - cached.ts < SCHOOL_CACHE_TTL) return cached.data;
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      name: true, address: true, phone: true, logoUrl: true, themeColor: true, organizationId: true,
      organization: { select: { name: true, logoUrl: true, themeColor: true } },
    },
  });
  SCHOOL_CACHE.set(schoolId, { data: school, ts: Date.now() });
  return school;
}

class NotificationService {
  /**
   * Unified Notification Dispatcher — WhatsApp pehle (agar branch ka instance
   * ready hai), email fallback. Kuch bhi bheja hi nahi to FAILED log entry.
   *
   * WhatsApp ADDITIONAL channel hai, email replacement nahi: agar instance
   * disconnected/disabled hai to email purana behavior chalate hain — koi
   * message kho nahi jata.
   *
   * @param {string} params.schoolId
   * @param {string} [params.parentEmail]
   * @param {string} [params.parentPhone]
   * @param {string} [params.parentWhatsapp]  normalized ya raw PK number
   * @param {string} params.message
   * @param {string} [params.title]
   * @param {Array}  [params.details]
   * @param {Array}  [params.attachments]
   * @param {object} [params.receipt]
   */
  async notifyParent({ schoolId, parentEmail, parentPhone, parentWhatsapp, message, title = "School ERP Notification", details = [], attachments, receipt }) {
    const detailsText = details.length
      ? "\n" + details.map(([label, value]) => `${label}: ${value}`).join("\n")
      : "";
    const fullMessage = `${message}${detailsText}`;

    // WHATSAPP — primary if branch has a connected instance.
    if (parentWhatsapp && schoolId) {
      const wa = await this._sendWhatsApp({
        schoolId, to: parentWhatsapp, title, message, details, fullMessage, receipt,
      });
      if (wa?.success) return wa;
    }

    // EMAIL — fallback / primary when WhatsApp is unavailable.
    if (parentEmail && EMAIL_RE.test(parentEmail)) {
      return this._sendEmail({ schoolId, to: parentEmail, title, message, details, fullMessage, attachments, receipt });
    }

    // Invalid or missing email — log why delivery was skipped.
    const reason = !parentEmail ? "No parent email configured" : "Invalid email format";
    if (schoolId) {
      await this._logNotification({
        schoolId,
        recipient: parentEmail || parentPhone || "unknown",
        channel: "EMAIL",
        message: `[${title}] ${message}`,
        status: "FAILED",
        errorReason: reason,
      });
    }

    logger.logger.warn(
      `[Notification] ${reason} for schoolId=${schoolId}. Skipping email.`
    );
    return { success: false, reason };
  }

  /**
   * In-app (PORTAL) dispatch — NO email/SMS goes out. Sirf NotificationLog
   * entry (channel=PORTAL) + dashboard realtime emit. Fee PAID jaise alerts
   * ke liye jo parent ko email pe nahi bhejne.
   *
   * @param {string} [params.recipientId] — parent portal user id. Jab set ho
   *   to notification SIRF us parent ko dikhti hai (no school-wide leak).
   * @param {string} [params.category] — FEE/ATTENDANCE/etc (default ATTENDANCE).
   */
  async notifyParentPortal({ schoolId, recipientId, title = "School ERP Notification", message, details = [], category = "ATTENDANCE" }) {
    if (!schoolId) return { success: false, reason: "No schoolId" };
    const detailsText = details.length
      ? "\n" + details.map(([label, value]) => `${label}: ${value}`).join("\n")
      : "";
    const record = await portalNotificationService.create({
      schoolId, recipientId, senderName: "System", title,
      body: `${message}${detailsText}`, category,
    });
    return record ? { success: true, channel: "PORTAL", id: record.id } : { success: false };
  }

  /**
   * Notify Org/School Admin — Email channel.
   */
  async notifyOrgAdmin({ schoolId, adminEmail, adminPhone, message, title = "School Admin Alert", details = [] }) {
    const detailsText = details.length
      ? "\n" + details.map(([label, value]) => `${label}: ${value}`).join("\n")
      : "";
    const fullMessage = `${message}${detailsText}`;

    if (adminEmail) {
      return this._sendEmail({
        schoolId, to: adminEmail, title, message, details, fullMessage,
      });
    }

    if (schoolId) {
      await this._logNotification({
        schoolId,
        recipient: adminPhone || adminEmail || "unknown",
        channel: "EMAIL",
        message: `[${title}] ${message}`,
        status: "FAILED",
        errorReason: "No admin email configured",
      });
    }

    logger.logger.warn(
      `[Notification] No admin email for schoolId=${schoolId}. Skipping admin notification.`
    );
    return { success: false, reason: "No admin email available" };
  }

  async getSchoolAdmins(schoolId) {
    const admins = await prisma.user.findMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true, phone: true },
    });
    return admins;
  }

  async _sendEmail({ schoolId, to, title, message, details = [], fullMessage, attachments, receipt }) {
    const text = fullMessage || `${message}${details.length ? "\n" + details.map(([l, v]) => `${l}: ${v}`).join("\n") : ""}`;
    let logRecord = null;
    try {
      if (schoolId) {
        logRecord = await this._logNotification({
          schoolId, recipient: to, channel: "EMAIL",
          message: `[${title}] ${text}`, status: "PENDING",
        });
      }

      let school = null;
      let organizationId = null;
      let html = `<h3 style="color:#2b6cb0;">${title}</h3><p>${message.replace(/\n/g, "<br/>")}</p><hr><small>School Management System</small>`;
      try {
        if (schoolId) {
          school = await getCachedSchool(schoolId);
          organizationId = school?.organizationId || null;
          const logoUrl = await this._resolveEmailLogo(
            school?.logoUrl || school?.organization?.logoUrl || undefined,
            organizationId
          );
          html = parentNotificationEmail({
            schoolName: school?.name || "School",
            orgName: school?.organization?.name || undefined,
            logoUrl,
            themeColor: school?.themeColor || school?.organization?.themeColor || "#00236f",
            title, message, details,
            address: school?.address || undefined,
            phone: school?.phone || undefined,
            receipt,
          });
        }
      } catch (err) {
        logger.logger.warn(`[Notification] Branded email render failed (fallback plain): ${err.message}`);
      }
      // Org admin ka customized template override — built-in body/qurat hi badle,
      // subject bhi. Warna (koi row nahi) exactly waise hi send hota hai jaisa pehle.
      if (organizationId) {
        try {
          const override = await emailTemplatesService.getOverride(organizationId, "parent_notification");
          if (override) {
            const final = applyMailOverride(
              { subject: title, html },
              override,
              {
                schoolName: school?.name || "School",
                orgName: school?.organization?.name || "",
                title,
                message: message.replace(/\n/g, " "),
                address: school?.address || "",
                phone: school?.phone || "",
                loginUrl: "",
              }
            );
            html = final.html;
            title = final.subject;
          }
        } catch (err) {
          logger.logger.warn(`[Notification] Template override failed (using built-in): ${err.message}`);
        }
      }
      // Latency bound: ek attempt, max 5s. Slow SMTP par outbox me persist ho
      // jata hai aur cron deliver karta hai — request turant return hota hai.
      const result = await queueEmail({ to, subject: title, text, html, attachments, schoolId: schoolId || undefined, organizationId, allowPlatformFallback: false }, 1, 5000);

      // Outbox honesty: agar Gmail daily limit lag gayi to email drop NAHI
      // hui — PendingEmail me persist hui hai aur cron retry karega. Log
      // status bhi PENDING rakho taake dashboard sach dikhaye.
      if (logRecord) {
        const deferred = Boolean(result?.queuedForRetry);
        const skipped = Boolean(result?.skipped);
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: deferred ? "PENDING" : skipped ? "FAILED" : "SENT",
            ...(deferred
              ? { errorReason: "Queued for retry — tenant daily mail limit" }
              : skipped
                ? { errorReason: "Skipped — recipient is the SMTP credential holder (self-send)" }
                : { sentAt: new Date() }),
          },
        });
        this._emitUpdate(schoolId, logRecord.id, deferred ? "PENDING" : skipped ? "FAILED" : "SENT", to);
      }

      return {
        success: true,
        recipient: to,
        status: result?.queuedForRetry ? "PENDING_RETRY" : "SENT",
        channel: "EMAIL",
      };
    } catch (error) {
      logger.logger.error(`[Notification] Email dispatch failed for ${to}: ${error.message}`);
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: { status: "FAILED", errorReason: error.message },
        });
        this._emitUpdate(schoolId, logRecord.id, "FAILED", to, error.message);
      }
      return { success: false, recipient: to, error: error.message, channel: "EMAIL" };
    }
  }

  /**
   * WhatsApp dispatch — branch ka instance use karta hai.
   *
   * Guarded hai: branch ka instance exists + `isEnabled` + `CONNECTED` na ho
   * to **kuch nahi bheja** aur `success:false` return hota hai — caller phir
   * email fallback chalata hai. Isi liye WhatsApp kisi existing flow ko break
   * nahi kar sakta.
   *
   * WhatsApp plain-text hai (HTML nahi) — is liye `fullMessage` bhejte hain.
   */
  async _sendWhatsApp({ schoolId, to, title, message, details = [], fullMessage, receipt }) {
    const normalized = normalizePkPhone(to);
    if (!normalized) {
      logger.logger.warn(`[WhatsApp] Invalid recipient number (${to}) for schoolId=${schoolId} — skipping to email fallback.`);
      return { success: false, channel: "WHATSAPP", error: "Invalid phone number" };
    }

    let instance;
    try {
      instance = await prisma.whatsAppInstance.findFirst({
        where: { schoolId },
        select: { instanceName: true, organizationId: true, integration: true, isEnabled: true, state: true, dailyQuotaUsed: true },
      });
    } catch (err) {
      logger.logger.warn(`[WhatsApp] Instance lookup failed for schoolId=${schoolId}: ${err.message}`);
      return { success: false, channel: "WHATSAPP", error: err.message };
    }

    if (!instance || !instance.isEnabled || instance.state !== "CONNECTED") {
      const why = !instance
        ? "no instance"
        : !instance.isEnabled
          ? "disabled"
          : `state=${instance.state}`;
      return { success: false, channel: "WHATSAPP", error: `Instance not sendable (${why})` };
    }

    const body = [fullMessage || message, receipt ? `Receipt: ${receipt}` : null]
      .filter(Boolean)
      .join("\n\n");

    let logRecord = null;
    try {
      logRecord = await prisma.notificationLog.create({
        data: {
          schoolId,
          recipient: normalized,
          channel: "WHATSAPP",
          message: `[${title}] ${message}`,
          status: "PENDING",
        },
      });
    } catch (err) {
      logger.logger.warn(`[WhatsApp] NotificationLog create failed: ${err.message}`);
    }

    try {
      const isCloud = instance.integration === "WHATSAPP_CLOUD";
      const result = await queueWhatsApp(
        {
          organizationId: instance.organizationId || undefined,
          schoolId,
          to: normalized,
          // Cloud API me free-form text 24h customer window ke BAHAAR 131047
          // deta hi hai — approved template hi reliable channel hai proactive
          // alerts ke liye. Name/env se aata hai (dev me jaspers_market_plain_text_v1).
          ...(isCloud
            ? {
                template: {
                  name: process.env.WHATSAPP_META_TEMPLATE || "",
                  language: process.env.WHATSAPP_META_TEMPLATE_LANG || "en",
                  components: [],
                },
              }
            : {}),
          text: body,
          priority: "NORMAL",
        },
        2, // request path me kam retries — zyada lamba khada nahi kar sakte
        8000
      );

      const status = result?.queued ? "SENT" : "PENDING";

      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status,
            ...(result?.queued
              ? { sentAt: new Date() }
              : { errorReason: `Queued for retry — ${result?.error || "send deferred"}` }),
          },
        });
        this._emitUpdate(schoolId, logRecord.id, status, normalized);
      }

      return {
        success: true,
        recipient: normalized,
        status: result?.queued ? "SENT" : "PENDING_RETRY",
        channel: "WHATSAPP",
      };
    } catch (error) {
      logger.logger.error(`[WhatsApp] Dispatch failed for ${normalized}: ${error.message}`);
      if (logRecord) {
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: { status: "FAILED", errorReason: error.message },
        });
        this._emitUpdate(schoolId, logRecord.id, "FAILED", normalized, error.message);
      }
      return { success: false, recipient: normalized, error: error.message, channel: "WHATSAPP" };
    }
  }

  async sendEmail({ to, subject, text, html }) {
    return sendEmail({ to, subject, text, html });
  }

  async _resolveEmailLogo(logoUrl, organizationId) {
    if (!logoUrl || !logoUrl.startsWith("data:")) return logoUrl;
    if (EMAIL_LOGO_CACHE.has(logoUrl)) return EMAIL_LOGO_CACHE.get(logoUrl);
    try {
      const comma = logoUrl.indexOf(",");
      if (comma === -1) return logoUrl;
      const buffer = Buffer.from(logoUrl.slice(comma + 1), "base64");
      const { url } = await storageService.uploadImage({ buffer, folder: "org-logos", organizationId });
      if (url) {
        if (EMAIL_LOGO_CACHE.size > 100) EMAIL_LOGO_CACHE.clear();
        EMAIL_LOGO_CACHE.set(logoUrl, url);
        logger.logger.info(`[Notification] data: logo -> ${url} (email-safe)`);
        return url;
      }
    } catch (err) {
      logger.logger.warn(`[Notification] Logo upload failed (${err.message}) -- original URL use`);
    }
    return logoUrl;
  }

  async _logNotification({ schoolId, recipient, channel, message, status, errorReason }) {
    const record = await prisma.notificationLog.create({
      data: { schoolId, recipient, channel, message, status, errorReason },
    });
    const payload = {
      id: record.id, recipient, channel,
      title: (message.match(/^\[(.*?)\]/) || [])[1] || "Notification",
      status: record.status, createdAt: record.createdAt,
    };
    emitToRoom(`school:${schoolId}`, "notification_created", payload);
    // NOTE: super_admins room ko school-level notifications NAHI bhejte —
    // platform owner ko sirf platform events (org create/delete waghera)
    // milte hain. Branch ki leave/absent/fee updates uske kaam nahi.
    return record;
  }

  _emitUpdate(schoolId, logId, status, recipient, error) {
    const payload = { id: logId, status, recipient, errorReason: error || null, updatedAt: new Date() };
    emitToRoom(`school:${schoolId}`, "notification_status_updated", payload);
  }

  /**
 * Bulk parent email dispatch — sends branded emails to many parents WITHOUT
   * creating an individual NotificationLog per recipient. Instead creates ONE
   * summary log so the admin panel stays clean (e.g. "300 parent emails sent").
   *
   * Latency: recipients CONCURRENTLY (max BULK_EMAIL_CONCURRENCY per batch)
   * aur har send time-bounded — 300 parents = 300 × RTT nahi.
   */
  async sendBulkParentEmails(schoolId, title, message, recipients) {
    const emailed = new Set();
    let sent = 0;
    let failed = 0;

    const targets = [];
    for (const r of recipients) {
      const email = r.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email) || emailed.has(email)) continue;
      emailed.add(email);
      targets.push(email);
    }

    const deliverOne = async (email) => {
      try {
        let school = null;
        let html = `<h3>${title}</h3><p>${message.replace(/\n/g, "<br/>")}</p>`;
        try {
          school = await getCachedSchool(schoolId);
          const logoUrl = await this._resolveEmailLogo(school?.logoUrl || school?.organization?.logoUrl || undefined, school?.organizationId);
          html = parentNotificationEmail({
            schoolName: school?.name || "School", orgName: school?.organization?.name || undefined,
            logoUrl, themeColor: school?.themeColor || school?.organization?.themeColor || "#00236f", title, message,
          });
        } catch { /* plain fallback */ }
        await queueEmail({ to: email, subject: title, text: message, html, schoolId, organizationId: school?.organizationId, allowPlatformFallback: false }, 1, BULK_EMAIL_TIMEOUT_MS);
        return true;
      } catch {
        return false;
      }
    };

    for (let i = 0; i < targets.length; i += BULK_EMAIL_CONCURRENCY) {
      const batch = targets.slice(i, i + BULK_EMAIL_CONCURRENCY);
      const results = await Promise.all(batch.map(deliverOne));
      sent += results.filter(Boolean).length;
      failed += results.length - results.filter(Boolean).length;
    }

    // ONE summary log for admin panel
    if (schoolId) {
      await this._logNotification({
        schoolId, recipient: "ADMIN", channel: "EMAIL",
        message: `[${title}] ${sent} parent email(s) sent${failed ? `, ${failed} failed` : ""}`,
        status: failed === sent ? "FAILED" : "SENT",
      });
    }
    return { sent, failed };
  }

  /**
   * Bulk individualized email dispatch — each recipient gets a CUSTOM message
   * (e.g. exam results per student). ONE summary log for admin panel.
   *
   * @param {Array<{email: string, message: string}>} recipients
   */
  async sendBulkIndividualEmails(schoolId, title, recipients) {
    const emailed = new Set();
    let sent = 0;
    let failed = 0;

    const targets = [];
    for (const r of recipients) {
      const email = r.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email) || emailed.has(email)) continue;
      emailed.add(email);
      targets.push({ email, message: r.message });
    }

    const deliverOne = async ({ email, message: msg }) => {
      try {
        let school = null;
        let html = `<h3>${title}</h3><p>${msg.replace(/\n/g, "<br/>")}</p>`;
        try {
          school = await getCachedSchool(schoolId);
          const logoUrl = await this._resolveEmailLogo(school?.logoUrl || school?.organization?.logoUrl || undefined, school?.organizationId);
          html = parentNotificationEmail({
            schoolName: school?.name || "School", orgName: school?.organization?.name || undefined,
            logoUrl, themeColor: school?.themeColor || school?.organization?.themeColor || "#00236f", title, message: msg,
          });
        } catch { /* plain fallback */ }
        await queueEmail({ to: email, subject: title, text: msg, html, schoolId, organizationId: school?.organizationId, allowPlatformFallback: false }, 1, BULK_EMAIL_TIMEOUT_MS);
        return true;
      } catch {
        return false;
      }
    };

    for (let i = 0; i < targets.length; i += BULK_EMAIL_CONCURRENCY) {
      const batch = targets.slice(i, i + BULK_EMAIL_CONCURRENCY);
      const results = await Promise.all(batch.map(deliverOne));
      sent += results.filter(Boolean).length;
      failed += results.length - results.filter(Boolean).length;
    }

    if (schoolId) {
      await this._logNotification({
        schoolId, recipient: "ADMIN", channel: "EMAIL",
        message: `[${title}] ${sent} parent email(s) sent${failed ? `, ${failed} failed` : ""}`,
        status: failed === sent ? "FAILED" : "SENT",
      });
    }
    return { sent, failed };
  }
}

export default new NotificationService();
