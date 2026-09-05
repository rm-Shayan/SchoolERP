import feeRepository from "./repository.js";
import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { buildCsv } from "../../lib/utils/csv.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import pdfService from "../../services/pdf.service.js";
import { emitToRoom } from "../../config/websocket.js";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "../../lib/utils/cache.js";

class FeeService {
  // ──────────────────────────────────────────
  // FEE STRUCTURES (PRD §4 — year-aware)
  // ──────────────────────────────────────────

  /**
   * Create a fee structure tied to an academic year (PRD §4 — "har saal
   * amount change ho sakta hai, purane saal ka fee record frozen rahe").
   */
  async createFeeStructure(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const classIdList = data.classId ? [data.classId] : (data.classIds || []);
    if (!classIdList.length) {
      throw ApiError.badRequestError("Select at least one class");
    }
    const classes = await prisma.class.findMany({
      where: { id: { in: classIdList } },
      select: { id: true, schoolId: true },
    });
    if (classes.length !== classIdList.length) {
      throw ApiError.notFoundError("One or more classes not found");
    }
    for (const cls of classes) {
      if (cls.schoolId !== targetSchoolId) {
        throw ApiError.badRequestError("Class does not belong to the given school");
      }
    }

    const year = await feeRepository.academicYearExists(data.academicYearId);
    if (!year) throw ApiError.notFoundError("Academic year not found");
    if (year.schoolId !== targetSchoolId) {
      throw ApiError.badRequestError("Academic year does not belong to the given school");
    }

    if (!data.lineItems?.length) {
      throw ApiError.badRequestError("At least one fee line item is required");
    }

    cacheInvalidatePrefix(`fee:structures:${targetSchoolId}:`);
    return feeRepository.createFeeStructure({
      schoolId: targetSchoolId,
      classIds: classIdList,
      academicYearId: data.academicYearId,
      name: data.name,
      lineItems: data.lineItems.map((li) => ({
        title: li.title,
        amount: Number(li.amount),
        isLateFee: li.isLateFee || false,
        lateFeeDays: li.lateFeeDays || 0,
      })),
    });
  }

