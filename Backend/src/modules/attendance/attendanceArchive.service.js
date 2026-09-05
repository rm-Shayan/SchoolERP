import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("attendance-archive");

/**
 * Attendance Archive Service
 *
 * Academic year end pe:
 * 1. Har student ka per-year summary calculate karo (present/absent/late/leave)
 * 2. Summary AttendanceYearSummary table me save karo
 * 3. Purane AttendanceRecord delete karo — DB chhota rehta hai
 *
 * Safe to re-run: duplicate yearLabel pe summary overwrite hoti hai.
 */
class AttendanceArchiveService {
  /**
   * Archive attendance for a school + date range.
   * @param {string} schoolId
   * @param {Date} dateFrom - archive start date (inclusive)
   * @param {Date} dateTo   - archive end date (inclusive)
   * @param {string} yearLabel - e.g. "2025-2026"
   * @returns {{ archived: number, summaries: number, students: number }}
   */
  async archiveByDateRange(schoolId, dateFrom, dateTo, yearLabel) {
    if (!schoolId || !dateFrom || !dateTo || !yearLabel) {
      throw new Error("schoolId, dateFrom, dateTo, and yearLabel are required");
    }

    logger.logger.info(
      `[Archive] Starting: school=${schoolId} range=${dateFrom.toISOString().slice(0, 10)}..${dateTo.toISOString().slice(0, 10)} label=${yearLabel}`
    );

    // Step 1: Find all students in this school
    const students = await prisma.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      select: { id: true },
    });

    if (students.length === 0) {
      logger.logger.warn(`[Archive] No students found for school ${schoolId}`);
      return { archived: 0, summaries: 0, students: 0 };
    }

    const studentIds = students.map((s) => s.id);

    // Step 2: Bulk-fetch all attendance records in the date range for these students
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: dateFrom, lte: dateTo },
      },
      select: { studentId: true, status: true },
    });

    // Step 3: Calculate per-student summary
    const summaryMap = new Map();
    for (const sid of studentIds) {
      summaryMap.set(sid, {
        daysPresent: 0,
        daysLate: 0,
        daysAbsent: 0,
        daysLeave: 0,
        daysManual: 0,
        totalDays: 0,
      });
    }

    for (const r of records) {
      const s = summaryMap.get(r.studentId);
      if (!s) continue;
      s.totalDays++;
      switch (r.status) {
        case "PRESENT": s.daysPresent++; break;
        case "LATE": s.daysLate++; break;
        case "ABSENT": s.daysAbsent++; break;
        case "LEAVE": s.daysLeave++; break;
        case "HALF_DAY": s.daysPresent += 0.5; break;
        case "MANUAL": s.daysManual++; break;
      }
    }

    // Step 4: Upsert summaries + delete raw records in batches
    let summariesCreated = 0;
    const batchSize = 500;

    for (const [studentId, stats] of summaryMap) {
      if (stats.totalDays === 0) continue; // no records to archive

      await prisma.attendanceYearSummary.upsert({
        where: { studentId_yearLabel: { studentId, yearLabel } },
        create: {
          studentId,
          schoolId,
          yearLabel,
          dateFrom,
          dateTo,
          ...stats,
        },
        update: {
          dateFrom,
          dateTo,
          ...stats,
        },
      });
      summariesCreated++;
    }

    // Step 5: Delete raw attendance records in batches
    let totalDeleted = 0;
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      const result = await prisma.attendanceRecord.deleteMany({
        where: {
          studentId: { in: batch },
          date: { gte: dateFrom, lte: dateTo },
        },
      });
      totalDeleted += result.count;
    }

    logger.logger.info(
      `[Archive] Done: ${totalDeleted} records deleted, ${summariesCreated} summaries created for ${students.length} students`
    );

    return {
      archived: totalDeleted,
      summaries: summariesCreated,
      students: students.length,
    };
  }

  /**
   * Auto-archive: find all schools whose academic year has ended
   * and archive attendance older than 180 days.
   */
  async autoArchiveAll() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 180);

    const schools = await prisma.school.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });

    const results = [];
    for (const school of schools) {
      try {
        // Check if there are old records to archive
        const oldCount = await prisma.attendanceRecord.count({
          where: { student: { schoolId: school.id }, date: { lt: cutoff } },
        });
        if (oldCount === 0) continue;

        // Archive by calendar year
        const year = cutoff.getFullYear();
        const dateFrom = new Date(`${year - 1}-01-01`);
        const dateTo = new Date(`${year - 1}-12-31`);

        const result = await this.archiveByDateRange(
          school.id, dateFrom, dateTo, `${year - 1}`
        );
        results.push({ school: school.name, ...result });
      } catch (err) {
        logger.logger.warn(`[AutoArchive] Failed for ${school.name}: ${err.message}`);
      }
    }
    return results;
  }
}

export default new AttendanceArchiveService();
