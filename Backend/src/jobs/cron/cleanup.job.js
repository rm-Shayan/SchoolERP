import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import authRepository from "../../modules/auth/repository.js";

const logger = new Logger("cleanup-job");

// Retention windows (din) — env se override ho sakti hain.
const AUDIT_LOG_RETENTION_DAYS = Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 180;
const NOTIFICATION_LOG_RETENTION_DAYS = Number(process.env.NOTIFICATION_LOG_RETENTION_DAYS) || 90;
const CONDUCT_REMARK_RETENTION_DAYS = Number(process.env.CONDUCT_REMARK_RETENTION_DAYS) || 365;
const HOMEWORK_BROADCAST_RETENTION_DAYS = Number(process.env.HOMEWORK_BROADCAST_RETENTION_DAYS) || 180;

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Daily Data Cleanup Job (node-cron — daily 3:00 AM).
 * Dead/session data ko hatata hai taake tables na barhen:
 * 1. RefreshToken      — expired ya revoked (dead sessions)
 * 2. OtpCode           — expired ya already used OTPs
 * 3. AuditLog          — retention window se pehle wale purane logs
 * 4. NotificationLog   — retention window se pehle wale purane notification logs
 * 5. ConductRemark     — old teacher remarks (summary rehti hai, raw purane delete)
 * 6. HomeworkBroadcast — old homework broadcasts
 */
export async function runCleanupJob() {
  logger.logger.info("[Cleanup] Starting scheduled data cleanup...");
  const summary = {};

  try {
    // 1. Refresh tokens — expired ya revoked
    const tokens = await authRepository.deleteExpiredTokens();
    summary.refreshTokens = tokens.count;
    logger.logger.info(`[Cleanup] Deleted ${tokens.count} expired/revoked refresh token(s).`);

    // 2. OTP codes — expired ya used
    const otps = await prisma.otpCode.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }] },
    });
    summary.otpCodes = otps.count;
    logger.logger.info(`[Cleanup] Deleted ${otps.count} expired/used OTP code(s).`);

    // 3. Purane audit logs
    const logs = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: daysAgo(AUDIT_LOG_RETENTION_DAYS) } },
    });
    summary.auditLogs = logs.count;
    logger.logger.info(`[Cleanup] Deleted ${logs.count} audit log(s) older than ${AUDIT_LOG_RETENTION_DAYS}d.`);

    // 4. Purane notification logs
    const notifs = await prisma.notificationLog.deleteMany({
      where: { createdAt: { lt: daysAgo(NOTIFICATION_LOG_RETENTION_DAYS) } },
    });
    summary.notificationLogs = notifs.count;
    logger.logger.info(`[Cleanup] Deleted ${notifs.count} notification log(s) older than ${NOTIFICATION_LOG_RETENTION_DAYS}d.`);

    // 5. Purane conduct remarks
    const remarks = await prisma.conductRemark.deleteMany({
      where: { createdAt: { lt: daysAgo(CONDUCT_REMARK_RETENTION_DAYS) } },
    });
    summary.conductRemarks = remarks.count;
    logger.logger.info(`[Cleanup] Deleted ${remarks.count} conduct remark(s) older than ${CONDUCT_REMARK_RETENTION_DAYS}d.`);

    // 6. Purane homework broadcasts (model timestamp = sentAt)
    const hw = await prisma.homeworkBroadcast.deleteMany({
      where: { sentAt: { lt: daysAgo(HOMEWORK_BROADCAST_RETENTION_DAYS) } },
    });
    summary.homeworkBroadcasts = hw.count;
    logger.logger.info(`[Cleanup] Deleted ${hw.count} homework broadcast(s) older than ${HOMEWORK_BROADCAST_RETENTION_DAYS}d.`);

    logger.logger.info(`[Cleanup] Done. ${JSON.stringify(summary)}`);
    return { success: true, ...summary };
  } catch (error) {
    logger.logger.error(`[Cleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runCleanupJob;