  async listFeeStructures(user, schoolId, { classId, academicYearId }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const cacheKey = `fee:structures:${targetSchoolId}:${classId || "_"}:${academicYearId || "_"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await feeRepository.listFeeStructuresBySchool(targetSchoolId, { classId, academicYearId });
    await cacheSet(cacheKey, result, 60);
    return result;
  }

  /**
   * Update a fee structure (name / class / year / line items). Line items
   * replace karte hain — purane delete hote hain, naye create (PRD §4).
   */
  async updateFeeStructure(user, id, data) {
    const structure = await feeRepository.findFeeStructureById(id);
    if (!structure) throw ApiError.notFoundError("Fee structure not found");
    assertOwnSchool(user, structure.schoolId);

    if (data.classId) {
      const cls = await feeRepository.classExists(data.classId);
      if (!cls) throw ApiError.notFoundError("Class not found");
      if (cls.schoolId !== structure.schoolId) {
        throw ApiError.badRequestError("Class does not belong to the given school");
      }
    }
    if (data.academicYearId) {
      const year = await feeRepository.academicYearExists(data.academicYearId);
      if (!year) throw ApiError.notFoundError("Academic year not found");
      if (year.schoolId !== structure.schoolId) {
        throw ApiError.badRequestError("Academic year does not belong to the given school");
      }
    }

    const { lineItems, classId, ...rest } = data;
    if (classId) {
      // m2m — class replace karo (UI single-class hi bhejta hai).
      rest.classes = { set: [{ id: classId }] };
    }
    if (Object.keys(rest).length) {
      await feeRepository.updateFeeStructure(id, rest);
    }
    if (lineItems?.length) {
      await feeRepository.replaceFeeLineItems(
        id,
        lineItems.map((li) => ({
          title: li.title,
          amount: Number(li.amount),
          isLateFee: li.isLateFee || false,
          lateFeeDays: li.lateFeeDays || 0,
        }))
      );
    }
    cacheInvalidatePrefix(`fee:structures:${structure.schoolId}:`);
    return feeRepository.findFeeStructureById(id);
  }

  async getFeeStructure(user, id) {
    const structure = await feeRepository.findFeeStructureById(id);
    if (!structure) throw ApiError.notFoundError("Fee structure not found");
    assertSchoolAccess(user, structure.schoolId);
    return structure;
  }

  async deleteFeeStructure(user, id) {
    const structure = await this.getFeeStructure(user, id);
    assertOwnSchool(user, structure.schoolId);
    await feeRepository.deleteFeeStructure(id);
    cacheInvalidatePrefix(`fee:structures:${structure.schoolId}:`);
    return true;
  }

  // ──────────────────────────────────────────
  // FEE RECORDS (per student per due date)
  // ──────────────────────────────────────────

  /**
   * Bulk-generate monthly fee records for all active students in a section
   * using the class fee structure (PRD §4).
   */
  async generateMonthlyFees(user, { schoolId, sectionId, classId, structureId, month, year, dueDay, months = 1 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);
    cacheInvalidatePrefix(`fee:records:${targetSchoolId}:`);
    let result = { created: 0, skipped: 0, dueDay };
    for (let offset = 0; offset < Number(months); offset += 1) {
      const date = new Date(Date.UTC(year, month - 1 + offset, 1));
      const part = await this._generateMonthlyFeesCore(targetSchoolId, { sectionId, classId, structureId, month: date.getUTCMonth() + 1, year: date.getUTCFullYear(), dueDay });
      result.created += part.created || 0;
      result.skipped += part.skipped || 0;
      result.dueDay = part.dueDay;
    }
    return result;
  }

  /**
   * Scheduler job ke liye — system-level run (koi user scope check nahi).
   * School ka saved due day use karta hai; records already existing ho to skip.
   */
  async autoGenerateMonthlyFees(schoolId, month, year) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, monthlyFeeDueDay: true },
    });
    if (!school) return { skipped: true, reason: "School not found" };
    try {
      cacheInvalidatePrefix(`fee:records:${schoolId}:`);
      return await this._generateMonthlyFeesCore(schoolId, {
        month,
        year,
        dueDay: school.monthlyFeeDueDay || 10,
      });
    } catch (err) {
      // Setup incomplete (no current year / no structures / no students) →
      // poore platform ka job fail nahi hota, school skip ho jata hai.
      return { skipped: true, reason: err.message };
    }
  }

  async _generateMonthlyFeesCore(targetSchoolId, { sectionId, classId, structureId, month, year, dueDay, skipCarryForward = false }) {
    // Due day: UI/API bheje to use persist kar do (agle mahine bhi yahi rahe);
    // nahi bheja to school ka saved default (ya 10) use karo.
    const school = await assertSchoolExists(targetSchoolId);
    const effectiveDueDay = Number(dueDay) || school.monthlyFeeDueDay || 10;
    if (dueDay && Number(dueDay) !== school.monthlyFeeDueDay) {
      await feeRepository.updateSchoolDueDay(targetSchoolId, Number(dueDay));
    }

    let students = [];
    let scopeClassId = null;
    if (sectionId) {
      const section = await feeRepository.sectionExists(sectionId);
      if (!section) throw ApiError.notFoundError("Section not found");
      if (section.class.schoolId !== targetSchoolId) {
        throw ApiError.badRequestError("Section does not belong to the given school");
      }
      scopeClassId = section.classId;
      students = await feeRepository.listActiveStudentsBySection(sectionId);
    } else if (classId) {
      const cls = await feeRepository.classExists(classId);
      if (!cls) throw ApiError.notFoundError("Class not found");
      if (cls.schoolId !== targetSchoolId) {
        throw ApiError.badRequestError("Class does not belong to the given school");
      }
      scopeClassId = cls.id;
      students = await feeRepository.listActiveStudentsByClass(classId);
    } else {
      students = await feeRepository.findActiveStudentsBySchool(targetSchoolId);
    }

    if (!students.length) {
      throw ApiError.badRequestError("No active students found for the given scope");
    }

    // Explicit structure diya ho → sabko usi ka amount; nahi diya → har
    // student apni class ke current-year structure se ("primary same fee").
    let defaultStructure = null;
    if (structureId) {
      defaultStructure = await feeRepository.findFeeStructureById(structureId);
      if (!defaultStructure) throw ApiError.notFoundError("Fee structure not found");
      if (defaultStructure.schoolId !== targetSchoolId) {
        throw ApiError.badRequestError("Fee structure does not belong to the given school");
      }
      if (scopeClassId && !(defaultStructure.classes || []).some((c) => c.id === scopeClassId)) {
        throw ApiError.badRequestError("Scope's class does not match the fee structure's class");
      }
    }

    const yearRow = await feeRepository.findCurrentAcademicYear(targetSchoolId);
    if (!yearRow && !defaultStructure) {
      throw ApiError.badRequestError("No current academic year found — pehle academic year banao");
    }

    const periodMonthLabel = (date) =>
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toLocaleString("en-PK", { month: "long", year: "numeric" });
    const dueDate = new Date(Date.UTC(year, month - 1, effectiveDueDay));
    const monthLabel = periodMonthLabel(new Date(Date.UTC(year, month - 1, 1)));

    // Batch: existing records ek query me, structures class-wise ek query me —
    // hundreds of students par bhi generate-seconds me (per-record loop nahi).
    const studentIds = students.map((s) => s.id);
    const existing = await feeRepository.findExistingRecordsForDate(studentIds, dueDate);
    const existingSet = new Set(existing.map((r) => r.studentId));

    // Har mahina apni ALAG FeeRecord banayega (consolidation nahi). Purane
    // unpaid months apni records mein hi rehti hain → unka status sahi rahega
    // (ghalat PAID nahi dikhega) aur voucher sab open months ko itemized dikhayega.
    let structureByClass = new Map();
    if (!defaultStructure) {
      const classIds = [...new Set(students.map((s) => s.section?.classId ?? scopeClassId).filter(Boolean))];
      const structs = await feeRepository.findStructuresForClasses(classIds, yearRow.id);
      // Ek structure kai classes par apply ho sakta hai — har class ko apna
      // structure map karo (st.classes se).
      structureByClass = new Map(
        structs.flatMap((st) => (st.classes || []).map((c) => [c.id, st]))
      );
    }

    let created = 0;
    let skipped = 0;
    const recordsData = [];
    for (const student of students) {
      if (existingSet.has(student.id)) { skipped++; continue; }
      const structure = defaultStructure || structureByClass.get(student.section?.classId ?? scopeClassId);
      if (!structure) continue; // class ka structure nahi → voucher skip
      // Sirf regular (non-late-fee) line items ka total — late fee baad me auto-add hoga
      const baseFee = Number(structure.lineItems
        .filter((li) => !li.isLateFee)
        .reduce((s, li) => s + Number(li.amount), 0).toFixed(2));
      // Sirf isi month ka record — periods mein sirf yehi month.
      const periods = [{ year, month, label: monthLabel, amount: baseFee, status: "UNPAID" }];
      recordsData.push({ studentId: student.id, dueDate, totalAmount: baseFee, paidAmount: 0, status: "UNPAID", periods });
    }
    if (recordsData.length) {
      created = (await feeRepository.createFeeRecords(recordsData)).count;
    }

    if (created === 0 && skipped === 0) {
      throw ApiError.badRequestError("Kisi class ke liye fee structure nahi mila — pehle Fee Structures me banao");
    }

    emitToRoom(`school:${targetSchoolId}`, "fees_generated", {
      monthLabel,
      created,
      structureId,
    });

    return { monthLabel, dueDate, dueDay: effectiveDueDay, created, studentsInScope: students.length };
  }

  /**
   * Month ke poore fee record ka CSV — branch staff Excel/CSV mein download
   * kare (student export ki tarah "proper school system" requirement).
   */
  async exportFeeRecords(user, { schoolId, month, year, status }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    let dueDateFrom = null;
    let dueDateTo = null;
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      if (m >= 1 && m <= 12 && y >= 2000) {
        dueDateFrom = new Date(Date.UTC(y, m - 1, 1));
        dueDateTo = new Date(Date.UTC(y, m, 0));
      }
    }

    const records = await feeRepository.exportFeeRecords({
      schoolId: targetSchoolId,
      status,
      dueDateFrom,
      dueDateTo,
    });

    const money = (n) => Number(n || 0).toFixed(2);
    const dateStr = (d) => (d ? new Date(d).toLocaleDateString("en-PK") : "");

    return buildCsv(
      ["Student Name", "Roll Number", "Class", "Section", "Due Date", "Total Fee", "Paid", "Balance", "Status", "Overdue Reminder Sent"],
      records.map((r) => {
        const st = r.student;
        const paid = Number(r.paidAmount);
        return [
          `${st.firstName} ${st.lastName}`.trim(),
          st.rollNumber,
          st.section?.class?.name,
          st.section?.name,
          dateStr(r.dueDate),
          money(r.totalAmount),
          money(paid),
          money(Number(r.totalAmount) - paid),
          r.status,
          r.reminderSentAt ? dateStr(r.reminderSentAt) : "",
        ];
      })
    );
  }

  /** Month/year ke hisaab se fee summary — Fee Records page ke stat cards. */
  async getFeeSummary(user, { schoolId, month, year }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    let dueDateFrom = null;
    let dueDateTo = null;
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      if (m >= 1 && m <= 12 && y >= 2000) {
        dueDateFrom = new Date(Date.UTC(y, m - 1, 1));
        dueDateTo = new Date(Date.UTC(y, m, 0));
      }
    }
    return feeRepository.getFeeSummary({ schoolId: targetSchoolId, dueDateFrom, dueDateTo });
  }

  /** School ka current default monthly due day (page load par fetch). */
  async getSchoolDueDay(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    const school = await assertSchoolExists(targetSchoolId);
    return { schoolId: targetSchoolId, monthlyFeeDueDay: school.monthlyFeeDueDay || 10 };
  }

  /**
   * School ka default monthly due day set karo (e.g. 10 = har month 10th).
   * Agle mahine ka voucher isi due day par auto-generate hoga.
   */
  async setSchoolDueDay(user, schoolId, dueDay) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    const day = Number(dueDay);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      throw ApiError.badRequestError("Due day must be between 1 and 28");
    }
    return feeRepository.updateSchoolDueDay(targetSchoolId, day);
  }

  /**
   * Ek particular bache ka is month ka due date extend karo.
   * Overdue record extend hone par wapas UNPAID ho jata hai (ab overdue nahi).
   */
  async updateRecordDueDate(user, recordId, dueDate) {
    const record = await feeRepository.findFeeRecordById(recordId);
    if (!record) throw ApiError.notFoundError("Fee record not found");
    assertOwnSchool(user, record.student.schoolId);

    const newDue = new Date(dueDate);
    if (Number.isNaN(newDue.getTime())) throw ApiError.badRequestError("Invalid due date");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDue.getTime() < today.getTime()) {
      throw ApiError.badRequestError("Due date cannot be in the past");
    }

    const updated = await feeRepository.updateFeeRecordDueDate(recordId, newDue);
    emitToRoom(`school:${record.student.schoolId}`, "fee_due_date_updated", {
      feeRecordId: recordId,
      dueDate: newDue,
    });
    return updated;
  }

  async listFeeRecords(user, { schoolId, studentId, classId, status, dueDateBefore, dueDateAfter, page, pageSize }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    if (studentId) {
      const student = await feeRepository.findStudentById(studentId);
      if (!student || student.schoolId !== targetSchoolId) {
        throw ApiError.notFoundError("Student not found in this school");
      }
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    const cacheKey = `fee:records:${targetSchoolId}:${studentId || "_"}:${classId || "_"}:${status || "_"}:${dueDateBefore || "_"}:${dueDateAfter || "_"}:${p}:${ps}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await feeRepository.listFeeRecords({
      schoolId: targetSchoolId,
      studentId,
      classId,
      status,
      dueDateBefore,
      dueDateAfter,
      page: p,
      pageSize: ps,
    });

    await cacheSet(cacheKey, result, 30);
    return result;
  }

