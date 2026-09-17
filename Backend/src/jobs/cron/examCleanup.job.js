import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("exam-cleanup-job");

// Retention: saal khatam hone ke baad itne din (default 180 = 6 mahine) tak sirf
// KHALI terms cleanup ki ja sakti hain. Exams/results waale records HAMESHA retain
// hote hain — historical result data kabhi cascade-delete nahi hota (report-card
// history, parent/student portal, TC ke liye zaroori).
const ENDED_YEAR_GRACE_DAYS = Number(process.env.ENDED_YEAR_GRACE_DAYS) || 180;

function graceDate() {
  const d = new Date();
  d.setDate(d.getDate() - ENDED_YEAR_GRACE_DAYS);
  return d;
}

/**
 * Academic Year End Empty-Term Cleanup (node-cron — daily 2:30 AM).
 *
 * Data-leakage guard: jo academic year end ho chuka hai aur grace period bhi guzar
 * chuka hai, US SAAL KE SIRF KHALI TERMS (jinke paas koi exam nahi) delete hote
 * hain. Jis term ya year ke paas exams/papers/results hain unhe kabhi nahi mitaya
 * jata — exam result history permanently retained rehti hai (archive model, "records
 * archived, never deleted").
 */
export async function runExamCleanupJob() {
  logger.logger.info("[ExamCleanup] Starting ended-year empty-term sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: graceDate() } },
      select: { id: true, schoolId: true, name: true },
      orderBy: { endDate: "desc" },
    });

    let totalTermsDeleted = 0;
    let retainedExamTerms = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const termIds = await prisma.term.findMany({
        where: { academicYearId: year.id, exams: { none: {} } },
        select: { id: true },
      });
      const result = await prisma.term.deleteMany({
        where: { id: { in: termIds.map((t) => t.id) } },
      });
      if (termIds.length > 0) {
        totalTermsDeleted += result.count;
        touchedYears += 1;
        logger.logger.info(
          `[ExamCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} empty term(s) deleted`
        );
      }
      const examTermCount = await prisma.term.count({
        where: { academicYearId: year.id, exams: { some: {} } },
      });
      retainedExamTerms += examTermCount;
      if (examTermCount > 0) {
        logger.logger.info(
          `[ExamCleanup] Year "${year.name}" (${year.schoolId}) → ${examTermCount} term(s) RETAINED (contain exam results history)`
        );
      }
    }

    logger.logger.info(
      `[ExamCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned: ${touchedYears}, empty terms deleted: ${totalTermsDeleted}, exam-bearing terms retained: ${retainedExamTerms}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, termsDeleted: totalTermsDeleted, examTermsRetained: retainedExamTerms };
  } catch (error) {
    logger.logger.error(`[ExamCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runExamCleanupJob;