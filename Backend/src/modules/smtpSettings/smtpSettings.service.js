import nodemailer from "nodemailer";
import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { encryptSecret } from "../../lib/utils/secretBox.js";
import { sendEmail } from "../../services/email.service.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("smtp-settings-service");

const TIERS = ["PRIMARY", "SECONDARY"];

const _clampDailyLimit = (v) => {
  const n = parseInt(v, 10);
  if (!n || Number.isNaN(n)) return 500;
  return Math.min(5000, Math.max(100, n));
};

class SmtpSettingsService {
  /**
   * Credentials are strictly per-branch. An ADMIN may only touch a branch it
   * actually administers: its home branch (schoolId) or any extra branch granted
   * through `branchAccess`. Multi-branch admins therefore manage each branch's
   * SMTP separately, and one branch's mail never leaves with another's creds.
   */
  async _assertAccess(requester, organizationId, schoolId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (!schoolId) {
      throw ApiError.badRequestError(
        "schoolId is required - SMTP credentials belong to a branch, not the organization."
      );
    }
    if (requester.role === "SUPER_ADMIN") {
      // Super Admins may reach any org, but the org+branch pair must still be real.
      await this._assertBranchInOrg(organizationId, schoolId);
      return;
    }
    if (requester.role === "ADMIN" && requester.organizationId === organizationId) {
      const allowed = new Set(
        [requester.schoolId, ...(Array.isArray(requester.branchAccess) ? requester.branchAccess : [])].filter(Boolean)
      );
      if (!allowed.has(schoolId)) {
        throw ApiError.forbiddenError("You can only manage SMTP settings for a branch you administer");
      }
    } else {
      throw ApiError.forbiddenError("You cannot manage SMTP settings for this organization");
    }
    await this._assertBranchInOrg(organizationId, schoolId);
  }

  /** A secret row pairs org+branch, so the branch must really belong to that org. */
  async _assertBranchInOrg(organizationId, schoolId) {
    const branch = await prisma.school.findFirst({
      where: { id: schoolId, organizationId },
      select: { id: true },
    });
    if (!branch) throw ApiError.badRequestError("schoolId does not belong to this organization");
  }

