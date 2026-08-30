import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("conduct-cleanup-job");

/**
 * Academic Year End Conduct Remarks Cleanup (node-cron — daily 2:15 AM).
 *
 * Same pattern as homework cleanup: jis branch ka academic year khatam ho
 * chuka hai (endDate < aaj), us saal ke saare conduct remarks delete kar
 * dete hain. Purana data table ko bharne se pehle hi saaf.
 */
export async function runConductCleanupJob() {
  logger.logger.info("[ConductCleanup] Starting academic-year-end remarks sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: new Date() } },
      select: { id: true, schoolId: true, name: true, startDate: true, endDate: true },
      orderBy: { endDate: "desc" },
    });

    let totalDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const result = await prisma.conductRemark.deleteMany({
        where: {
          academicYearId: year.id,
        },
      });
      if (result.count > 0) {
        totalDeleted += result.count;
        touchedYears += 1;
        logger.logger.info(
          `[ConductCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} remarks deleted`
        );
      }
    }

    logger.logger.info(
      `[ConductCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned: ${touchedYears}, deleted: ${totalDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, deleted: totalDeleted };
  } catch (error) {
    logger.logger.error(`[ConductCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runConductCleanupJob;
