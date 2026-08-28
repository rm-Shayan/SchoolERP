import { Worker } from "bullmq";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { createRedisConnection } from "../../lib/redis.connection.js";
import { emitToRoom } from "../../config/websocket.js";
import { createBranchAdmin } from "../../modules/organization/provision.js";
import redis from "../../config/redis.js";
import auditService from "../../modules/audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../modules/audit/actions.js";

const logger = new Logger("school-import-worker");

const worker = new Worker(
  "school-import",
  async (job) => {
    logger.logger.info(`Starting branch import job ${job.id}`);
    const { branches, organizationId, actor } = job.data;

    let successCount = 0;
    let skipCount = 0;
    const errors = [];
    // Every organization touched by this job — used to bust per-org cache keys
    const touchedOrgIds = new Set();

    // Resolve the target organization once when importing for a single org
    let targetOrg = null;
    if (organizationId) {
      targetOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!targetOrg) {
        throw new Error(`Organization ${organizationId} not found`);
      }
    }

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      try {
        const { name, code, address, phone, adminEmail, adminName } = branch;
        if (!name || !code) {
          errors.push({ branch, error: "Missing name or code" });
          continue;
        }

        // Resolve org — job-level organizationId wins; otherwise match by OrganizationCode
        let org = targetOrg;
        if (!org) {
          const orgCode = branch.organizationCode?.toString().trim().toUpperCase();
          if (!orgCode) {
            errors.push({ branch, error: "Missing OrganizationCode" });
            continue;
          }
          org = await prisma.organization.findUnique({ where: { code: orgCode } });
          if (!org) {
            errors.push({ branch, error: `Organization not found for code '${orgCode}'` });
            continue;
          }
        }

        const formattedCode = code.toString().trim().toUpperCase();

        // Skip duplicate branch codes (globally unique)
        const existing = await prisma.school.findUnique({ where: { code: formattedCode } });
        if (existing) {
          logger.logger.warn(`Skipping duplicate branch code: ${formattedCode}`);
          skipCount++;
          continue;
        }

        touchedOrgIds.add(org.id);

        const school = await prisma.school.create({
          data: {
            name: name.toString().trim(),
            code: formattedCode,
            organizationId: org.id,
            address: address ? address.toString().trim() : null,
            phone: phone ? phone.toString().trim() : null,
          },
        });

        auditService.record({
          actorId: actor?.id || null,
          actorName: actor?.name || "Bulk Import",
          actorRole: actor?.role || "SUPER_ADMIN",
          ipAddress: actor?.ipAddress || null,
          action: AUDIT_ACTIONS.CREATE_SCHOOL,
          entityType: AUDIT_ENTITY_TYPES.SCHOOL,
          entityId: school.id,
          entityName: school.name,
          organizationId: org.id,
          schoolId: school.id,
          details: JSON.stringify({ source: "excel-import" }),
        });

        // Optional per-branch admin (Principal) — credentials are emailed
        if (adminEmail) {
          await createBranchAdmin({
            organizationId: org.id,
            schoolId: school.id,
            name: adminName,
            email: adminEmail,
            orgName: org.name,
            schoolName: school.name,
          });
        }

        successCount++;

        // Broadcast progress via WebSocket
        const progressPercent = Math.round(((i + 1) / branches.length) * 100);
        emitToRoom(`job:${job.id}`, "import_progress", {
          jobId: job.id,
          current: i + 1,
          total: branches.length,
          progress: progressPercent,
        });
      } catch (err) {
        logger.logger.error(`Error importing branch: ${err.message}`);
        errors.push({ branch, error: err.message });
      }
    }

    logger.logger.info(
      `Job ${job.id} complete. Success: ${successCount}, Skipped: ${skipCount}, Failed: ${errors.length}`
    );
    return { successCount, skipCount, failedCount: errors.length, errors, touchedOrgIds: [...touchedOrgIds] };
  },
  {
    connection: createRedisConnection(),
    concurrency: 1, // Process one sheet import job at a time to prevent race conditions on code constraint
    // Redis quota saver: idle polling 15s → 60s + stalled-check 30s → 5min.
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
  }
);

// BullMQ emits "error" on connection failures (Upstash quota exhausted etc.)
// — without a listener the error event crashes the whole process, which was
// also taking down login (login itself is Redis-free). Log instead of crash.
worker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'school-import' error: ${err.message}`)
);

worker.on("completed", (job, returnvalue) => {
  logger.logger.info(`[school-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "import_completed", { jobId: job.id });

  // Branches were created directly in the DB — refresh cached dashboards.
  // `schools:org:{id}` is the per-org branch list cache; without busting it,
  // imported branches stay invisible on org pages for up to the TTL (5 min).
  const orgCacheKeys = [...(returnvalue?.touchedOrgIds ?? [])].map((id) => `schools:org:${id}`);
  try {
    redis.del(["schools:all", "orgs:all", "superadmin:overview", ...orgCacheKeys]).catch(() => {});
  } catch (err) {
    // Non-blocking
  }
  emitToRoom("super_admins", "overview_updated", {});
  emitToRoom("super_admins", "school_created", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.logger.error(
    `[school-import] Job failed: ${job?.id || "unknown"} — ${err.message}`
  );
  emitToRoom(`job:${job?.id}`, "import_failed", { jobId: job?.id, error: err.message });
});

export default worker;