  _mask(setting) {
    if (!setting) return null;
    const d = setting.data || {};
    return {
      id: setting.id,
      organizationId: setting.organizationId,
      schoolId: setting.schoolId,
      tier: setting.tier,
      host: d.host,
      port: d.port,
      secure: d.secure,
      username: d.username,
      fromName: d.fromName,
      dailyLimit: d.dailyLimit,
      isVerified: setting.isVerified,
      lastVerifiedAt: setting.lastVerifiedAt,
      lastError: setting.lastError,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  async _find(organizationId, schoolId, tier = "PRIMARY") {
    if (!schoolId) throw ApiError.badRequestError("schoolId is required for SMTP settings");
    return prisma.orgSecrets.findFirst({
      where: { organizationId, schoolId, category: "SMTP", tier },
    });
  }

  _normalizeTier(tier) {
    const value = String(tier || "PRIMARY").toUpperCase();
    if (!TIERS.includes(value)) throw ApiError.badRequestError(`'tier' must be one of: ${TIERS.join(", ")}`);
    return value;
  }

  async verifyConnection({ host, port, secure, username, password }) {
    try {
      const transporter = nodemailer.createTransport({
        host, port, secure, auth: { user: username, pass: password },
        connectionTimeout: 10_000, greetingTimeout: 10_000,
      });
      await transporter.verify();
      transporter.close();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async getStatus(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    // Only this branch's rows are ever read - no org-level pool, so no bleed.
    const rows = await prisma.orgSecrets.findMany({
      where: { organizationId, schoolId, category: "SMTP" },
    });
    const pick = (tier) => this._mask(rows.find((r) => r.tier === tier) || null);

    // Queued school mail — outbox (PendingEmail) rows waiting for a transport.
    // School mail kabhi platform SMTP se nahi jati, to ye rows tab banti hain
    // jab branch SMTP missing ho ya fail ho. Settings UI par warning dikhata hai.
    const queuedWhere = { organizationId, schoolId, status: "PENDING" };
    const [pendingCount, oldestPending] = await Promise.all([
      prisma.pendingEmail.count({ where: queuedWhere }),
      prisma.pendingEmail.findFirst({ where: queuedWhere, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);

    return {
      branch: { primary: pick("PRIMARY"), secondary: pick("SECONDARY") },
      queuedMail: {
        count: pendingCount,
        hasTenantSmtp: rows.length > 0,
        oldestAt: oldestPending?.createdAt || null,
      },
    };
  }

  async upsert(requester, payload) {
    const { organizationId, schoolId, host, port = 587, secure = false, username, password, fromName, dailyLimit, tier = "PRIMARY" } = payload;
    await this._assertAccess(requester, organizationId, schoolId);
    if (!host || !username) throw ApiError.badRequestError("'host' and 'username' are required");
    const effectiveTier = this._normalizeTier(tier);
    const existing = await this._find(organizationId, schoolId, effectiveTier);
    const effectivePassword = password && String(password).length > 0 ? String(password) : null;
    if (!effectivePassword && !existing) throw ApiError.badRequestError("'password' is required for first-time setup");

    let plainPassword = effectivePassword;
    if (!plainPassword) {
      const { decryptSecret } = await import("../../lib/utils/secretBox.js");
      plainPassword = decryptSecret(existing.data?.passwordEnc);
      if (!plainPassword) throw ApiError.badRequestError("Stored password could not be decrypted — enter a new App Password");
    }

    const skipVerification = process.env.SKIP_CREDENTIAL_VERIFICATION === 'true';
    const check = skipVerification
      ? { ok: true }
      : await this.verifyConnection({ host, port: Number(port), secure: Boolean(secure), username, password: plainPassword });
    if (!check.ok) {
      logger.logger.warn(`SMTP verify failed for ${username}: ${check.error}`);
      throw ApiError.badRequestError(`SMTP connection failed: ${check.error}. Check host/port and use a Gmail App Password (2FA required).`);
    }

    const data = {
      host, port: Number(port), secure: Boolean(secure),
      username: String(username).trim().toLowerCase(),
      passwordEnc: encryptSecret(plainPassword),
      fromName: fromName ? String(fromName).trim() : null,
      dailyLimit: _clampDailyLimit(dailyLimit),
    };

    const setting = existing
      ? await prisma.orgSecrets.update({ where: { id: existing.id }, data: { data, isVerified: true, lastVerifiedAt: new Date(), lastError: null } })
      : await prisma.orgSecrets.create({ data: { organizationId, schoolId, category: "SMTP", tier: effectiveTier, data, isVerified: true, lastVerifiedAt: new Date() } });

    logger.logger.info(`SMTP saved [branch:${schoolId}:${effectiveTier}] -> ${data.username}${skipVerification ? ' (verification skipped)' : ''}`);
    return this._mask(setting);
  }

  async remove(requester, organizationId, schoolId, tier) {
    await this._assertAccess(requester, organizationId, schoolId);
    const existing = await this._find(organizationId, schoolId, this._normalizeTier(tier));
    if (!existing) throw ApiError.notFoundError("No SMTP settings found for this scope/tier");
    await prisma.orgSecrets.delete({ where: { id: existing.id } });
    return true;
  }

  async sendTestEmail(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    try {
      const info = await sendEmail({
        to: requester.email, organizationId, schoolId,
        subject: "SMTP Test Email",
        text: "SMTP Test Successful.",
        html: `<h3>SMTP Test Successful</h3><p>If you received this email, outgoing mail is working for this scope.</p>`,
      });
      logger.logger.info(`[Test] SMTP test email sent to ${requester.email}: ${info.messageId}`);
      return { sentTo: requester.email, info };
    } catch (err) {
      throw ApiError.badRequestError(`Test email failed: ${err.message}`);
    }
  }

  async provision(organizationId, schoolId, smtp) {
    if (!smtp || !smtp.host || !smtp.username) return null;
    if (!schoolId) throw ApiError.badRequestError("schoolId is required to provision SMTP settings");
    const password = String(smtp.password || "");
    if (!password) throw ApiError.badRequestError("SMTP password is required when SMTP host/username is provided");
    const tier = this._normalizeTier(smtp.tier);
    const creds = { host: smtp.host, port: Number(smtp.port || 587), secure: Boolean(smtp.secure), username: String(smtp.username).trim().toLowerCase(), password };

    // SKIP_CREDENTIAL_VERIFICATION=true → dev/test mein real credentials ki zaroorat nahi
    const skipVerification = process.env.SKIP_CREDENTIAL_VERIFICATION === 'true';
    const check = skipVerification
      ? { ok: true }
      : await this.verifyConnection(creds);

    const data = {
      host: creds.host, port: creds.port, secure: creds.secure, username: creds.username,
      passwordEnc: encryptSecret(password),
      fromName: smtp.fromName ? String(smtp.fromName).trim() : null,
      dailyLimit: _clampDailyLimit(smtp.dailyLimit),
    };
    const existing = await this._find(organizationId, schoolId, tier);
    const setting = existing
      ? await prisma.orgSecrets.update({ where: { id: existing.id }, data: { data, isVerified: check.ok, lastVerifiedAt: check.ok ? new Date() : null, lastError: check.ok ? null : check.error } })
      : await prisma.orgSecrets.create({ data: { organizationId, schoolId, category: "SMTP", tier, data, isVerified: check.ok, lastVerifiedAt: check.ok ? new Date() : null, lastError: check.ok ? null : check.error } });
    if (skipVerification) {
      logger.logger.info(`SMTP provisioned (verification skipped) [branch:${schoolId}:${tier}] -> ${creds.username}`);
    } else if (!check.ok) {
      logger.logger.warn(`SMTP provisioned but verification failed [branch:${schoolId}:${tier}] -> ${creds.username}: ${check.error}`);
    } else {
      logger.logger.info(`SMTP provisioned [branch:${schoolId}:${tier}] -> ${creds.username}`);
    }
    return { ...this._mask(setting), verificationError: check.ok ? null : check.error };
  }
}

export default new SmtpSettingsService();
