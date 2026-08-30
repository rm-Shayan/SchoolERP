import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("attendance-cleanup-job");

// AttendanceStatus → AttendanceYearSummary column mapping.
const STATUS_TO_FIELD = {
  PRESENT: "daysPresent",
  LATE: "daysLate",
  ABSENT: "daysAbsent",
  LEAVE: "daysLeave",
  MANUAL_OVERRIDE: "daysManual",
};

/**
 * Academic Year End Attendance Archive (node-cron — daily 2:45 AM).
 *
 * Jis academic year ki endDate guzar gayi, us saal ki RAW attendance records
 * ko per-student per-year AttendanceYearSummary mein roll-up karke delete kar
 * deta hai. Naya academic year LIVE records se fresh start karta hai; purana
 * saal ki history summary ke roop mein mehfooz rehti hai
 * (GET /attendance/students/:id/yearly-summaries usi ko parse karti hai).
 *
 * Idempotent: purane summaries pehle delete phir dobara create — is liye job
 * har din bina kisi issue ke rerun ho sakti hai (missing years return 0).
 */
export async function runAttendanceCleanupJob() {
  logger.logger.info("[AttendanceCleanup] Starting academic-year-end archive sweep...");
  try {
    const endedYears = await prisma.academicYear.findMany({
      where: { endDate: { lt: new Date() } },
      select: { id: true, schoolId: true, name: true, startDate: true, endDate: true },
      orderBy: { endDate: "desc" },
    });

    let totalStudents = 0;
    let totalRecordsDeleted = 0;
    let touchedYears = 0;

    for (const year of endedYears) {
      // endDate PK midnight par hai (19:00Z) — is liye +1 day tak lo taake
      // saal ka AAKHRI din (e.g. 30 Dec) bhi summary mein aaye.
      const endBoundary = new Date(year.endDate);
      endBoundary.setDate(endBoundary.getDate() + 1);
      const range = { gte: year.startDate, lte: endBoundary };

      const raw = await prisma.attendanceRecord.groupBy({
        by: ["studentId", "status"],
        where: { date: range, student: { schoolId: year.schoolId } },
        _count: { _all: true },
      });

      const map = new Map();
      for (const g of raw) {
        const field = STATUS_TO_FIELD[g.status] ?? "daysPresent";
        let row = map.get(g.studentId);
        if (!row) {
          row = { studentId: g.studentId, schoolId: year.schoolId, yearLabel: year.name, dateFrom: year.startDate, dateTo: year.endDate, daysPresent: 0, daysLate: 0, daysAbsent: 0, daysLeave: 0, daysManual: 0, totalDays: 0 };
          map.set(g.studentId, row);
        }
        row[field] = g._count._all;
        row.totalDays += g._count._all;
      }
      const rows = [...map.values()];

      if (rows.length > 0) {
        await prisma.attendanceYearSummary.deleteMany({
          where: { studentId: { in: rows.map((r) => r.studentId) }, yearLabel: year.name },
        });
        await prisma.attendanceYearSummary.createMany({ data: rows });
        totalStudents += rows.length;
        touchedYears += 1;
        logger.logger.info(`[AttendanceCleanup] Year "${year.name}" (${year.schoolId}) → ${rows.length} students summarized`);
      }

      const deleted = await prisma.attendanceRecord.deleteMany({
        where: { date: range, student: { schoolId: year.schoolId } },
      });
      totalRecordsDeleted += deleted.count;

      if (rows.length > 0 || deleted.count > 0) {
        logger.logger.info(`[AttendanceCleanup]   raw records removed: ${deleted.count}`);
      }
    }

    logger.logger.info(
      `[AttendanceCleanup] Done. Years scanned: ${endedYears.length}, cleaned: ${touchedYears}, students summarized: ${totalStudents}, raw deleted: ${totalRecordsDeleted}`
    );
    return { success: true, yearsScanned: endedYears.length, cleanedYears: touchedYears, studentsSummarized: totalStudents, rawDeleted: totalRecordsDeleted };
  } catch (error) {
    logger.logger.error(`[AttendanceCleanup] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runAttendanceCleanupJob;