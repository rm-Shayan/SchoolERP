import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis.connection.js";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { emitToRoom } from "../../config/websocket.js";

const logger = new Logger("admission-import");

export const admissionImportWorker = new Worker(
  "admission-import",
  async (job) => {
    logger.logger.info(`Starting Admission Bulk Import Job ${job.id}`);
    const { rows, schoolId } = job.data;

    let successCount = 0;
    const errors = [];
    // In-run dedup set — same file dobara submit/retry hone par duplicate
    // "INQUIRY" applicants nahi banenge (first+last+className+whatsapp key).
    const seenKeys = new Set();

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, code: true },
    });
    if (!school) throw new Error("School not found for import");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;
      try {
        const {
          className, firstName, lastName, gender, dob,
          parentName, parentPhone, parentWhatsappNo, parentEmail,
          parentAddress, advanceFeeAmount,
        } = row;

        if (!firstName || !parentName) {
          errors.push({ row: rowIndex, error: "Missing student or parent name" });
          continue;
        }

        let classId = null;
        if (className) {
          const cls = await prisma.class.findFirst({
            where: { schoolId, name: className.toString().trim() },
            select: { id: true },
          });
          classId = cls?.id || null;
        }
        if (!classId) {
          errors.push({ row: rowIndex, error: `Class not found: '${className || "?"}'` });
          continue;
        }

        // Idempotency — dedupe (in-run + against existing INQUIRY applicants):
        // same file submit twice = same applicant created once.
        const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());
        const fName = norm(firstName);
        const lName = norm(lastName);
        const wName = norm(parentWhatsappNo || parentPhone || "");
        const dupKey = `${classId}|${fName}|${lName}|${wName}`;
        if (seenKeys.has(dupKey)) {
          errors.push({ row: rowIndex, error: "Duplicate row skipped (already imported)" });
          continue;
        }
        const existingInquiry = await prisma.applicant.findFirst({
          where: { schoolId, classId, status: "INQUIRY", firstName: String(firstName).trim(), parentWhatsappNo: (parentWhatsappNo || parentPhone || "").toString().trim() },
          select: { id: true },
        });
        if (existingInquiry) {
          errors.push({ row: rowIndex, error: "Duplicate applicant skipped (already imported earlier)" });
          seenKeys.add(dupKey);
          continue;
        }
        seenKeys.add(dupKey);

        await prisma.applicant.create({
          data: {
            schoolId,
            classId,
            firstName: firstName.toString().trim(),
            lastName: (lastName || "").toString().trim(),
            gender: gender || null,
            dob: dob ? new Date(dob) : null,
            parentName: parentName.toString().trim(),
            parentPhone: parentPhone ? parentPhone.toString().trim() : null,
            parentWhatsappNo: (parentWhatsappNo || parentPhone || "").toString().trim(),
            parentEmail: parentEmail || null,
            parentAddress: parentAddress || null,
            advanceFeeAmount: advanceFeeAmount ? Number(advanceFeeAmount) : null,
            status: "INQUIRY",
          },
        });

        successCount++;

        if ((i + 1) % 20 === 0 || i + 1 === rows.length) {
          const progressPercent = Math.round(((i + 1) / rows.length) * 100);
          emitToRoom(`job:${job.id}`, "admission_import_progress", {
            jobId: job.id,
            current: i + 1,
            total: rows.length,
            progress: progressPercent,
          });
        }
      } catch (err) {
        logger.logger.error(`[Admission Import] Row error: ${err.message}`);
        errors.push({ row: rowIndex, error: err.message });
      }
    }

    logger.logger.info(
      `Admission Import Job ${job.id} done. Success: ${successCount}, Failed: ${errors.length}`
    );
    return { successCount, failedCount: errors.length, errors };
  },
  {
    connection: createRedisConnection(),
    concurrency: 1,
    drainDelay: 60,
    stalledInterval: 5 * 60 * 1000,
  }
);

admissionImportWorker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'admission-import' error: ${err.message}`)
);

admissionImportWorker.on("completed", (job) => {
  logger.logger.info(`[admission-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "admission_import_completed", {
    jobId: job.id,
    result: job.returnvalue,
  });
});

admissionImportWorker.on("failed", (job, err) => {
  logger.logger.error(`[admission-import] Job failed: ${job?.id || "unknown"} — ${err.message}`);
  emitToRoom(`job:${job?.id}`, "admission_import_failed", {
    jobId: job?.id,
    error: err.message,
  });
});
