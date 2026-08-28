import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis.connection.js";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { staffCredentialsEmail } from "../../services/email.templates.js";
import { queueEmail } from "../../services/emailOutbox.js";
import { emitToRoom } from "../../config/websocket.js";

const logger = new Logger("staff-import");

const IMPORTABLE_ROLES = ["ADMIN", "TEACHER", "RECEPTIONIST"];

export const staffImportWorker = new Worker(
  "staff-import",
  async (job) => {
    logger.logger.info(`Starting Staff Bulk Import Job ${job.id}`);
    const { staffMembers, organizationId, requesterSchoolId, requesterRole } = job.data;

    const org = organizationId
      ? await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { slug: true, name: true, logoUrl: true },
        })
      : null;

    let successCount = 0;
    let skipCount = 0;
    const errors = [];

    for (let i = 0; i < staffMembers.length; i++) {
      const member = staffMembers[i];
      try {
        const { name, email, role, phone, schoolId } = member;

        if (!name || !email || !role) {
          errors.push({ member, error: "Missing required fields (Name, Email, Role)" });
          continue;
        }

        const normalizedRole = role.toString().trim().toUpperCase();
        if (!IMPORTABLE_ROLES.includes(normalizedRole)) {
          errors.push({ member, error: `Invalid or unauthorized role '${role}'. Allowed: ${IMPORTABLE_ROLES.join(", ")}` });
          continue;
        }

        const formattedEmail = email.toString().trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({ where: { email: formattedEmail } });
        if (existingUser) {
          logger.logger.warn(`Skipping duplicate email: ${formattedEmail}`);
          skipCount++;
          continue;
        }

        let targetSchoolId = requesterRole === "ADMIN" ? requesterSchoolId : (schoolId || null);

        const tempPassword = crypto.randomBytes(4).toString("hex") + "A1!";
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        const staffUsername = member.username || `STF-${Math.floor(1000 + Math.random() * 9000)}`;

        const newUser = await prisma.user.create({
          data: {
            name: name.toString().trim(),
            username: staffUsername,
            email: formattedEmail,
            password: hashedPassword,
            phone: phone ? phone.toString().trim() : null,
            role: normalizedRole,
            organizationId,
            schoolId: targetSchoolId,
          },
        });

        // Fetch branch logo for email branding
        const targetSchool = targetSchoolId
          ? await prisma.school.findUnique({ where: { id: targetSchoolId }, select: { logoUrl: true, themeColor: true } })
          : null;
        const mail = staffCredentialsEmail({
          name: newUser.name,
          role: newUser.role,
          username: staffUsername,
          email: formattedEmail,
          password: tempPassword,
          schoolCode: null,
          orgName: org?.name || null,
          orgSlug: org?.slug || null,
          logoUrl: targetSchool?.logoUrl || org?.logoUrl || null,
          themeColor: targetSchool?.themeColor || org?.themeColor || null,
        });
        await queueEmail({
          to: formattedEmail,
          ...mail,
          priority: "CRITICAL",
          organizationId,
          schoolId: targetSchoolId || undefined,
        });

        successCount++;

        const progressPercent = Math.round(((i + 1) / staffMembers.length) * 100);
        emitToRoom(`job:${job.id}`, "staff_import_progress", {
          jobId: job.id,
          current: i + 1,
          total: staffMembers.length,
          progress: progressPercent,
        });
      } catch (err) {
        logger.logger.error(`Error importing staff member: ${err.message}`);
        errors.push({ member, error: err.message });
      }
    }

    logger.logger.info(
      `Staff Import Job ${job.id} complete. Success: ${successCount}, Skipped: ${skipCount}, Failed: ${errors.length}`
    );
    return { successCount, skipCount, failedCount: errors.length, errors };
  },
  {
    connection: createRedisConnection(),
    concurrency: 1,
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
  }
);

staffImportWorker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'staff-import' error: ${err.message}`)
);

staffImportWorker.on("completed", (job) => {
  logger.logger.info(`[staff-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "staff_import_completed", { jobId: job.id });
});

staffImportWorker.on("failed", (job, err) => {
  logger.logger.error(`[staff-import] Job failed: ${job?.id || "unknown"} — ${err.message}`);
  emitToRoom(`job:${job?.id}`, "staff_import_failed", { jobId: job?.id, error: err.message });
});
