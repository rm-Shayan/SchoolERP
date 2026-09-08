import prisma from "../../config/db.js";
import redis from "../../config/redis.js";

function redisGet(key) {
  try { return redis.get(key).then(JSON.parse).catch(() => null); } catch { return null; }
}
function redisSetEx(key, ttl, value) {
  try { return redis.setEx(key, ttl, JSON.stringify(value)).catch(() => {}); } catch { /* fail silently */ }
}

class FeeRepository {
  /** School ka default monthly due day — generate ke liye fallback. */
  async updateSchoolDueDay(schoolId, dueDay) {
    return prisma.school.update({
      where: { id: schoolId },
      data: { monthlyFeeDueDay: dueDay },
      select: { id: true, name: true, monthlyFeeDueDay: true },
    });
  }

  /** Saare schools (auto voucher job ke liye) — sirf fee structures walay. */
  async listSchoolsWithFeeSetup() {
    return prisma.school.findMany({
      where: { status: "ACTIVE", feeStructures: { some: {} } },
      select: { id: true, monthlyFeeDueDay: true },
    });
  }

  async classExists(classId) {
    return prisma.class.findUnique({
      where: { id: classId },
      include: { school: { select: { id: true, name: true } } },
    });
  }

  async academicYearExists(academicYearId) {
    return prisma.academicYear.findUnique({ where: { id: academicYearId } });
  }

  async sectionExists(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  // ── Fee Structures (year-aware, PRD §4) ───────────────────────
  // NOTE: FeeStructure ab m2m `classes` relation use karta hai (ek structure
  // kai classes par apply) — purana `classId` column migration mein drop ho
  // chuka hai. Isliye connect/some filters, kabhi `classId` field nahi.
  async createFeeStructure(data) {
    const { classIds = data.classId ? [data.classId] : [], classId: _classId, lineItems, ...structure } = data;
    return prisma.feeStructure.create({
      data: {
        ...structure,
        classes: { connect: classIds.map((id) => ({ id })) },
        lineItems: { create: lineItems },
      },
      include: { lineItems: true, academicYear: true, classes: { select: { id: true, name: true } } },
    });
  }

  async findFeeStructureById(id) {
    const cacheKey = `fee:struct:${id}`;
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
    const struct = await prisma.feeStructure.findUnique({
      where: { id },
      include: {
        lineItems: true,
        academicYear: true,
        classes: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (struct) redisSetEx(cacheKey, 300, struct);
    return struct;
  }

  async listFeeStructuresBySchool(schoolId, { classId, academicYearId }) {
    const cacheKey = `fee:structs:${schoolId}:${classId || "_"}:${academicYearId || "_"}`;
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
    const where = { schoolId };
    if (classId) where.classes = { some: { id: classId } };
    if (academicYearId) where.academicYearId = academicYearId;

    const result = await prisma.feeStructure.findMany({
      where,
      include: { lineItems: true, academicYear: true, classes: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    redisSetEx(cacheKey, 300, result);
    return result;
  }

  async deleteFeeStructure(id) {
    return prisma.feeStructure.delete({ where: { id } });
  }

  async updateFeeStructure(id, data) {
    return prisma.feeStructure.update({
      where: { id },
      data,
      include: { lineItems: true, academicYear: true, classes: { select: { id: true, name: true } } },
    });
  }

  async replaceFeeLineItems(structureId, lineItems) {
    return prisma.$transaction([
      prisma.feeLineItem.deleteMany({ where: { feeStructureId: structureId } }),
      prisma.feeLineItem.createMany({
        data: lineItems.map((li) => ({
          feeStructureId: structureId,
          title: li.title,
          amount: li.amount,
          isLateFee: li.isLateFee || false,
          lateFeeDays: li.lateFeeDays || 0,
        })),
      }),
    ]);
  }

  async findCurrentAcademicYear(schoolId) {
    return prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
  }

  async listActiveStudentsBySection(sectionId) {
    return prisma.student.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { parent: true },
      orderBy: { rollNumber: "asc" },
    });
  }

  async listActiveStudentsByClass(classId) {
    return prisma.student.findMany({
      where: { section: { classId }, status: "ACTIVE" },
      include: { parent: true, section: { include: { class: true } } },
      orderBy: { rollNumber: "asc" },
    });
  }

  async findActiveStudentsBySchool(schoolId) {
    return prisma.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      include: { parent: true, section: { include: { class: true } } },
      orderBy: { rollNumber: "asc" },
    });
  }

  async findStudentById(studentId) {
    return prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, schoolId: true, firstName: true, lastName: true },
    });
  }

