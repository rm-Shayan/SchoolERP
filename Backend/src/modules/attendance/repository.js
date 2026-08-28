import prisma from "../../config/db.js";

class AttendanceRepository {
  // Student Identifier Lookup + Fee Records (merged for gate scan speed)
  // Agar termRange diya ho to fee records bhi ek hi query mein aa jayenge.
  async findStudentByIdentifierCode(identifierCode, termRange = null) {
    const feeInclude = termRange?.startDate && termRange?.endDate
      ? {
          feeRecords: {
            where: {
              dueDate: { gte: termRange.startDate, lte: termRange.endDate },
            },
            select: {
              dueDate: true,
              totalAmount: true,
              paidAmount: true,
              status: true,
            },
            orderBy: { dueDate: "desc" },
          },
        }
      : {};

    return prisma.student.findUnique({
      where: { identifierCode },
      include: {
        school: { select: { id: true, name: true, code: true, attendanceCutoffTime: true } },
        section: { include: { class: true } },
        parent: { select: { id: true, name: true, whatsappNo: true, phone: true, email: true } },
        ...feeInclude,
      },
    });
  }

  // Attendance Record Creation & Upsert
  async findAttendanceRecordByDate(studentId, date) {
    return prisma.attendanceRecord.findUnique({
      where: {
        studentId_date: { studentId, date },
      },
    });
  }

  async createAttendanceRecord(data) {
    return prisma.attendanceRecord.create({ data });
  }

  async updateAttendanceRecord(id, data) {
    return prisma.attendanceRecord.update({
      where: { id },
      data,
    });
  }

  // Attendance Reports & Queries
  async getDailySchoolAttendance(schoolId, date) {
    return prisma.attendanceRecord.findMany({
      where: {
        date,
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            identifierCode: true,
            imageUrl: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: { checkIn: "desc" },
    });
  }

  async getStudentAttendanceHistory(studentId, startDate, endDate) {
    return prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });
  }

  // Archived yearly rollups (AttendanceYearSummary — 365 din purani attendance
  // archive job se yahan move hoti hai; raw records delete ho jate hain).
  async getStudentYearlySummaries(studentId) {
    return prisma.attendanceYearSummary.findMany({
      where: { studentId },
      orderBy: { yearLabel: "desc" },
    });
  }

  /**
   * Term-scoped fee status for a single student — gate scan ke liye.
   * Sirf CURRENT TERM ke fee records (e.g. Term 1 = 4 months max).
   * If termRange is provided (from Redis cache), skips the Term.findFirst query.
   * Total: 1-2 indexed queries — sub-10ms.
   */
  async findStudentFeeStatus(studentId, schoolId, termRange = null) {
    let termName = null;
    let rangeStart = termRange?.startDate ?? null;
    let rangeEnd = termRange?.endDate ?? null;

    // If no cached term range, fetch from DB
    if (!rangeStart || !rangeEnd) {
      const now = new Date();
      const term = await prisma.term.findFirst({
        where: {
          academicYear: { schoolId, isCurrent: true },
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: { name: true, startDate: true, endDate: true },
      });
      if (term) {
        termName = term.name;
        rangeStart = term.startDate;
        rangeEnd = term.endDate;
      } else {
        return { term: null, records: [] };
      }
    } else {
      termName = termRange.name;
    }

    // Fetch fee records scoped to the term date range (single indexed query)
    const records = await prisma.feeRecord.findMany({
      where: {
        studentId,
        dueDate: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
      orderBy: { dueDate: "desc" },
    });

    return {
      term: termName,
      records: records.map((r) => ({
        month: r.dueDate.toISOString().slice(0, 7),
        totalAmount: Number(r.totalAmount),
        paidAmount: Number(r.paidAmount),
        status: r.status,
      })),
    };
  }

  async upsertScanAndRecord(studentId, today, scanTime, method, deviceId, cutoffTimeStr = "08:30") {
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { studentId_date: { studentId, date: today } },
    });

    const [cutoffHour, cutoffMin] = cutoffTimeStr.split(":").map(Number);
    const cutoffTime = new Date(today);
    cutoffTime.setHours(cutoffHour || 8, cutoffMin || 30, 0, 0);

    let status = scanTime > cutoffTime ? "LATE" : "PRESENT";
    const scanEntry = { deviceId, method, scannedAt: scanTime.toISOString() };

    let attendanceRecord;
    if (!existingRecord) {
      attendanceRecord = await prisma.attendanceRecord.create({
        data: { studentId, date: today, status, checkIn: scanTime, scanLog: [scanEntry] },
      });
    } else if (!existingRecord.checkIn) {
      attendanceRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { status, checkIn: scanTime, scanLog: [...(existingRecord.scanLog || []), scanEntry] },
      });
    } else {
      attendanceRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { checkOut: scanTime, scanLog: [...(existingRecord.scanLog || []), scanEntry] },
      });
    }

    return { scanRecord: scanEntry, existingRecord, attendanceRecord, scanType: "CHECK_IN" };
  }

  // Staff Queries
  async findStaffBySchool(schoolId) {
    return prisma.user.findMany({
      where: { schoolId, isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Monthly attendance report — returns every record for a school in a given
   * month, pre-joined with student → section → class so the service layer
   * can group by class/section without N+1 queries.
   */
  async getMonthlySchoolAttendance(schoolId, startDate, endDate) {
    return prisma.attendanceRecord.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            imageUrl: true,
            section: {
              select: {
                id: true,
                name: true,
                class: { select: { id: true, name: true, order: true } },
              },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { checkIn: "asc" }],
    });
  }

  /**
   * Fetch all classes with their sections for a school (for the monthly
   * attendance report header — shows which sections exist even if they
   * have no records yet).
   */
  async getClassesWithSections(schoolId) {
    return prisma.class.findMany({
      where: { schoolId },
      include: {
        sections: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  /** Lightweight fee records for a student within a date range (gate scan). */
  async findStudentFeeRecords(studentId, startDate, endDate) {
    return prisma.feeRecord.findMany({
      where: {
        studentId,
        dueDate: { gte: startDate, lte: endDate },
      },
      select: {
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
      orderBy: { dueDate: "desc" },
    });
  }

  /** Find current active term for a school (indexed — single query). */
  async findCurrentTerm(schoolId) {
    const now = new Date();
    return prisma.term.findFirst({
      where: {
        academicYear: { schoolId, isCurrent: true },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { name: true, startDate: true, endDate: true },
    });
  }
}


export default new AttendanceRepository();
