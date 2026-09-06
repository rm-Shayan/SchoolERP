import { Worker } from "bullmq";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { createRedisConnection } from "../../lib/redis.connection.js";
import { sendEmail } from "../../services/email.service.js";
import { adminCredentialsEmail } from "../../services/email.templates.js";
import { queueEmail } from "../../services/emailOutbox.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import { createDefaultBranch } from "../../modules/organization/provision.js";
import auditService from "../../modules/audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../modules/audit/actions.js";

const logger = new Logger("organization-import-worker");

const worker = new Worker(
  "organization-import",
  async (job) => {
    logger.logger.info(`Starting import job ${job.id}`);
    const { organizations } = job.data;

    let successCount = 0;
    let skipCount = 0;
    const errors = [];
    const createdOrgIds = [];

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      try {
        const { name, code, slug: orgSlug, logoUrl, adminEmail, adminName, adminUsername, adminPassword, adminPhone } = org;
        if (!name || !code) {
          errors.push({ org, error: "Missing name or code" });
          continue;
        }

        const formattedCode = code.toString().trim().toUpperCase();

        // Check if organization code already exists
        const existing = await prisma.organization.findUnique({
          where: { code: formattedCode },
        });

        if (existing) {
          logger.logger.warn(`Skipping duplicate organization code: ${formattedCode}`);
          skipCount++;
          continue;
        }

        const slug = orgSlug
          ? orgSlug.toString().toLowerCase().trim().replace(/[^a-z0-9-]/g, "")
          : formattedCode.toLowerCase().replace(/[^a-z0-9-]/g, "");

        // If a custom username was provided, skip rows where it is already taken
        if (adminUsername) {
          const takenUsername = await prisma.user.findUnique({
            where: { username: adminUsername.toString().trim() },
            select: { id: true },
          });
          if (takenUsername) {
            logger.logger.warn(`Skipping organization ${formattedCode}: username ${adminUsername} already taken`);
            skipCount++;
            continue;
          }
        }

        // Delivery cycle: org starts as SETUP_PENDING ("Not delivered") and
        // becomes ACTIVE ("Delivered") on the first login.
        const newOrg = await prisma.organization.create({
          data: {
            name: name.toString().trim(),
            slug,
            code: formattedCode,
            logoUrl: logoUrl ? logoUrl.toString().trim() : null,
          },
        });
        createdOrgIds.push(newOrg.id);

        // Every imported organization starts with one ready-to-use default branch
        const defaultBranch = await createDefaultBranch(newOrg);

        auditService.record({
          actorId: null,
          actorName: "Bulk Import",
          actorRole: "SUPER_ADMIN",
          action: AUDIT_ACTIONS.CREATE_ORG,
          entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
          entityId: newOrg.id,
          entityName: newOrg.name,
          organizationId: newOrg.id,
          details: JSON.stringify({ source: "excel-import", code: formattedCode }),
        });

        // If Excel contains AdminEmail, auto-create the branch Principal (ADMIN)
        // of the default branch and email credentials. (Pakistani school model:
        // the person designated here is the Branch Head / Principal.)
        if (adminEmail) {
          // Use the provided password, otherwise auto-generate one
          const generatedPassword = adminPassword
            ? adminPassword.toString()
            : crypto.randomBytes(4).toString("hex") + "A1!";
          const hashedPassword = await bcrypt.hash(generatedPassword, 12);

          await prisma.user.create({
            data: {
              name: adminName ? adminName.toString().trim() : `${newOrg.name} Principal`,
              email: adminEmail.toString().trim().toLowerCase(),
              username: adminUsername ? adminUsername.toString().trim() : null,
              password: hashedPassword,
              phone: adminPhone ? adminPhone.toString().trim() : null,
              role: "ADMIN",
              organizationId: newOrg.id,
              schoolId: defaultBranch.id,
            },
          });

          const mail = adminCredentialsEmail({
            orgName: newOrg.name,
            orgSlug: newOrg.slug,
            schoolName: defaultBranch.name,
            name: adminName ? adminName.toString().trim() : `${newOrg.name} Principal`,
            email: adminEmail,
            username: adminUsername || null,
            password: generatedPassword,
            schoolCode: defaultBranch.code,
            logoUrl: newOrg.logoUrl || null,
            themeColor: newOrg.themeColor || null,
          });
          await queueEmail({
            to: adminEmail,
            ...mail,
            priority: "CRITICAL",
            organizationId: newOrg.id,
            schoolId: defaultBranch.id,
            // Importing super admin apni email ko admin banaye to bhi email ho
            // (holder guard bypass — Gmail self-send allow karta hai).
            allowHolderAsRecipient: true,
          });
        }

        successCount++;

        // Broadcast progress via WebSocket
        const progressPercent = Math.round(((i + 1) / organizations.length) * 100);
        emitToRoom(`job:${job.id}`, "import_progress", {
          jobId: job.id,
          current: i + 1,
          total: organizations.length,
          progress: progressPercent,
        });

      } catch (err) {
        logger.logger.error(`Error importing organization: ${err.message}`);
        errors.push({ org, error: err.message });
      }
    }

    logger.logger.info(
      `Job ${job.id} complete. Success: ${successCount}, Skipped: ${skipCount}, Failed: ${errors.length}`
    );
    return { successCount, skipCount, failedCount: errors.length, errors, createdOrgIds };
  },
  {
    connection: createRedisConnection(),
    concurrency: 1,
    // Redis quota saver: idle polling 15s → 60s + stalled-check 30s → 5min.
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
  }
);

// BullMQ emits "error" on connection failures (Upstash quota exhausted etc.).
// Without a listener the error event crashes the whole process — which was
// also taking down login (login itself is Redis-free). Log instead of crash.
worker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'organization-import' error: ${err.message}`)
);

worker.on("completed", (job, returnvalue) => {
  logger.logger.info(`[organization-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "import_completed", { jobId: job.id });

  // Import creates orgs + default branches directly in the DB — refresh caches
  // so the new orgs and their default branches appear immediately.
  const orgCacheKeys = [...(returnvalue?.createdOrgIds ?? [])].map((id) => `schools:org:${id}`);
  try {
    redis.del(["orgs:all", "schools:all", "superadmin:overview", ...orgCacheKeys]).catch(() => {});
  } catch (err) {
    // Non-blocking
  }
  emitToRoom("super_admins", "overview_updated", {});
});

worker.on("failed", (job, err) => {
  logger.logger.error(
    `[organization-import] Job failed: ${job?.id || "unknown"} — ${err.message}`
  );
  emitToRoom(`job:${job?.id}`, "import_failed", { jobId: job?.id, error: err.message });
});

export default worker;