  // ── Fee Records ────────────────────────────────────────────────
  async createFeeRecords(dataList) {
    return prisma.feeRecord.createMany({ data: dataList, skipDuplicates: true });
  }

  /** Per-student fee records — yearly summary (student detail view) ke liye. */
  async listFeeRecordsByStudent(studentId) {
    return prisma.feeRecord.findMany({
      where: { studentId },
      select: { id: true, dueDate: true, totalAmount: true, paidAmount: true, status: true },
      orderBy: { dueDate: "asc" },
    });
  }

  /** Batch: kisi due date par existing records (generate-monthly speed ke liye). */
  async findExistingRecordsForDate(studentIds, dueDate) {
    return prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds }, dueDate },
      select: { studentId: true },
    });
  }

  /** Batch: previous month ki records (carry-forward arrears ke liye).
   *  Har student ka sirf previous-month record fetch karta hai — isse aage
   *  ke arrears already us record ke outstanding mein shaamil hote hain, toh
   *  double-count nahi hota. */
  async findPreviousMonthRecords(studentIds, prevMonthStart, prevMonthEnd) {
    return prisma.feeRecord.findMany({
      where: {
        studentId: { in: studentIds },
        dueDate: { gte: prevMonthStart, lte: prevMonthEnd },
        status: { not: "PAID" },
      },
      select: { id: true, studentId: true, totalAmount: true, paidAmount: true, status: true },
    });
  }

  /** Batch: current month se PURANE saare unpaid records (consolidation ke liye).
   *  Har mahina apni row banayega voucher par — isliye sirf previous month nahi,
   *  balki sabhi purane unpaid records uthate hain. */
  async findUnpaidRecordsBefore(studentIds, dueDate) {
    return prisma.feeRecord.findMany({
      where: {
        studentId: { in: studentIds },
        dueDate: { lt: dueDate },
        status: { not: "PAID" },
      },
      select: { id: true, studentId: true, totalAmount: true, paidAmount: true, dueDate: true, status: true, periods: true },
      orderBy: { dueDate: "asc" },
    });
  }

  /** Kya student ne is (year, month) ka fee advance mein pay kar diya hai?
   *  Advance payment ke mahine par monthly reminder nahi bhejna. Har record ab
   *  ek hi mahina hai — toh PAID record ka apna dueDate month bhi match kare. */
  async hasPaidPeriod(studentId, year, month) {
    const recs = await prisma.feeRecord.findMany({
      where: { studentId, status: "PAID" },
      select: { dueDate: true, periods: true },
    });
    for (const r of recs) {
      const d = new Date(r.dueDate);
      if (d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month) return true;
      const ps = Array.isArray(r.periods) ? r.periods : [];
      if (ps.some((p) => p.year === year && p.month === month && p.status === "PAID")) return true;
    }
    return false;
  }

  /** Batch: kai classes ke structures ek query me (auto-pick generate ke liye). */
  async findStructuresForClasses(classIds, academicYearId) {
    return prisma.feeStructure.findMany({
      where: { classes: { some: { id: { in: classIds } } }, academicYearId },
      include: { lineItems: true, classes: { select: { id: true } } },
    });
  }

  async findFeeRecordById(id) {
    const cacheKey = `fee:rec:${id}`;
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
    const rec = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        payments: true,
        student: {
          include: {
            parent: true,
            // logoUrl + organization yahan zaroori hain — warna voucher/receipt
            // PDF par logo kabhi nahi aata (select me missing tha).
            school: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                bankName: true,
                bankAccountTitle: true,
                bankAccountNumber: true,
                organization: { select: { logoUrl: true, themeColor: true, bankName: true, bankAccountTitle: true, bankAccountNumber: true } },
              },
            },
            section: { include: { class: true } },
          },
        },
      },
    });
    if (rec) redisSetEx(cacheKey, 60, rec);
    return rec;
  }

  async findOpenRecordsForStudent(studentId, schoolId) {
    return prisma.feeRecord.findMany({
      where: { studentId, status: { not: "PAID" }, student: { schoolId } },
      orderBy: { dueDate: "asc" },
    });
  }

  /** Specific monthly records (selected months) pay karne ke liye. */
  async findFeeRecordsByIds(ids, studentId) {
    return prisma.feeRecord.findMany({
      where: { id: { in: ids }, studentId },
      orderBy: { dueDate: "asc" },
    });
  }

  /** Archived year summary rows — per-student yearly view ke liye. */
  async listFeeYearSummariesByStudent(studentId) {
    return prisma.feeYearSummary.findMany({
      where: { studentId },
      orderBy: { yearLabel: "desc" },
    });
  }

  /**
   * Year-end archive (attendance archive jaisa hi pattern): cutoff se pehle ke
   * saare fee records per-student per-year summary mein roll-up hokar delete.
   * Re-run safe — summaries upsert hoti hain, delete sirf fetched records par.
   */
  async archiveFeeRecords(cutoff) {
    const summary = { studentsProcessed: 0, recordsArchived: 0, summariesCreated: 0 };

    // Single query: fetch ALL records before cutoff with schoolId embedded.
    // Eliminates N+1: no per-student groupBy + findMany + findUnique.
    const allRecords = await prisma.feeRecord.findMany({
      where: { dueDate: { lt: cutoff } },
      select: {
        id: true, studentId: true, dueDate: true,
        totalAmount: true, paidAmount: true, status: true,
        student: { select: { schoolId: true } },
      },
    });
    if (!allRecords.length) return summary;

    // Group by studentId in memory (zero extra DB calls)
    const grouped = new Map();
    for (const rec of allRecords) {
      const sid = rec.studentId;
      if (!grouped.has(sid)) grouped.set(sid, { schoolId: rec.student?.schoolId, records: [] });
      grouped.get(sid).records.push(rec);
    }

    for (const [studentId, { schoolId, records }] of grouped) {
      if (!schoolId || !records.length) continue;

      const byYear = new Map();
      for (const rec of records) {
        const year = String(rec.dueDate.getFullYear());
        if (!byYear.has(year)) {
          byYear.set(year, {
            recordCount: 0, totalCharged: 0, totalPaid: 0,
            paidRecords: 0, partialRecords: 0, unpaidRecords: 0, overdueRecords: 0,
            from: rec.dueDate, to: rec.dueDate,
          });
        }
        const b = byYear.get(year);
        b.recordCount++;
        b.totalCharged += Number(rec.totalAmount);
        b.totalPaid += Number(rec.paidAmount);
        if (rec.dueDate < b.from) b.from = rec.dueDate;
        if (rec.dueDate > b.to) b.to = rec.dueDate;
        if (rec.status === "PAID") b.paidRecords++;
        else if (rec.status === "PARTIAL") b.partialRecords++;
        else if (rec.status === "OVERDUE") b.overdueRecords++;
        else b.unpaidRecords++;
      }

      await prisma.$transaction(async (tx) => {
        for (const [year, b] of byYear) {
          await tx.feeYearSummary.upsert({
            where: { studentId_yearLabel: { studentId, yearLabel: year } },
            create: {
              studentId,
              schoolId,
              yearLabel: year,
              dateFrom: b.from,
              dateTo: b.to,
              recordCount: b.recordCount,
              totalCharged: Number(b.totalCharged.toFixed(2)),
              totalPaid: Number(b.totalPaid.toFixed(2)),
              paidRecords: b.paidRecords,
              partialRecords: b.partialRecords,
              unpaidRecords: b.unpaidRecords,
              overdueRecords: b.overdueRecords,
            },
            update: {
              recordCount: { increment: b.recordCount },
              totalCharged: { increment: b.totalCharged },
              totalPaid: { increment: b.totalPaid },
              paidRecords: { increment: b.paidRecords },
              partialRecords: { increment: b.partialRecords },
              unpaidRecords: { increment: b.unpaidRecords },
              overdueRecords: { increment: b.overdueRecords },
            },
          });
          summary.summariesCreated++;
        }
        await tx.feeRecord.deleteMany({ where: { id: { in: records.map((r) => r.id) } } });
      });

      summary.studentsProcessed++;
      summary.recordsArchived += records.length;
    }

    return summary;
  }

  async listFeeRecords({ schoolId, studentId, classId, status, dueDateBefore, dueDateAfter, page, pageSize }) {
    const where = { student: { schoolId } };
    if (studentId) where.studentId = studentId;
    if (classId) where.student.section = { classId };
    if (status) where.status = status;
    if (dueDateBefore) where.dueDate = { ...(where.dueDate || {}), lte: new Date(dueDateBefore) };
    if (dueDateAfter) where.dueDate = { ...(where.dueDate || {}), gte: new Date(dueDateAfter) };

    const [items, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: {
          payments: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rollNumber: true,
              section: { include: { class: true } },
            },
          },
        },
        orderBy: { dueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feeRecord.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * Bulk fee records for multiple students — ek single query.
   * Fee Collection page ke liye: search results ke saare students ke
   * records ek saath fetch hote hain (N+1 eliminate).
   */
  async listFeeRecordsByStudentIds(studentIds, { status, dueDateBefore, dueDateAfter } = {}) {
    if (!studentIds?.length) return {};
    const where = { studentId: { in: studentIds } };
    if (status) where.status = status;
    if (dueDateBefore) where.dueDate = { ...(where.dueDate || {}), lte: new Date(dueDateBefore) };
    if (dueDateAfter) where.dueDate = { ...(where.dueDate || {}), gte: new Date(dueDateAfter) };

    const items = await prisma.feeRecord.findMany({
      where,
      include: {
        payments: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    // Group by studentId — frontend ko { [studentId]: FeeRecord[] } chahiye.
    const grouped = {};
    for (const id of studentIds) grouped[id] = [];
    for (const rec of items) {
      grouped[rec.studentId] = grouped[rec.studentId] || [];
      grouped[rec.studentId].push(rec);
    }
    return grouped;
  }

  /** Bulk records — school ke saare students ke records ek call mein. */
  async listFeeRecordsBySchool(schoolId, { status, dueDateBefore, dueDateAfter } = {}) {
    const students = await prisma.student.findMany({ where: { schoolId }, select: { id: true } });
    if (!students.length) return {};
    return this.listFeeRecordsByStudentIds(students.map((s) => s.id), { status, dueDateBefore, dueDateAfter });
  }

  /** Overdue records with their student's section/class — overdue sweep ke liye. */
  async findOverdueRecordsWithStudent() {
    return prisma.feeRecord.findMany({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
        dueDate: { lt: new Date() },
      },
      include: {
        student: {
          include: {
            section: { include: { class: true } },
            school: { select: { id: true } },
          },
        },
      },
    });
  }

  /** Find fee structure by student's class + academic year (late fee calc ke liye). */
  async findStructureForStudent(studentSectionClassId, academicYearId) {
    return prisma.feeStructure.findFirst({
      where: { classes: { some: { id: studentSectionClassId } }, academicYearId },
      include: { lineItems: true },
    });
  }

  /** Find current academic year for a school. */
  async findCurrentYearForSchool(schoolId) {
    return prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
  }

  /** Bulk update dueCharges for records. */
  async bulkUpdateDueCharges(updates) {
    return prisma.$transaction(
      updates.map((u) => prisma.feeRecord.update({
        where: { id: u.id },
        data: { dueCharges: u.dueCharges },
      }))
    );
  }

  async updateFeeRecord(id, data) {
    return prisma.feeRecord.update({ where: { id }, data });
  }

  /** Ek student ka due date extend karo (is month ke liye). OVERDUE → UNPAID reset. */
  async updateFeeRecordDueDate(id, dueDate) {
    return prisma.feeRecord.update({
      where: { id },
      data: { dueDate, status: "UNPAID", reminderSentAt: null },
    });
  }

  /** Overdue ho chuke records jinhe reminder abhi nahi bheja gaya (once-only). */
  async listRecordsNeedingOverdueReminder() {
    return prisma.feeRecord.findMany({
      where: {
        status: { in: ["OVERDUE", "PARTIAL"] },
        reminderSentAt: null,
        student: { status: "ACTIVE" },
      },
      include: {
        student: {
          include: { parent: true, school: true, section: { include: { class: true } } },
        },
      },
    });
  }

  async markReminderSent(ids, at = new Date()) {
    return prisma.feeRecord.updateMany({
      where: { id: { in: ids } },
      data: { reminderSentAt: at },
    });
  }

  /** Pre-due records (due date 0-3 din baqi) jinhe pre-due reminder abhi nahi gaya. */
  async listRecordsNeedingPreDueReminder(dueFrom, dueTo) {
    return prisma.feeRecord.findMany({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
        dueDate: { gte: dueFrom, lte: dueTo },
        preDueReminderSentAt: null,
        student: { status: "ACTIVE" },
      },
      include: {
        student: {
          include: { parent: true, school: true, section: { include: { class: true } } },
        },
      },
    });
  }

  async markPreDueReminderSent(ids, at = new Date()) {
    return prisma.feeRecord.updateMany({
      where: { id: { in: ids } },
      data: { preDueReminderSentAt: at },
    });
  }

  async createFeePayment(data) {
    return prisma.feePayment.create({ data });
  }

  // Overdue sweep (PRD §4 — overdue pe bhi reminder)
  async listUnpaidRecords({ dueBefore, schoolId, dueDateFrom, dueDateTo }) {
    const where = { status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } };
    if (schoolId) where.student = { schoolId };
    if (dueBefore) where.dueDate = { ...(where.dueDate || {}), lt: new Date(dueBefore) };
    if (dueDateFrom) where.dueDate = { ...(where.dueDate || {}), gte: dueDateFrom };
    if (dueDateTo) where.dueDate = { ...(where.dueDate || {}), lte: dueDateTo };

    return prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          include: { parent: true, school: true, section: { include: { class: true } } },
        },
      },
    });
  }

  async markOverdue(ids) {
    return prisma.feeRecord.updateMany({
      where: { id: { in: ids } },
      data: { status: "OVERDUE" },
    });
  }

  /** Month ke saare fee records (bina pagination) — CSV export ke liye. */
  async exportFeeRecords({ schoolId, status, dueDateFrom, dueDateTo }) {
    const where = { student: { schoolId } };
    if (status) where.status = status;
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {
        ...(dueDateFrom ? { gte: dueDateFrom } : {}),
        ...(dueDateTo ? { lte: dueDateTo } : {}),
      };
    }
    return prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            rollNumber: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { student: { rollNumber: "asc" } }],
    });
  }

  /** Month ka fee summary — totals + status counts (Fee Records page cards). */
  async getFeeSummary({ schoolId, dueDateFrom, dueDateTo }) {
    const where = {
      student: { schoolId },
      ...(dueDateFrom || dueDateTo
        ? { dueDate: { ...(dueDateFrom ? { gte: dueDateFrom } : {}), ...(dueDateTo ? { lte: dueDateTo } : {}) } }
        : {}),
    };
    const [agg, byStatus] = await Promise.all([
      prisma.feeRecord.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, dueCharges: true },
        _count: { _all: true },
      }),
      prisma.feeRecord.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);

    const counts = { UNPAID: 0, PARTIAL: 0, PAID: 0, OVERDUE: 0 };
    for (const row of byStatus) counts[row.status] = row._count._all;

    const totalAmount = Number(agg._sum.totalAmount || 0);
    const paidAmount = Number(agg._sum.paidAmount || 0);
    const totalCharges = Number(agg._sum.dueCharges || 0);
    return {
      total: agg._count._all,
      collected: Number(paidAmount.toFixed(2)),
      outstanding: Number((totalAmount - paidAmount).toFixed(2)),
      totalCharges: Number(totalCharges.toFixed(2)),
      counts,
    };
  }

  /**
   * Bulk fee records for a class — voucher PDF print ke liye.
   * Class ke saare active students ke fee records ek query mein.
   */
  async findBulkFeeRecordsForClass({ classId, schoolId, month, year, status, studentIds }) {
    const where = {
      student: {
        schoolId,
        ...(classId ? { section: { classId } } : {}),
        status: "ACTIVE",
        ...(studentIds?.length ? { id: { in: studentIds } } : {}),
      },
    };
    if (month && year) {
      const m = Number(month), y = Number(year);
      const from = new Date(Date.UTC(y, m - 1, 1));
      const to = new Date(Date.UTC(y, m, 0));
      where.dueDate = { gte: from, lte: to };
    }
    if (status) where.status = status;

    return prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            imageUrl: true,
            identifierCode: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: [{ student: { rollNumber: "asc" } }, { dueDate: "desc" }],
    });
  }

  /**
   * Fee structure line items for a class — voucher line items ke liye.
   */
  async findFeeStructureForClass(classId, academicYearId) {
    return prisma.feeStructure.findFirst({
      where: { classes: { some: { id: classId } }, academicYearId },
      include: { lineItems: true },
    });
  }

}

export default new FeeRepository();
