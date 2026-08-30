import prisma from "../../config/db.js";

class PortalRepository {
  // ── Attendance ──────────────────────────────────────────

  async getAttendanceMonthSummary(studentIds, year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: start, lte: end },
      },
      select: { date: true, status: true, checkIn: true, checkOut: true, studentId: true },
      orderBy: { date: "asc" },
    });

    const summary = {
      totalDays: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      leave: records.filter((r) => r.status === "LEAVE").length,
    };
    const uniqueDates = new Set(records.map((r) => r.date.toISOString().split("T")[0]));
    summary.uniqueDays = uniqueDates.size;
    summary.percentage = summary.uniqueDays > 0
      ? Math.round(((summary.present + summary.late) / summary.uniqueDays) * 100)
      : 0;

    return { records, summary };
  }

  async getAttendanceDailyRecords(studentIds, year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: start, lte: end },
      },
      select: {
        date: true, status: true, checkIn: true, checkOut: true,
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  // ── Fees ──────────────────────────────────────────────

  async getFeeRecords(studentIds) {
    return prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        payments: { select: { id: true, amount: true, method: true, paidAt: true }, orderBy: { paidAt: "desc" } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "desc" },
    });
  }

  async getFeeSummary(studentIds) {
    const records = await prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds } },
      select: { totalAmount: true, paidAmount: true, status: true, dueDate: true },
    });

    const totalCharged = records.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalPaid = records.reduce((s, r) => s + Number(r.paidAmount), 0);
    const unpaid = records.filter((r) => r.status === "UNPAID" || r.status === "OVERDUE").length;
    const partial = records.filter((r) => r.status === "PARTIAL").length;
    const paid = records.filter((r) => r.status === "PAID").length;

    return {
      totalCharged: totalCharged.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstanding: (totalCharged - totalPaid).toFixed(2),
      recordCount: records.length,
      unpaid, partial, paid,
    };
  }

  // ── Homework ──────────────────────────────────────────

  async getHomework(sectionIds, limit = 20) {
    return prisma.homeworkBroadcast.findMany({
      where: { sectionId: { in: sectionIds } },
      include: {
        section: { select: { id: true, name: true, class: { select: { name: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { sentAt: "desc" },
      take: limit,
    });
  }

  // ── Circulars ──────────────────────────────────────────

  async getCirculars(schoolId, limit = 20) {
    return prisma.circular.findMany({
      where: { schoolId, audience: { in: ["PARENTS", "ALL"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // ── Exam Results ──────────────────────────────────────

  async getExamResults(studentIds) {
    return prisma.examResult.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        exam: { select: { id: true, name: true, startDate: true, term: { select: { name: true } } } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { exam: { startDate: "desc" } },
    });
  }

  // ── Exam Date Sheets ──────────────────────────────────

  async sectionClassIds(sectionIds) {
    const rows = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { classId: true },
    });
    return [...new Set(rows.map((r) => r.classId))];
  }

  async examSheetsForClasses(schoolId, classIds) {
    if (classIds.length === 0) return [];
    return prisma.exam.findMany({
      where: {
        schoolId,
        term: { academicYear: { isCurrent: true } },
        papers: { some: { classId: { in: classIds } } },
      },
      include: {
        term: { include: { academicYear: true } },
        papers: {
          where: { classId: { in: classIds } },
          include: { subject: { select: { id: true, name: true } }, section: { select: { id: true, name: true } }, class: { select: { id: true, name: true } } },
          orderBy: { date: "asc" },
        },
        _count: { select: { results: true } },
      },
      orderBy: { startDate: "desc" },
    });
  }

  async findExamById(id) {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        term: { include: { academicYear: true } },
        papers: { include: { subject: true, section: true, class: true } },
      },
    });
  }

  // ── Timetable ──────────────────────────────────────────

  async getTimetable(sectionId) {
    return prisma.timetableSlot.findMany({
      where: { sectionId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  // ── Conduct Remarks ──────────────────────────────────

  async getConductRemarks(studentIds, limit = 20) {
    return prisma.conductRemark.findMany({
      where: { studentId: { in: studentIds } },
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // ── PTM Sessions ──────────────────────────────────────

  async getPTMSessions(schoolId, sectionIds, studentIds) {
    const now = new Date();
    return prisma.pTMSession.findMany({
      where: {
        schoolId,
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        OR: [
          { scope: "WHOLE_SCHOOL" },
          { sectionIds: { hasSome: sectionIds } },
          { studentId: { in: studentIds } },
        ],
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });
  }

  // ── Leave Requests ──────────────────────────────────

  async getLeaveRequests(parentId, studentIds) {
    return prisma.leaveRequest.findMany({
      where: { parentId, studentId: { in: studentIds } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLeaveRequest(parentId, schoolId, studentId, { dateFrom, dateTo, reason }) {
    return prisma.leaveRequest.create({
      data: {
        studentId,
        parentId,
        schoolId,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        reason: reason.trim(),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
      },
    });
  }

  async findOverlappingApprovedLeave(studentId, dateFrom, dateTo) {
    return prisma.leaveRequest.findFirst({
      where: {
        studentId,
        status: "APPROVED",
        dateFrom: { lte: new Date(dateTo) },
        dateTo: { gte: new Date(dateFrom) },
      },
    });
  }

  // ── Overview (single aggregated call) ──────────────────

  async getOverview(studentIds, schoolId, sectionIds) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [attendanceSummary, feeSummary, homeworkCount, circularCount] = await Promise.all([
      this.getAttendanceMonthSummary(studentIds, year, month),
      this.getFeeSummary(studentIds),
      prisma.homeworkBroadcast.count({ where: { sectionId: { in: sectionIds } } }),
      prisma.circular.count({ where: { schoolId, audience: { in: ["PARENTS", "ALL"] } } }),
    ]);

    return {
      attendance: attendanceSummary.summary,
      fees: feeSummary,
      homeworkCount,
      circularCount,
    };
  }
}

export default new PortalRepository();
