import fs from "fs";
import path from "path";
import { sendEmail } from "./email.service.js";
import { queueEmail } from "./emailOutbox.js";
import { parentNotificationEmail } from "./email.templates.js";
import prisma from "../config/db.js";
import storageService from "./storage.service.js";
import Logger from "../lib/utils/logger.js";
import { emitToRoom } from "../config/websocket.js";
import portalNotificationService from "../modules/notification/notification.portalService.js";

const logger = new Logger("notification-service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const EMAIL_LOGO_CACHE = new Map();
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
      name: true, address: true, phone: true, logoUrl: true, organizationId: true,
      organization: { select: { name: true, logoUrl: true, themeColor: true } },
    },
  });
  SCHOOL_CACHE.set(schoolId, { data: school, ts: Date.now() });
  return school;
}

class NotificationService {
  /**
   * Unified Notification Dispatcher — Email channel only.
   *
   * @param {string} params.schoolId
   * @param {string} [params.parentEmail]
   * @param {string} [params.parentPhone]
   * @param {string} params.message
   * @param {string} [params.title]
   * @param {Array}  [params.details]
   * @param {Array}  [params.attachments]
   * @param {object} [params.receipt]
   */
  async notifyParent({ schoolId, parentEmail, parentPhone, message, title = "School ERP Notification", details = [], attachments, receipt }) {
    const detailsText = details.length
      ? "\n" + details.map(([label, value]) => `${label}: ${value}`).join("\n")
      : "";
    const fullMessage = `${message}${detailsText}`;

    // EMAIL — primary notification channel
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
   */
  async notifyParentPortal({ schoolId, title = "School ERP Notification", message, details = [] }) {
    if (!schoolId) return { success: false, reason: "No schoolId" };
    const detailsText = details.length
      ? "\n" + details.map(([label, value]) => `${label}: ${value}`).join("\n")
      : "";
    const record = await portalNotificationService.create({
      schoolId, senderName: "System", title,
      body: `${message}${detailsText}`, category: "ATTENDANCE",
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
            themeColor: school?.organization?.themeColor || "#00236f",
            title, message, details,
            address: school?.address || undefined,
            phone: school?.phone || undefined,
            receipt,
          });
        }
      } catch (err) {
        logger.logger.warn(`[Notification] Branded email render failed (fallback plain): ${err.message}`);
      }
      const result = await queueEmail({ to, subject: title, text, html, attachments, schoolId: schoolId || undefined, organizationId });

      // Outbox honesty: agar Gmail daily limit lag gayi to email drop NAHI
      // hui — PendingEmail me persist hui hai aur cron retry karega. Log
      // status bhi PENDING rakho taake dashboard sach dikhaye.
      if (logRecord) {
        const deferred = Boolean(result?.queuedForRetry);
        await prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: deferred ? "PENDING" : "SENT",
            ...(deferred ? { errorReason: "Queued for retry — tenant daily mail limit" } : { sentAt: new Date() }),
          },
        });
        this._emitUpdate(schoolId, logRecord.id, deferred ? "PENDING" : "SENT", to);
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
   */
  async sendBulkParentEmails(schoolId, title, message, recipients) {
    const emailed = new Set();
    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const email = r.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email) || emailed.has(email)) continue;
      emailed.add(email);
      try {
        let school = null;
        let html = `<h3>${title}</h3><p>${message.replace(/\n/g, "<br/>")}</p>`;
        try {
          school = await getCachedSchool(schoolId);
          const logoUrl = await this._resolveEmailLogo(school?.logoUrl || school?.organization?.logoUrl || undefined, school?.organizationId);
          html = parentNotificationEmail({
            schoolName: school?.name || "School", orgName: school?.organization?.name || undefined,
            logoUrl, themeColor: school?.organization?.themeColor || "#00236f", title, message,
          });
        } catch { /* plain fallback */ }
        await queueEmail({ to: email, subject: title, text: message, html, schoolId, organizationId: school?.organizationId });
        sent++;
      } catch { failed++; }
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

    for (const r of recipients) {
      const email = r.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email) || emailed.has(email)) continue;
      emailed.add(email);
      try {
        let school = null;
        let html = `<h3>${title}</h3><p>${r.message.replace(/\n/g, "<br/>")}</p>`;
        try {
          school = await getCachedSchool(schoolId);
          const logoUrl = await this._resolveEmailLogo(school?.logoUrl || school?.organization?.logoUrl || undefined, school?.organizationId);
          html = parentNotificationEmail({
            schoolName: school?.name || "School", orgName: school?.organization?.name || undefined,
            logoUrl, themeColor: school?.organization?.themeColor || "#00236f", title, message: r.message,
          });
        } catch { /* plain fallback */ }
        await queueEmail({ to: email, subject: title, text: r.message, html, schoolId, organizationId: school?.organizationId });
        sent++;
      } catch { failed++; }
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
