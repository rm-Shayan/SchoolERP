import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("study-material-cleanup-job");

// Retention: academic year khatam hone ke baad grace (default 6 mahine)
// tak study material rehta hai, phir delete.
const ENDED_YEAR_GRACE_DAYS = Number(process.env.ENDED_YEAR_GRACE_DAYS) || 180;

function graceDate() {
  const d = new Date();
  d.setDate(d.getDate() - ENDED_YEAR_GRACE_DAYS);
  return d;
}

/**
 * Study Material Year-End Cleanup (node-cron — daily).
 *
 * Same pattern as homework/conduct cleanup: jis school ka academic year
 * khatam ho chuka ho aur grace period guzar chuka ho, us saal ka study
 * material delete kar dete hain.
 */
export async function runStudyMaterialCleanupJob() {
  logger.logger.info("[StudyMaterialCleanup] Starting academic-year-end material sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: graceDate() } },
      select: { id: true, schoolId: true, name: true, endDate: true },
      orderBy: { endDate: "desc" },
    });

    let totalDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const result = await prisma.studyMaterial.deleteMany({
        where: { academicYearId: year.id },
      });
      if (result.count > 0) {
        totalDeleted += result.count;
        touchedYears += 1;
        logger.logger.info(
          `[StudyMaterialCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} materials deleted`
        );
      }

      // Legacy materials bina academicYearId ke — saal khatam hone par saaf karo.
      const loose = await prisma.studyMaterial.deleteMany({
        where: {
          academicYearId: null,
          schoolId: year.schoolId,
          createdAt: { lt: year.endDate },
        },
      });
      if (loose.count > 0) {
        totalDeleted += loose.count;
        logger.logger.info(`[StudyMaterialCleanup] Year "${year.name}" (${year.schoolId}) → ${loose.count} unlinked materials deleted`);
      }
    }

    logger.logger.info(
      `[StudyMaterialCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned: ${touchedYears}, deleted: ${totalDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, deleted: totalDeleted };
  } catch (error) {
    logger.logger.error(`[StudyMaterialCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runStudyMaterialCleanupJob;