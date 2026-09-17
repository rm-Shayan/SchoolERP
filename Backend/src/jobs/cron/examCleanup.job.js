import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("exam-cleanup-job");

// Retention: saal khatam hone ke baad itne din (default 180 = 6 mahine)
// exams/results LIVE rehte hain, phir delete hote hain — recent results
// turant nahi mitte (result history parents/TC ke liye zaroori).
const ENDED_YEAR_GRACE_DAYS = Number(process.env.ENDED_YEAR_GRACE_DAYS) || 180;

function graceDate() {
  const d = new Date();
  d.setDate(d.getDate() - ENDED_YEAR_GRACE_DAYS);
  return d;
}

/**
 * Academic Year End Exam + Terms Cleanup (node-cron — daily 2:30 AM).
 *
 * Conduct remarks ke sath jaisa pattern: jis academic year ki endDate guzar
 * gayi ho AUR grace period (default 6 mahine) bhi guzar chuka ho, us saal ke
 * saare TERMS delete kar deta hai — FK cascade se exams, date-sheet papers
 * (ExamPaper) aur results (ExamResult) sab delete ho jate hain. Grace recent
 * results ko turant mitne se bachata hai.
 */
export async function runExamCleanupJob() {
  logger.logger.info("[ExamCleanup] Starting academic-year-end exam/term sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: graceDate() } },
      select: { id: true, schoolId: true, name: true },
      orderBy: { endDate: "desc" },
    });

    let totalTermsDeleted = 0;
    let totalExamsDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      const examsInYear = await prisma.exam.count({ where: { term: { academicYearId: year.id } } });
      const result = await prisma.term.deleteMany({
        where: { academicYearId: year.id },
      });
      if (result.count > 0) {
        totalTermsDeleted += result.count;
        totalExamsDeleted += examsInYear;
        touchedYears += 1;
        logger.logger.info(
          `[ExamCleanup] Year "${year.name}" (${year.schoolId}) → ${result.count} term(s), ${examsInYear} exam(s) deleted (papers + results cascade)`
        );
      }
    }

    logger.logger.info(
      `[ExamCleanup] Done. Ended years scanned: ${endedYears.length}, cleaned: ${touchedYears}, terms: ${totalTermsDeleted}, exams: ${totalExamsDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, termsDeleted: totalTermsDeleted, examsDeleted: totalExamsDeleted };
  } catch (error) {
    logger.logger.error(`[ExamCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runExamCleanupJob;