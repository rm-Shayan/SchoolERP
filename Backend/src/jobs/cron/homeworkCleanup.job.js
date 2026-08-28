import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("homework-cleanup-job");

/**
 * Academic Year End Homework Cleanup (node-cron — daily 2:00 AM).
 *
 * Jis branch ka academic year khatam ho chuka hai (endDate < aaj), us saal
 * ke saare homework broadcasts delete kar dete hain — purana saal ka data
 * table ko bharne se pehle hi saaf.
 *
 * Delete rule: broadcast.sentAt us ended year ki [startDate..endDate] range
 * mein ho. Idempotent hai — ek baar delete hone ke baad count 0 rehta hai.
 */
export async function runHomeworkCleanupJob() {
  logger.logger.info("[HwCleanup] Starting academic-year-end homework sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: new Date() } },
      select: { id: true, schoolId: true, name: true, startDate: true, endDate: true },
      orderBy: { endDate: "desc" },
    });

    let totalDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const result = await prisma.homeworkBroadcast.deleteMany({
        where: {
          schoolId: year.schoolId,
          sentAt: { gte: year.startDate, lte: year.endDate },
        },
      });
      if (result.count > 0) {
        totalDeleted += result.count;
        touchedYears += 1;
        logger.logger.info(
          `[HwCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} homework deleted`
        );
      }
    }

    logger.logger.info(
      `[HwCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned years: ${touchedYears}, deleted: ${totalDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, deleted: totalDeleted };
  } catch (error) {
    logger.logger.error(`[HwCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runHomeworkCleanupJob;
