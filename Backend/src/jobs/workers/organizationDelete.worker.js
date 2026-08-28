import { Worker } from "bullmq";
import prisma from "../../config/db.js";
import redis from "../../config/redis.js";
import Logger from "../../lib/utils/logger.js";
import { createRedisConnection } from "../../lib/redis.connection.js";
import auditService from "../../modules/audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../modules/audit/actions.js";

const logger = new Logger("organization-delete-worker");

/**
 * Worker: organization-delete
 *
 * Receives: { id: string } — the organization ID to delete
 *
 * Deletes the organization together with EVERYTHING related to it:
 * branches, students, staff users, fees, attendance, timetables, exams,
 * activities, applicants, etc. Deletion runs inside a single transaction
 * in dependency order (children before parents) so it never trips over
 * the schema's RESTRICT foreign keys regardless of how deeply data is nested.
 *
 * The only exception: org-level SUPER_ADMIN accounts are detached (their
 * organizationId is nulled) instead of deleted, so the platform admin who
 * performed the deletion keeps their login.
 */
const worker = new Worker(
  "organization-delete",
  async (job) => {
    const { id, actor } = job.data;
    logger.logger.info(`[organization-delete] Starting delete job ${job.id} for org: ${id}`);

    // Confirm org still exists before deleting
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      logger.logger.warn(`[organization-delete] Organization ${id} not found — already deleted?`);
      return { deleted: false, reason: "Organization not found" };
    }

    // Collect image URLs BEFORE the data is wiped — the org logo and every
    // branch logo are removed from storage afterwards (no orphaned files).
    const branchLogos = (
      await prisma.school.findMany({
        where: { organizationId: id },
        select: { logoUrl: true },
      })
    )
      .map((s) => s.logoUrl)
      .filter(Boolean);

    const schoolIdFilter = {
      in: (
        await prisma.school.findMany({ where: { organizationId: id }, select: { id: true } })
      ).map((s) => s.id),
    };

    // Timeout options zaroori hain: default 5s interactive transaction Neon
    // (remote DB) par cascade deletes ke liye kam pad jata hai → "expired
    // transaction" error aur org kabhi delete nahi hota.
    await prisma.$transaction(async (tx) => {
      // Detach org-level SUPER_ADMIN accounts so they survive the org delete.
      await tx.user.updateMany({
        where: { organizationId: id, role: "SUPER_ADMIN" },
        data: { organizationId: null },
      });

      // Children first — every nested model is removed before its parent.
      await tx.timetableSlot.deleteMany({ where: { section: { class: { schoolId: schoolIdFilter } } } });
      await tx.examResult.deleteMany({ where: { student: { schoolId: schoolIdFilter } } });
      await tx.conductRemark.deleteMany({ where: { student: { schoolId: schoolIdFilter } } });
      await tx.feePayment.deleteMany({ where: { feeRecord: { student: { schoolId: schoolIdFilter } } } });
      await tx.feeRecord.deleteMany({ where: { student: { schoolId: schoolIdFilter } } });
      await tx.feeLineItem.deleteMany({ where: { feeStructure: { schoolId: schoolIdFilter } } });
      await tx.feeStructure.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.homeworkBroadcast.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.attendanceRecord.deleteMany({ where: { student: { schoolId: schoolIdFilter } } });
      await tx.promotionRecord.deleteMany({ where: { student: { schoolId: schoolIdFilter } } });
      await tx.applicant.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.activity.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.circular.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.pTMSession.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.notificationLog.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.exam.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.term.deleteMany({ where: { academicYear: { schoolId: schoolIdFilter } } });
      await tx.academicYear.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.subject.deleteMany({ where: { class: { schoolId: schoolIdFilter } } });
      await tx.section.deleteMany({ where: { class: { schoolId: schoolIdFilter } } });
      await tx.class.deleteMany({ where: { schoolId: schoolIdFilter } });
      await tx.student.deleteMany({ where: { schoolId: schoolIdFilter } });
      // Branch staff — RefreshToken rows cascade with each user.
      await tx.user.deleteMany({ where: { schoolId: schoolIdFilter } });
      // Parents not referenced by any remaining student anywhere.
      await tx.parent.deleteMany({ where: { students: { none: {} } } });
      // Remaining org-level users (created with the org) cascade away via
      // the organization delete below.
      await tx.school.deleteMany({ where: { organizationId: id } });
      await tx.organization.delete({ where: { id } });
    }, { timeout: 120000, maxWait: 20000 });

    // Activity Log — DELETE_ORG (actor passed through the job payload)
    auditService.record({
      actorId: actor?.id || null,
      actorName: actor?.name || "System",
      actorRole: actor?.role || "SUPER_ADMIN",
      ipAddress: actor?.ipAddress || null,
      action: AUDIT_ACTIONS.DELETE_ORG,
      entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
      entityId: id,
      entityName: org.name,
      organizationId: id,
    });

    logger.logger.info(
      `[organization-delete] Organization "${org.name}" (${id}) and all related data deleted successfully`
    );

    // Clear all Redis caches related to this organization
    try {
      await redis.del([
        "orgs:all",
        `org:${id}`,
        "superadmin:overview",
        `schools:org:${id}`,
        "schools:all",
      ]);
      logger.logger.info(`[organization-delete] Redis caches cleared for org: ${id}`);
    } catch (err) {
      logger.logger.warn(`[organization-delete] Cache clearing failed: ${err.message}`);
    }

    // Best-effort storage cleanup — the org + branch logos are no longer
    // referenced anywhere. Dedupe so a single-branch org whose logo was
    // synced to the branch (same URL) is destroyed only once.
    try {
      const { default: storageService } = await import("../../services/storage.service.js");
      const logoUrls = [...new Set([...branchLogos, org.logoUrl])].filter(Boolean);
      for (const url of logoUrls) {
        try {
          await storageService.deleteImage({ url });
        } catch (err) {
          logger.logger.warn(`[organization-delete] Logo cleanup failed for ${url}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.logger.warn(`[organization-delete] Logo cleanup skipped: ${err.message}`);
    }

    return { deleted: true, organizationId: id, name: org.name };
  },
  {
    connection: createRedisConnection(),
    concurrency: 2,
    // Transient failures (remote DB latency, connection blips) par khud retry
    // — warna org DB mein atka rehta hai jab tak super admin dobara click na kare.
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    // Redis quota saver: idle polling 15s → 60s + stalled-check 30s → 5min.
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
  }
);

// BullMQ emits "error" on connection failures (Upstash quota exhausted etc.)
// — without a listener the error event crashes the whole process, which was
// also taking down login (login itself is Redis-free). Log instead of crash.
worker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'organization-delete' error: ${err.message}`)
);

worker.on("completed", (job, result) => {
  logger.logger.info(
    `[organization-delete] Job ${job.id} completed — deleted: ${result?.deleted}`
  );
});

worker.on("failed", (job, err) => {
  logger.logger.error(
    `[organization-delete] Job failed: ${job?.id || "unknown"} — ${err.message}`
  );
});

export default worker;
