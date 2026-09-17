import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("ptm-cleanup-job");

// Retention: academic year khatam hone ke baad grace (default 6 mahine)
// tak PTM sessions visible rehte hain, phir delete.
const ENDED_YEAR_GRACE_DAYS = Number(process.env.ENDED_YEAR_GRACE_DAYS) || 180;

function graceDate() {
  const d = new Date();
  d.setDate(d.getDate() - ENDED_YEAR_GRACE_DAYS);
  return d;
}

/**
 * PTM Sessions Year-End Cleanup (node-cron — daily).
 *
 * Same pattern as conduct/homework cleanup: jis school ka academic year
 * khatam ho chuka ho aur grace period guzar chuka ho, us saal ka PTM
 * sessions delete kar dete hain. Removal cascades nahi karta — ConductRemark
 * me onDelete SetNull hai, is liye remarks safe rehte hain.
 */
export async function runPtmCleanupJob() {
  logger.logger.info("[PtmCleanup] Starting academic-year-end PTM sessions sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: graceDate() } },
      select: { id: true, schoolId: true, name: true, endDate: true },
      orderBy: { endDate: "desc" },
    });

    let totalDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const result = await prisma.pTMSession.deleteMany({
        where: { academicYearId: year.id },
      });
      if (result.count > 0) {
        totalDeleted += result.count;
        touchedYears += 1;
        logger.logger.info(
          `[PtmCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} sessions deleted`
        );
      }

      // Legacy sessions bina academicYearId ke — saal khatam hone par saaf karo.
      const loose = await prisma.pTMSession.deleteMany({
        where: {
          academicYearId: null,
          schoolId: year.schoolId,
          scheduledAt: { lt: year.endDate },
        },
      });
      if (loose.count > 0) {
        totalDeleted += loose.count;
        logger.logger.info(`[PtmCleanup] Year "${year.name}" (${year.schoolId}) → ${loose.count} unlinked sessions deleted`);
      }
    }

    logger.logger.info(
      `[PtmCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned: ${touchedYears}, deleted: ${totalDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, deleted: totalDeleted };
  } catch (error) {
    logger.logger.error(`[PtmCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runPtmCleanupJob;