  /**
   * Bulk fee records for multiple students — single query.
   * Fee Collection page ke liye: N+1 eliminate.
   */
  async listFeeRecordsByStudentIds(user, { schoolId, studentIds, status, dueDateBefore, dueDateAfter }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    // studentIds empty → school ke saare students
    if (!studentIds?.length) {
      return feeRepository.listFeeRecordsBySchool(targetSchoolId, { status, dueDateBefore, dueDateAfter });
    }

    // Validate all students belong to this school (batch)
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId: targetSchoolId },
      select: { id: true },
    });
    const validIds = students.map((s) => s.id);
    if (!validIds.length) return {};

    return feeRepository.listFeeRecordsByStudentIds(validIds, { status, dueDateBefore, dueDateAfter });
  }

  /**
   * Per-student yearly fee summary (student detail view).
   * Archived saal FeeYearSummary se, current year live records se — dono merge
   * hote hain, is liye archive ke baad bhi purane saal ka record nahi gumta.
   */
  async getStudentYearlyFeeSummaries(user, studentId) {
    const student = await feeRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertSchoolAccess(user, student.schoolId);

    const [summaries, records] = await Promise.all([
      feeRepository.listFeeYearSummariesByStudent(studentId),
      feeRepository.listFeeRecordsByStudent(studentId),
    ]);

    const byYear = new Map();
    const bucket = (year) => {
      if (!byYear.has(year)) {
        byYear.set(year, {
          yearLabel: year,
          recordCount: 0,
          totalCharged: 0,
          totalPaid: 0,
          outstanding: 0,
          paidRecords: 0,
          partialRecords: 0,
          unpaidRecords: 0,
          overdueRecords: 0,
        });
      }
      return byYear.get(year);
    };

    // Archived saal — FeeYearSummary se (raw records delete ho chuke hain).
    for (const s of summaries) {
      const b = bucket(s.yearLabel);
      b.recordCount += s.recordCount;
      b.totalCharged += Number(s.totalCharged);
      b.totalPaid += Number(s.totalPaid);
      b.paidRecords += s.paidRecords;
      b.partialRecords += s.partialRecords;
      b.unpaidRecords += s.unpaidRecords;
      b.overdueRecords += s.overdueRecords;
    }

    // Live records (current saal / jo abhi bhi raw hain) — status + amounts.
    for (const rec of records) {
      const b = bucket(String(new Date(rec.dueDate).getFullYear()));
      b.recordCount++;
      const charged = Number(rec.totalAmount);
      const paid = Number(rec.paidAmount);
      b.totalCharged += charged;
      b.totalPaid += paid;
      if (rec.status === "PAID") b.paidRecords++;
      else if (rec.status === "PARTIAL") b.partialRecords++;
      else if (rec.status === "OVERDUE") b.overdueRecords++;
      else b.unpaidRecords++;
    }

    return [...byYear.values()]
      .map((s) => ({
        ...s,
        totalCharged: Number(s.totalCharged.toFixed(2)),
        totalPaid: Number(s.totalPaid.toFixed(2)),
        outstanding: Number(s.outstanding.toFixed(2)),
      }))
      .sort((a, b) => (a.yearLabel < b.yearLabel ? 1 : -1));
  }

  /**
   * Year-end archive (scheduler): saal khatam hone par saare fee records
   * per-student yearly summary mein roll-up hokar delete — "DB se gnd nikaalo,
   * history summary ke roop mein rehti hai" (attendance archive jaisa).
   * Cutoff: current saal ki 1 January — matlab poore completed saal archive.
   */
  async archiveFeeRecords() {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
    return feeRepository.archiveFeeRecords(cutoff);
  }

  // ──────────────────────────────────────────
  // PAYMENTS + RECEIPTS (PRD §4)
  // ──────────────────────────────────────────

  /**
   * Record a payment → recompute status → PDF receipt. Notification channel
   * status par depend karta hai: PAID → portal-only (no email); PARTIAL →
   * parent ko updated fee voucher email.
   */
  async recordPayment(user, feeRecordId, { amount, method = "CASH", reference, allocateOpenRecords = false, periodMonths = null, recordIds = null, allocations = null }) {
    const record = await feeRepository.findFeeRecordById(feeRecordId);
    if (!record) throw ApiError.notFoundError("Fee record not found");
    assertOwnSchool(user, record.student.schoolId);

    const paidAmount = Number(amount);
    if (paidAmount <= 0) throw ApiError.badRequestError("Payment amount must be positive");

    if (Array.isArray(allocations) && allocations.length) {
      const items = await feeRepository.findFeeRecordsByIds(allocations.map((a) => a.recordId), record.studentId);
      const byId = new Map(items.map((item) => [item.id, item]));
      const allocatedTotal = allocations.reduce((sum, item) => sum + Number(item.amount), 0);
      if (Math.abs(allocatedTotal - paidAmount) > 0.5) throw ApiError.badRequestError("Payment total does not match month allocation");
      await prisma.$transaction(async (tx) => {
        for (const allocation of allocations) {
          const item = byId.get(allocation.recordId);
          if (!item) throw ApiError.badRequestError("Invalid fee month selected");
          const applied = Number(allocation.amount);
          const balance = Math.max(0, Number(item.totalAmount) + Number(item.dueCharges || 0) - Number(item.paidAmount || 0));
          if (applied > balance) throw ApiError.badRequestError("A month payment exceeds its balance");
          await tx.feePayment.create({ data: { feeRecordId: item.id, amount: Number(applied.toFixed(2)), method, reference: reference || null } });
          const nextPaid = Number(item.paidAmount || 0) + applied;
          await tx.feeRecord.update({ where: { id: item.id }, data: { paidAmount: Number(nextPaid.toFixed(2)), status: applied >= balance ? "PAID" : "PARTIAL" } });
        }
      });
      cacheInvalidatePrefix(`fee:records:${record.student.schoolId}:`);
      emitToRoom(`school:${record.student.schoolId}`, "fee_payment_recorded", { feeRecordId, amount: paidAmount });
      // Portal notification for admin
      const sName = `${record.student.firstName} ${record.student.lastName}`;
      portalNotificationService.create({
        schoolId: record.student.schoolId, senderName: "System",
        title: "FEE_PAID", body: `${sName} paid Rs. ${paidAmount.toFixed(2)} (allocated).`,
        category: "FEE", refType: "FEE_RECORD", refId: feeRecordId, link: "/fees/records",
      }).catch(() => {});
      return { payment: null, feeRecord: await feeRepository.findFeeRecordById(feeRecordId), receiptPdf: null, allocated: true };
    }

    // Specific months pay kar rahe hain? (merged voucher se "sirf October" ya
    // "2 of 4 months" wala scenario). Har selected period UNPAID → PAID mark hoga.
    if (Array.isArray(periodMonths) && periodMonths.length) {
      const periods = Array.isArray(record.periods) ? record.periods.map((p) => ({ ...p })) : [];
      if (!periods.length) throw ApiError.badRequestError("Is record mein month breakdown nahi hai — poora payment karo");
      let selectedTotal = 0;
      const wanted = new Set(periodMonths.map((m) => `${m.year}-${m.month}`));
      for (const p of periods) {
        const key = `${p.year}-${p.month}`;
        if (wanted.has(key) && p.status !== "PAID") {
          selectedTotal += Number(p.amount);
          p.status = "PAID";
        }
      }
      if (selectedTotal <= 0) throw ApiError.badRequestError("Selected months already paid ya invalid hain");
      if (Math.abs(selectedTotal - paidAmount) > 0.5) {
        throw ApiError.badRequestError(`Amount Rs. ${paidAmount} selected months (Rs. ${selectedTotal.toFixed(2)}) se match nahi kar raha`);
      }
      const newPaid = Number(record.paidAmount) + paidAmount;
      const allPaid = periods.every((p) => p.status === "PAID");
      const updated = await feeRepository.updateFeeRecord(record.id, {
        paidAmount: Number(newPaid.toFixed(2)),
        status: allPaid ? "PAID" : "PARTIAL",
        periods,
      });
      const payment = await feeRepository.createFeePayment({
        feeRecordId,
        amount: Number(paidAmount.toFixed(2)),
        method,
        reference: reference || null,
      });
      cacheInvalidatePrefix(`fee:records:${record.student.schoolId}:`);
      // Receipt mein selected months dikhao.
      const receiptPeriods = periods
        .filter((p) => wanted.has(`${p.year}-${p.month}`))
        .map((p) => p.label)
        .join(", ");
      const monthLabel = receiptPeriods || new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" });
      const balance = Math.max(0, Number(record.totalAmount) - newPaid);
      const receipt = await pdfService.feeReceipt({
        schoolName: record.student.school.name,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        className: `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim(),
        rows: [
          { label: "Fee Period", value: monthLabel },
          { label: "Due Date", value: new Date(record.dueDate).toLocaleDateString("en-PK") },
          { label: "Status", value: updated.status },
        ],
        lineItems: [{ title: `Payment Received (${receiptPeriods || monthLabel})`, amount: paidAmount }],
        totalPaid: paidAmount,
        paidAt: payment.paidAt,
        refNo: `RC-${payment.id.slice(0, 8)}`,
        qrData: `FEE:${record.id}`,
      });
      const studentName = `${record.student.firstName} ${record.student.lastName}`;
      const className = `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim();
      const paymentDetails = [
        ["Student", studentName],
        ["Class", className || "—"],
        ["Fee Period", monthLabel],
        ["Amount Paid", `Rs. ${paidAmount.toFixed(2)}`],
        ["Total Fee", `Rs. ${Number(record.totalAmount).toFixed(2)}`],
        ["Outstanding Balance", `Rs. ${balance.toFixed(2)}`],
        ["Payment Method", method],
      ];
      if (updated.status === "PAID") {
        await notificationService.notifyParentPortal({
          schoolId: record.student.schoolId,
          title: `Fee Paid — ${monthLabel}`,
          message: `${studentName}${className ? ` (${className})` : ""} ki ${monthLabel} fee poori clear ho gayi hai.`,
          details: paymentDetails,
        }).catch(() => {});
      } else {
        let voucherPdf = null;
        try { voucherPdf = await this._buildVoucherForRecord({ ...record, paidAmount: newPaid, periods }); } catch (e) { console.warn(`[fee] partial voucher build failed: ${e.message}`); }
        await notificationService.notifyParent({
          schoolId: record.student.schoolId,
          parentEmail: record.student.parent?.email,
          parentPhone: record.student.parent?.phone,
          message: `Dear Parent, we have received Rs. ${paidAmount.toFixed(2)} towards ${studentName}'s ${monthLabel} fee. Remaining balance: Rs. ${balance.toFixed(2)}. The updated fee voucher is attached.`,
          title: `Fee Voucher — ${monthLabel} (Balance Rs. ${balance.toFixed(2)})`,
          details: paymentDetails,
          attachments: [{ filename: `fee-voucher-${record.id.slice(0, 8)}.pdf`, content: voucherPdf || receipt, caption: `Fee Voucher — ${monthLabel} (${studentName})` }],
        }).catch(() => {});
      }
      emitToRoom(`school:${record.student.schoolId}`, "fee_payment_recorded", { feeRecordId: record.id, amount: paidAmount, status: updated.status });
      portalNotificationService.create({
        schoolId: record.student.schoolId, senderName: "System",
        title: "FEE_PAID", body: `${studentName}${className ? ` (${className})` : ""} paid Rs. ${paidAmount.toFixed(2)} for ${monthLabel}${balance > 0 ? ` — balance Rs. ${balance.toFixed(2)}` : ""}.`,
        category: "FEE", refType: "FEE_RECORD", refId: record.id, link: "/fees/records",
      }).catch(() => {});
      return { payment, feeRecord: updated, receiptPdf: receipt };
    }

    if (allocateOpenRecords || (Array.isArray(recordIds) && recordIds.length)) {
      const open = allocateOpenRecords
        ? await feeRepository.findOpenRecordsForStudent(record.studentId, record.student.schoolId)
        : await feeRepository.findFeeRecordsByIds(recordIds, record.studentId);
      let remaining = paidAmount;
      let first = null;
      // Batch all payment writes in a single transaction (H2 fix).
      await prisma.$transaction(async (tx) => {
        for (const item of open) {
          if (remaining <= 0) break;
          const balance = Math.max(0, Number(item.totalAmount) + Number(item.dueCharges || 0) - Number(item.paidAmount || 0));
          const applied = Math.min(balance, remaining);
          if (!applied) continue;
          await tx.feePayment.create({ data: { feeRecordId: item.id, amount: Number(applied.toFixed(2)), method, reference: reference || null } });
          const nextPaid = Number(item.paidAmount || 0) + applied;
          await tx.feeRecord.update({ where: { id: item.id }, data: { paidAmount: Number(nextPaid.toFixed(2)), status: nextPaid >= Number(item.totalAmount) + Number(item.dueCharges || 0) ? "PAID" : "PARTIAL" } });
          remaining -= applied;
          if (!first) first = item;
        }
      });
      if (remaining > 0) throw ApiError.badRequestError("Payment exceeds selected fee balance");
      return { payment: null, feeRecord: await feeRepository.findFeeRecordById(first?.id || feeRecordId), receiptPdf: null, allocated: true };
    }

    const payment = await feeRepository.createFeePayment({
      feeRecordId,
      amount: Number(paidAmount.toFixed(2)),
      method,
      reference: reference || null,
    });

    const newPaid = Number(record.paidAmount) + paidAmount;
    const total = Number(record.totalAmount);

    let status = "PAID";
    if (newPaid < total) status = "PARTIAL";
    if (newPaid >= total) status = "PAID";

    // Pura record clear hua → saare months PAID mark karo (voucher itemization).
    const periodsUpdate = Array.isArray(record.periods) && record.periods.length
      ? { periods: record.periods.map((p) => ({ ...p, status: status === "PAID" ? "PAID" : p.status })) }
      : {};
    const updated = await feeRepository.updateFeeRecord(record.id, {
      paidAmount: Number(newPaid.toFixed(2)),
      status,
      ...periodsUpdate,
    });

    cacheInvalidatePrefix(`fee:records:${record.student.schoolId}:`);

    // Receipt PDF (PRD §4) — "kis month ki fee" bhi likha hota hai.
    const receiptMonth = new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" });
    const receipt = await pdfService.feeReceipt({
      schoolName: record.student.school.name,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim(),
      rows: [
        { label: "Fee Period", value: receiptMonth },
        { label: "Due Date", value: new Date(record.dueDate).toLocaleDateString("en-PK") },
        { label: "Status", value: status },
      ],
      lineItems: [{ title: "Payment Received", amount }],
      totalPaid: amount,
      paidAt: payment.paidAt,
      refNo: `RC-${payment.id.slice(0, 8)}`,
      qrData: `FEE:${record.id}`,
    });

    // Channel policy: FULL payment → sirf portal (in-app) notification, NO
    // email. PARTIAL payment → parent ko updated FEE VOUCHER email hota hai
    // (remaining balance ke saath) — "fee paid" wala receipt message NAHI.
    const balance = Math.max(0, total - newPaid);
    const monthLabel = new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" });
    const className = `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim();
    const studentName = `${record.student.firstName} ${record.student.lastName}`;
    const paidAtStr = payment.paidAt
      ? new Date(payment.paidAt).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";
    const paymentDetails = [
      ["Student", studentName],
      ["Class", className || "—"],
      ["Fee Period", monthLabel],
      ["Amount Paid", `Rs. ${paidAmount.toFixed(2)}`],
      ["Total Fee", `Rs. ${total.toFixed(2)}`],
      ["Outstanding Balance", `Rs. ${balance.toFixed(2)}`],
      ["Payment Date", paidAtStr],
      ["Payment Method", method],
    ];

    if (status === "PAID") {
      await notificationService.notifyParentPortal({
        schoolId: record.student.schoolId,
        title: `Fee Paid — ${monthLabel}`,
        message: `${studentName}${className ? ` (${className})` : ""} ki ${monthLabel} fee poori clear ho gayi hai.`,
        details: paymentDetails,
      }).catch(() => {});
    } else {
      // Partial — fresh record snapshot ke saath updated voucher banao.
      let voucherPdf = null;
      try {
        voucherPdf = await this._buildVoucherForRecord({ ...record, paidAmount: newPaid });
      } catch (err) {
        console.warn(`[fee] partial voucher build failed: ${err.message}`);
      }
      await notificationService.notifyParent({
        schoolId: record.student.schoolId,
        parentEmail: record.student.parent?.email,
        parentPhone: record.student.parent?.phone,
        message: `Dear Parent, we have received Rs. ${paidAmount.toFixed(2)} towards ${studentName}'s ${monthLabel} fee. Remaining balance: Rs. ${balance.toFixed(2)}. The updated fee voucher is attached — kindly clear it before the due date.`,
        title: `Fee Voucher — ${monthLabel} (Balance Rs. ${balance.toFixed(2)})`,
        details: paymentDetails,
        attachments: [{
          filename: `fee-voucher-${record.id.slice(0, 8)}.pdf`,
          content: voucherPdf || receipt,
          caption: `Fee Voucher — ${monthLabel} (${studentName}), Balance: Rs. ${balance.toFixed(2)}`,
        }],
      }).catch(() => {});
    }

    emitToRoom(`school:${record.student.schoolId}`, "fee_payment_recorded", {
      feeRecordId: record.id,
      amount: paidAmount,
      status,
    });
    portalNotificationService.create({
      schoolId: record.student.schoolId, senderName: "System",
      title: "FEE_PAID", body: `${studentName} paid Rs. ${paidAmount.toFixed(2)} for ${monthLabel}.`,
      category: "FEE", refType: "FEE_RECORD", refId: record.id, link: "/fees/records",
    }).catch(() => {});

    return { payment, feeRecord: updated, receiptPdf: receipt };
  }

  async getFeeRecord(user, id) {
    const record = await feeRepository.findFeeRecordById(id);
    if (!record) throw ApiError.notFoundError("Fee record not found");
    assertSchoolAccess(user, record.student.schoolId);
    return record;
  }

  /**
   * Voucher QR scan → remaining balance collect (fee PAID mark).
   * Receipt PDF + parent email + realtime event — recordPayment ke zariye
   * sab kuch reuse hota hai.
   */
  async scanCollect(user, feeRecordId) {
    const record = await feeRepository.findFeeRecordById(feeRecordId);
    if (!record) throw ApiError.notFoundError("Fee record not found");
    assertOwnSchool(user, record.student.schoolId);

    const remaining = Number((Number(record.totalAmount) - Number(record.paidAmount)).toFixed(2));
    if (remaining <= 0) {
      return { payment: null, feeRecord: record, alreadyPaid: true };
    }

    const result = await this.recordPayment(user, feeRecordId, {
      amount: remaining,
      method: "ONLINE",
      reference: `QR-Voucher-${record.id.slice(0, 8)}`,
    });
    return { ...result, scanCollected: true };
  }

  /**
   * Ek fee record ka updated voucher PDF (class ke line items + school
   * branding + paid/balance summary). Partial payment email isko attach karta
   * hai taake parent ko hamesha current balance wala voucher mile.
   */
  async _buildVoucherForRecord(record) {
    const student = record.student;
    const schoolId = student.schoolId;
    const [school, yearRow] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          logoUrl: true,
          bankName: true,
          bankAccountTitle: true,
          bankAccountNumber: true,
          organization: { select: { logoUrl: true, themeColor: true, bankName: true, bankAccountTitle: true, bankAccountNumber: true } },
        },
      }),
      feeRepository.findCurrentAcademicYear(schoolId),
    ]);

    const classId = student.section?.classId;
    let structure = null;
    if (classId && yearRow) {
      structure = await feeRepository.findFeeStructureForClass(classId, yearRow.id);
    }

    const total = Number(record.totalAmount);
    const paid = Number(record.paidAmount || 0);
    const dueCharges = Number(record.dueCharges || 0);
    // Merged voucher: student ke SARE open (unpaid/partial) months ek saath
    // itemized — har mahina apni row aur uski sahi outstanding. Isse "ye kis
    // month ki fee hai" clear hota hai aur ghalat PAID status nahi dikhta.
    const open = await feeRepository.findOpenRecordsForStudent(student.id, schoolId);
    const mLabel = (r) => new Date(r.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" });
    let lineItems;
    let monthLabel;
    let status;
    if (open.length) {
      const sorted = open.slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      lineItems = sorted.map((r) => {
        const outstanding = Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0));
        return { title: mLabel(r), amount: outstanding };
      });
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      monthLabel = sorted.length === 1 ? mLabel(first) : `${mLabel(first)} – ${mLabel(last)}`;
      status = sorted.some((r) => r.status === "PARTIAL") ? "PARTIAL" : "UNPAID";
    } else {
      lineItems = (structure?.lineItems || [])
        .filter((li) => !li.isLateFee)
        .map((li) => ({ title: li.title, amount: Number(li.amount) }));
      if (dueCharges > 0) lineItems.push({ title: "Late / Due Charges", amount: dueCharges });
      monthLabel = this._reminderContext(record).monthLabel;
      status = "PAID";
    }
    const grandTotal = Number(lineItems.reduce((s, li) => s + Number(li.amount), 0).toFixed(2));

    return pdfService.feeVoucher({
      schoolName: school?.name,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      className: `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim(),
      rollNumber: student.rollNumber,
      monthLabel,
      lineItems,
      totalAmount: grandTotal,
      paidAmount: 0,
      totalDue: grandTotal,
      dueDate: record.dueDate,
      issuedDate: new Date(),
      refNo: `VC-${record.id.slice(0, 8)}`,
      qrData: `FEE:${record.id}`,
      status,
      themeColor: school?.organization?.themeColor || undefined,
      logoUrl: school?.logoUrl || school?.organization?.logoUrl || undefined,
      // Bank details — branch ka apna account pehle, warna org ka default.
      bank: this._resolveBankInfo(school),
    });
  }

  /** Branch bank override → org default fallback (voucher print ke liye). */
  _resolveBankInfo(school) {
    const bankName = school?.bankName || school?.organization?.bankName || null;
    const accountTitle = school?.bankAccountTitle || school?.organization?.bankAccountTitle || null;
    const accountNumber = school?.bankAccountNumber || school?.organization?.bankAccountNumber || null;
    if (!bankName && !accountNumber) return undefined;
    return { bankName, accountTitle, accountNumber };
  }

  // ── Reminders (shared helpers) ──────────────────────────────

  /** Har reminder ka common context (naam/class/month/due date). */
  _reminderContext(record) {
    const student = record.student;
    return {
      studentName: `${student.firstName} ${student.lastName}`,
      className: `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim(),
      monthLabel: new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" }),
      dueStr: new Date(record.dueDate).toLocaleDateString("en-PK"),
    };
  }

  /** Ek record ka parent-notification dispatch (fire-and-forget). */
  _sendFeeReminder(record, ctx, { title, message, withStatus = false }) {
    return notificationService
      .notifyParent({
        schoolId: record.student.schoolId,
        parentEmail: record.student.parent?.email,
        parentPhone: record.student.parent?.phone,
        message,
        title,
        details: [
          ["Student", ctx.studentName],
          ["Class", ctx.className || "—"],
          ["Fee Period", ctx.monthLabel],
          ["Pending Amount", `Rs. ${record._pending.toFixed(2)}`],
          ["Due Date", ctx.dueStr],
          ...(withStatus ? [["Status", record.status]] : []),
        ],
      })
      .catch(() => {});
  }

  /**
   * Batched fee reminders — ek parent ke SARE bachon ko EK email.
   * Groups records by parent email, combines children's details, and attaches
   * individual voucher PDFs for each child. Parent ko 1 email aata hai with
   * all children's fee summary + vouchers.
   */
  async _sendBatchedFeeReminders(records, { title, withStatus = false }) {
    // Group by parent email
    const byEmail = new Map();
    for (const record of records) {
      const student = record.student;
      if (!student?.parent?.email) continue;
      const email = student.parent.email.trim().toLowerCase();
      if (!byEmail.has(email)) byEmail.set(email, { schoolId: student.schoolId, parentPhone: student.parent.phone, items: [] });
      byEmail.get(email).items.push(record);
    }

    const dispatch = [];
    for (const [email, group] of byEmail) {
      const lines = [];
      const attachments = [];

      for (const record of group.items) {
        const student = record.student;
        const ctx = this._reminderContext(record);
        const pending = Number(record.totalAmount) - Number(record.paidAmount) + Number(record.dueCharges || 0);
        record._pending = pending;

        lines.push(`Student: ${ctx.studentName}`);
        lines.push(`Class: ${ctx.className || "—"}`);
        lines.push(`Fee Period: ${ctx.monthLabel}`);
        lines.push(`Pending Amount: Rs. ${pending.toFixed(2)}`);
        lines.push(`Due Date: ${ctx.dueStr}`);
        if (withStatus) lines.push(`Status: ${record.status}`);
        lines.push("");

        // Generate voucher PDF for this child
        try {
          const pdfBuffer = await this._buildVoucherForRecord(record);
          if (pdfBuffer) {
            const safeName = ctx.studentName.replace(/[^a-zA-Z0-9]/g, "_");
            attachments.push({ filename: `Voucher_${safeName}_${ctx.monthLabel.replace(/\s+/g, "_")}.pdf`, content: pdfBuffer });
          }
        } catch (_) {}
      }

      const combinedMessage = lines.join("\n").trim();
      dispatch.push(
        notificationService.notifyParent({
          schoolId: group.schoolId,
          parentEmail: email,
          parentPhone: group.parentPhone,
          message: combinedMessage,
          title,
          details: [],
          attachments: attachments.length ? attachments : undefined,
        }).catch(() => {})
      );
    }

    if (dispatch.length) await Promise.allSettled(dispatch);
    return dispatch.length;
  }

  /**
   * Overdue sweep (PRD §4): due date guzar chuki records ko OVERDUE mark karo
   * aur har parent ko overdue message sirf EK dafa bhejo (reminderSentAt dedup).
   */
  async runOverdueSweep() {
    const cutoff = new Date();
    const records = await feeRepository.listUnpaidRecords({ dueBefore: cutoff });
    const overdueIds = records.map((r) => r.id);
    if (overdueIds.length) {
      await feeRepository.markOverdue(overdueIds);
    }

    const dueRecords = await feeRepository.listRecordsNeedingOverdueReminder();
    let remindersSent = 0;
    const notifiedIds = [];
    const emailRecords = [];
    for (const record of dueRecords) {
      const student = record.student;
      if (!student || student.status !== "ACTIVE") continue;
      const pending = Number(record.totalAmount) - Number(record.paidAmount);
      if (pending <= 0) continue;

      const ctx = this._reminderContext(record);
      record._pending = pending;
      emailRecords.push(record);
      // Portal notification — branch feed me overdue dikhe.
      portalNotificationService.create({
        schoolId: record.schoolId, senderName: "Fee System",
        title: "FEE_DUE",
        body: `${ctx.studentName}${ctx.className ? ` (${ctx.className})` : ""} has an overdue fee: Rs. ${pending.toFixed(2)} for ${ctx.monthLabel}.`,
        category: "FEE", refType: "FEE_RECORD", refId: record.id, link: "/fees/records",
      }).catch(() => {});
      remindersSent++;
      notifiedIds.push(record.id);
    }
    // Batched: ek parent ko sirf ek email (sare bachon ka combined).
    if (emailRecords.length) {
      await this._sendBatchedFeeReminders(emailRecords, {
        title: "Fee Overdue",
        withStatus: false,
      });
    }
    if (notifiedIds.length) {
      await feeRepository.markReminderSent(notifiedIds);
    }

    return { markedOverdue: overdueIds.length, overdueRemindersSent: remindersSent };
  }

  /**
   * Pre-due reminders (PRD §4 — "due date se 3 din pehle automatic reminder").
   * Daily job har subah un records ko message bhejta hai jinki due date 0-3 din
   * baqi hai — har record par SIRF EK Dafa (preDueReminderSentAt dedup).
   */
  async sendPreDueReminders() {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59, 999);

    const records = await feeRepository.listRecordsNeedingPreDueReminder(dayStart, dayEnd);
    let sent = 0;
    const notifiedIds = [];
    const emailRecords = [];
    for (const record of records) {
      const student = record.student;
      if (!student || student.status !== "ACTIVE") continue;
      const pending = Number(record.totalAmount) - Number(record.paidAmount);
      if (pending <= 0) continue;

      const ctx = this._reminderContext(record);
      record._pending = pending;
      emailRecords.push(record);
      sent++;
      notifiedIds.push(record.id);
    }
    // Batched: ek parent ko sirf ek email.
    if (emailRecords.length) {
      await this._sendBatchedFeeReminders(emailRecords, {
        title: "Fee Due Soon",
        withStatus: false,
      });
    }
    if (notifiedIds.length) {
      await feeRepository.markPreDueReminderSent(notifiedIds);
    }
    return { preDueRemindersSent: sent };
  }

  /**
   * Send reminders for unpaid/overdue records (PRD §4 — due se pehle + overdue).
   *
   * `user` (branch staff) ke saath → SIRF uski branch ke records + optional
   * month/year filter. Bina user ke (scheduler) → platform-wide sweep.
   */
  async sendReminders(user = null, { schoolId, month, year, onlyOverdue = false } = {}) {
    let targetSchoolId = null;
    let dueDateFrom = null;
    let dueDateTo = null;
    if (user) {
      targetSchoolId = getEffectiveSchoolId(user, schoolId);
      assertOwnSchool(user, targetSchoolId);
    }
    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      if (m >= 1 && m <= 12 && y >= 2000) {
        dueDateFrom = new Date(Date.UTC(y, m - 1, 1));
        dueDateTo = new Date(Date.UTC(y, m, 0));
      }
    }

    const records = await feeRepository.listUnpaidRecords({ schoolId: targetSchoolId, dueDateFrom, dueDateTo });
    // Batch: fetch all PAID records for affected students (single query, no N+1).
    const studentIds = [...new Set(records.map((r) => r.student?.id).filter(Boolean))];
    const paidRecords = studentIds.length ? await prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds }, status: "PAID" },
      select: { studentId: true, dueDate: true, periods: true },
    }) : [];
    const paidByKey = new Map();
    for (const pr of paidRecords) {
      const d = new Date(pr.dueDate);
      const yr = d.getUTCFullYear(); const mo = d.getUTCMonth() + 1;
      paidByKey.set(`${pr.studentId}:${yr}:${mo}`, true);
      const ps = Array.isArray(pr.periods) ? pr.periods : [];
      for (const p of ps) {
        if (p.status === "PAID") paidByKey.set(`${pr.studentId}:${p.year}:${p.month}`, true);
      }
    }
    let sent = 0;
    const emailRecords = [];
    for (const record of records) {
      if (onlyOverdue && record.status !== "OVERDUE") continue;
      const student = record.student;
      if (!student || student.status !== "ACTIVE") continue;

      const recDate = new Date(record.dueDate);
      const rYear = recDate.getUTCFullYear();
      const rMonth = recDate.getUTCMonth() + 1;
      const periods = Array.isArray(record.periods) ? record.periods : [];
      const own = periods.find((p) => p.year === rYear && p.month === rMonth);
      if (own && own.status === "PAID") continue;
      if (paidByKey.has(`${student.id}:${rYear}:${rMonth}`)) continue;

      const pending = Number(record.totalAmount) - Number(record.paidAmount) + Number(record.dueCharges || 0);
      record._pending = pending;
      emailRecords.push(record);
      sent++;
    }
    // Batched: ek parent ko sirf ek email (sare bachon ka combined).
    if (emailRecords.length) {
      await this._sendBatchedFeeReminders(emailRecords, {
        title: "Fee Due Reminder",
        withStatus: true,
      });
    }
    return { remindersSent: sent };
  }

  /**
   * Manual per-record reminder — "agar kisi ko voucher/reminder nahi gaya,
   * admin us student ka record khol kar manually bhej de".
   */
  async remindRecord(user, id) {
    const record = await feeRepository.findFeeRecordById(id);
    if (!record) throw ApiError.notFoundError("Fee record not found");
    assertOwnSchool(user, record.student.schoolId);

    const pending = Number(record.totalAmount) - Number(record.paidAmount) + Number(record.dueCharges || 0);
    const ctx = this._reminderContext(record);
    record._pending = pending;
    await this._sendFeeReminder(record, ctx, {
      title: `Fee Due Reminder — ${ctx.monthLabel} (Manual)`,
      withStatus: true,
      message: `Dear Parent, this is a reminder for ${ctx.studentName}'s ${ctx.monthLabel} fee. Pending amount: Rs. ${pending.toFixed(2)}. Please clear it before the due date.`,
    });

    return { sent: true, recordId: id, status: record.status };
  }

  // ── Due Charges (Late Fee from Line Items) ──────────────────

  /**
   * Overdue sweep ke baad — jin records par dueCharges abhi 0 hai, unke
   * class ke fee structure se late fee line items dekho aur charges calculate karo.
   * Grace days ka khayal rakho (lateFeeDays).
   */
  async calculateDueCharges(schoolId) {
    if (!schoolId) {
      // Scheduler mode — saare active schools ke liye
      const schools = await feeRepository.listSchoolsWithFeeSetup();
      let totalUpdated = 0;
      for (const s of schools) {
        const count = await this._calculateDueChargesForSchool(s.id);
        totalUpdated += count;
      }
      return { updated: totalUpdated };
    }
    // Single school mode
    const count = await this._calculateDueChargesForSchool(schoolId);
    return { updated: count };
  }

  async _calculateDueChargesForSchool(targetSchoolId) {
    const records = await feeRepository.findOverdueRecordsWithStudent();
    if (!records.length) return 0;

    const now = new Date();
    const updates = [];

    // Hoist per-record query out of the loop (H4) + cache structures per class.
    const yearRow = await feeRepository.findCurrentYearForSchool(targetSchoolId);
    if (!yearRow) return 0;
    const structureCache = new Map();

    for (const record of records) {
      const student = record.student;
      if (!student || student.schoolId !== targetSchoolId) continue;

      const daysOverdue = Math.max(0, Math.floor((now - new Date(record.dueDate)) / (1000 * 60 * 60 * 24)));
      if (daysOverdue <= 0) continue;

      const classId = student.section?.classId;
      if (!structureCache.has(classId)) {
        structureCache.set(
          classId,
          await feeRepository.findStructureForStudent(classId, yearRow.id)
        );
      }
      const structure = structureCache.get(classId);
      if (!structure) continue;

      // Sum all late fee line items (grace days ke baad)
      const lateFeeItems = structure.lineItems.filter((li) => li.isLateFee);
      if (!lateFeeItems.length) continue;

      let totalLateCharge = 0;
      for (const item of lateFeeItems) {
        const graceDays = item.lateFeeDays || 0;
        if (daysOverdue > graceDays) {
          totalLateCharge += Number(item.amount);
        }
      }

      totalLateCharge = Number(totalLateCharge.toFixed(2));
      if (totalLateCharge > 0 && Number(record.dueCharges || 0) === 0) {
        updates.push({ id: record.id, dueCharges: totalLateCharge });
      }
    }

    if (updates.length) {
      await feeRepository.bulkUpdateDueCharges(updates);
    }
    return updates.length;
  }

  // ──────────────────────────────────────────
  // BULK VOUCHERS (print-optimized)
  // ──────────────────────────────────────────

  /**
   * Class ke saare students ke fee vouchers ek PDF mein.
   * Returns PDF buffer — caller sends as attachment.
   */
  async generateBulkVouchers(user, { classId, month, year, status, studentIds }) {
    const schoolId = user.schoolId;
    assertOwnSchool(user, schoolId);

    // 1. Fetch bulk fee records for the class (filtered by studentIds if provided)
    const records = await feeRepository.findBulkFeeRecordsForClass({
      classId, schoolId, month, year, status, studentIds,
    });

    if (!records.length) {
      throw ApiError.badRequestError("No fee records found for the selected class/month");
    }

    // 2. Get school info for PDF header
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logoUrl: true,
        organization: { select: { logoUrl: true, themeColor: true } },
      },
    });

    // 3. Get fee structure line items (from first student's class)
    const firstRecord = records[0];
    const classIdOfStudent = firstRecord.student.section?.classId;
    const yearRow = await feeRepository.findCurrentAcademicYear(schoolId);
    let structure = null;
    if (classIdOfStudent && yearRow) {
      structure = await feeRepository.findFeeStructureForClass(classIdOfStudent, yearRow.id);
    }
    const lineItems = (structure?.lineItems || []).map((li) => ({
      title: li.title,
      amount: Number(li.amount),
    }));

    // 4. Build voucher data for each student
    const vouchers = records.map((rec) => {
      const st = rec.student;
      const className = `${st.section?.class?.name || ""} ${st.section?.name || ""}`.trim();
      const totalDue = Number(rec.totalAmount) - Number(rec.paidAmount);
      return {
        studentName: `${st.firstName} ${st.lastName}`.trim(),
        className,
        rollNumber: st.rollNumber,
        totalDue,
        dueDate: rec.dueDate,
        refNo: `VC-${rec.id.slice(0, 8)}`,
        qrData: `FEE:${rec.id}`,
        lineItems,
      };
    });

    // 5. Generate PDF via pdfService
    const pdfService = (await import("../../services/pdf.service.js")).default;
    return pdfService.bulkFeeVouchers({
      vouchers,
      schoolName: school.name,
      themeColor: school.organization?.themeColor || undefined,
      logoUrl: school.logoUrl || school.organization?.logoUrl || undefined,
    });
  }
}

export default new FeeService();
