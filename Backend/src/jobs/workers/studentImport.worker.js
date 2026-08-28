import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis.connection.js";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { generateIdentifierCode } from "../../lib/identifier.js";
import { emitToRoom } from "../../config/websocket.js";
import { assertSectionHasSeat } from "../../lib/capacity.js";

const logger = new Logger("student-import");

export const studentImportWorker = new Worker(
  "student-import",
  async (job) => {
    logger.logger.info(`Starting Student Bulk Import Job ${job.id}`);
    const { rows, schoolId } = job.data;

    let successCount = 0;
    let skipCount = 0;
    const errors = [];

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, code: true },
    });
    if (!school) throw new Error("School not found for import");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const {
          sectionId, className, sectionName,
          rollNumber, firstName, lastName, gender, dob,
          parentName, parentWhatsappNo, parentPhone, parentEmail, parentAddress,
        } = row;

        const rowIndex = i + 2;

        let targetSectionId = sectionId;
        if (!targetSectionId) {
          const section = await prisma.section.findFirst({
            where: {
              name: sectionName,
              class: { name: className, schoolId },
            },
            select: { id: true },
          });
          targetSectionId = section?.id;
        }
        if (!targetSectionId) {
          errors.push({ row: rowIndex, error: `Section not found for class '${className || "?"}' section '${sectionName || "?"}'` });
          continue;
        }

        if (!rollNumber) {
          errors.push({ row: rowIndex, error: "Missing roll number" });
          continue;
        }

        const existingRoll = await prisma.student.findFirst({
          where: { schoolId, rollNumber },
          select: { id: true },
        });
        if (existingRoll) {
          errors.push({ row: rowIndex, error: `Duplicate roll number '${rollNumber}'` });
          continue;
        }

        const normalizedWhatsapp = (parentWhatsappNo || "").toString().trim();
        if (!normalizedWhatsapp) {
          errors.push({ row: rowIndex, error: "Missing parent WhatsApp number" });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          await assertSectionHasSeat(tx, targetSectionId);

          const parent = await tx.parent.upsert({
            where: { whatsappNo: normalizedWhatsapp },
            update: {
              name: parentName || undefined,
              phone: parentPhone || undefined,
              email: parentEmail || undefined,
              address: parentAddress || undefined,
            },
            create: {
              name: parentName || "Guardian",
              whatsappNo: normalizedWhatsapp,
              phone: parentPhone || null,
              email: parentEmail || null,
              address: parentAddress || null,
            },
          });

          await tx.student.create({
            data: {
              schoolId,
              sectionId: targetSectionId,
              parentId: parent.id,
              identifierCode: generateIdentifierCode(),
              rollNumber: rollNumber.toString().trim(),
              firstName: (firstName || "").toString().trim(),
              lastName: (lastName || "").toString().trim(),
              gender: gender || null,
              dob: dob ? new Date(dob) : null,
              status: "ACTIVE",
            },
          });
        });

        successCount++;

        if ((i + 1) % 20 === 0 || i + 1 === rows.length) {
          const progressPercent = Math.round(((i + 1) / rows.length) * 100);
          emitToRoom(`job:${job.id}`, "student_import_progress", {
            jobId: job.id,
            current: i + 1,
            total: rows.length,
            progress: progressPercent,
          });
        }
      } catch (err) {
        logger.logger.error(`[Student Import] Row error: ${err.message}`);
        errors.push({ row: i + 2, error: err.message });
      }
    }

    logger.logger.info(
      `Student Import Job ${job.id} done. Success: ${successCount}, Skipped: ${skipCount}, Failed: ${errors.length}`
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

studentImportWorker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'student-import' error: ${err.message}`)
);

studentImportWorker.on("completed", (job) => {
  logger.logger.info(`[student-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "student_import_completed", {
    jobId: job.id,
    result: job.returnvalue,
  });
});

studentImportWorker.on("failed", (job, err) => {
  logger.logger.error(`[student-import] Job failed: ${job?.id || "unknown"} — ${err.message}`);
  emitToRoom(`job:${job?.id}`, "student_import_failed", { jobId: job?.id, error: err.message });
});
