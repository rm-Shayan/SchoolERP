import promotionRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import {
  getEffectiveSchoolId,
  assertOwnSchool,
  assertSchoolAccess,
} from "../../lib/scope.js";
import { generateIdentifierCode } from "../../lib/identifier.js";
import storageService from "../../services/storage.service.js";
import { emitToRoom } from "../../config/websocket.js";
import { buildCsv } from "../../lib/utils/csv.js";
import prisma from "../../config/db.js";
import { assertSectionHasSeat, assertSectionHasSeats } from "../../lib/capacity.js";

const LIFECYCLE_STATUS = {
  GRADUATED: "GRADUATED",
  DROPPED_OUT: "DROPPED_OUT",
};

class PromotionService {
  // ── Scope helpers ─────────────────────────────────────────────
  async _assertSection(user, sectionId) {
    const section = await promotionRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);
    return section;
  }

  async _assertAcademicYear(user, academicYearId) {
    const year = await promotionRepository.academicYearExists(academicYearId);
    if (!year) throw ApiError.notFoundError("Academic year not found");
    assertOwnSchool(user, year.schoolId);
    return year;
  }

  async _assertStudent(user, studentId) {
    const student = await promotionRepository.studentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertOwnSchool(user, student.schoolId);
    return student;
  }

  /**
   * Apply a single promotion action.
   * PRD §9: ID reissue on promotion — every move issues a fresh identifierCode
   * (new QR) and the old one is invalidated.
   */
  async _applyAction(
    {
      student,
      academicYearId,
      fromSectionId,
      toSectionId,
      action,
      remarks,
      newRollNumber,
    },
    client = prisma
  ) {
    const updateData = { identifierCode: generateIdentifierCode() };
    if (toSectionId) updateData.sectionId = toSectionId;
    if (newRollNumber) updateData.rollNumber = newRollNumber;

    await promotionRepository.updateStudent(student.id, updateData, client);

    return promotionRepository.createPromotionRecord(
      {
        studentId: student.id,
        academicYearId,
        fromSectionId: fromSectionId || student.sectionId,
        toSectionId: toSectionId || null,
        action,
        remarks: remarks || null,
      },
      client
    );
  }

  /**
   * PRD §9 — Bulk year-end promotion: move students from one section to the next
   * class/section. Supports individual overrides via `studentIds` (repeat stays
   * behind) and per-student roll-number reassignment.
   */
  async bulkPromote(user, { academicYearId, fromSectionId, toSectionId, studentIds, rollNumbers, remarks }) {
    const fromSection = await this._assertSection(user, fromSectionId);
    const toSection = await this._assertSection(user, toSectionId);
    const year = await this._assertAcademicYear(user, academicYearId);

    let students = await promotionRepository.activeStudentsBySection(fromSectionId);
    if (studentIds?.length) {
      const requested = new Set(studentIds);
      students = students.filter((s) => requested.has(s.id));
    }

    if (!students.length) {
      throw ApiError.badRequestError("No active students to promote in the source section");
    }

    const rollMap = (rollNumbers || []).reduce((acc, r) => {
      if (r?.studentId && r.rollNumber) acc[r.studentId] = String(r.rollNumber);
      return acc;
    }, {});

    // Capacity check + sab moves ek hi transaction me (row-lock — race-safe).
    // Same-section promote ho to incoming count 0 (students already counted).
    const incomingCount = fromSectionId === toSection.id ? 0 : students.length;
    const records = await prisma.$transaction(async (tx) => {
      await assertSectionHasSeats(tx, toSection.id, incomingCount);
      const out = [];
      for (const student of students) {
        out.push(
          await this._applyAction(
            {
              student,
              academicYearId: year.id,
              fromSectionId,
              toSectionId: toSection.id,
              action: "PROMOTED",
              remarks,
              newRollNumber: rollMap[student.id],
            },
            tx
          )
        );
      }
      return out;
    });

    emitToRoom(`school:${fromSection.class.schoolId}`, "promotions_created", {
      action: "PROMOTED",
      count: records.length,
    });

    return { promoted: records.length, records };
  }

  /**
   * PRD §9 — Individual override: a student repeats the same class/year
   * (stays in the same or a sibling section).
   */
  async repeatStudent(user, { academicYearId, studentId, toSectionId, remarks }) {
    const year = await this._assertAcademicYear(user, academicYearId);
    const student = await this._assertStudent(user, studentId);

    let targetSection = null;
    if (toSectionId) targetSection = await this._assertSection(user, toSectionId);

    // Same-section repeat = student already counted, so exclude them from the count.
    const record = await prisma.$transaction(async (tx) => {
      await assertSectionHasSeat(tx, targetSection ? targetSection.id : student.sectionId, {
        excludeStudentId: student.id,
      });
      return this._applyAction(
        {
          student,
          academicYearId: year.id,
          fromSectionId: student.sectionId,
          toSectionId: targetSection ? targetSection.id : student.sectionId,
          action: "REPEATED",
          remarks,
        },
        tx
      );
    });

    emitToRoom(`school:${student.schoolId}`, "promotions_created", {
      action: "REPEATED",
      studentId: student.id,
    });

    return record;
  }

  /**
   * PRD §9 — Mid-year section transfer (class reshuffling, capacity rebalancing).
   */
  async transferSection(user, { academicYearId, studentId, toSectionId, remarks }) {
    const year = await this._assertAcademicYear(user, academicYearId);
    const student = await this._assertStudent(user, studentId);
    const toSection = await this._assertSection(user, toSectionId);

    if (toSection.id === student.sectionId) {
      throw ApiError.badRequestError("Target section is the student's current section");
    }

    const record = await prisma.$transaction(async (tx) => {
      await assertSectionHasSeat(tx, toSection.id, { excludeStudentId: student.id });
      return this._applyAction(
        {
          student,
          academicYearId: year.id,
          fromSectionId: student.sectionId,
          toSectionId: toSection.id,
          action: "TRANSFERRED_SECTION",
          remarks,
        },
        tx
      );
    });

    emitToRoom(`school:${student.schoolId}`, "promotions_created", {
      action: "TRANSFERRED_SECTION",
      studentId: student.id,
    });

    return record;
  }

  /**
   * PRD §9 — End-of-year graduation. Student is archived (status GRADUATED),
   * photo moved to cold storage, never hard-deleted.
   */
  async graduate(user, { academicYearId, studentId, remarks }) {
    return this._setLifecycleStatus(user, academicYearId, studentId, "GRADUATED", remarks);
  }

  /**
   * PRD §9 — Bulk graduation: graduate all (or selected) ACTIVE students
   * from a section. Used for last-class pass-out.
   */
  async bulkGraduate(user, { academicYearId, sectionId, studentIds, remarks }) {
    const year = await this._assertAcademicYear(user, academicYearId);

    let students = await promotionRepository.activeStudentsBySection(sectionId);
    if (studentIds?.length) {
      const requested = new Set(studentIds);
      students = students.filter((s) => requested.has(s.id));
    }

    if (!students.length) {
      throw ApiError.badRequestError("No active students to graduate in this section");
    }

    const results = [];
    for (const student of students) {
      try {
        const record = await this._setLifecycleStatus(user, year.id, student.id, "GRADUATED", remarks);
        results.push({ studentId: student.id, success: true, recordId: record.id });
      } catch (err) {
        results.push({ studentId: student.id, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    emitToRoom(`school:${students[0]?.schoolId}`, "promotions_created", {
      action: "GRADUATED",
      count: successCount,
    });

    return { graduated: successCount, total: students.length, results };
  }

  /**
   * PRD §9 — Dropout / withdrawal (mid-year or year-end). Archived, never deleted.
   */
  async dropout(user, { academicYearId, studentId, remarks }) {
    return this._setLifecycleStatus(user, academicYearId, studentId, "DROPPED_OUT", remarks);
  }

  /**
   * PRD §9 — Bulk dropout: drop all (or selected) ACTIVE students from a section.
   */
  async bulkDropout(user, { academicYearId, sectionId, studentIds, remarks }) {
    const year = await this._assertAcademicYear(user, academicYearId);

    let students = await promotionRepository.activeStudentsBySection(sectionId);
    if (studentIds?.length) {
      const requested = new Set(studentIds);
      students = students.filter((s) => requested.has(s.id));
    }

    if (!students.length) {
      throw ApiError.badRequestError("No active students to mark as dropped out in this section");
    }

    const results = [];
    for (const student of students) {
      try {
        const record = await this._setLifecycleStatus(user, year.id, student.id, "DROPPED_OUT", remarks);
        results.push({ studentId: student.id, success: true, recordId: record.id });
      } catch (err) {
        results.push({ studentId: student.id, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    emitToRoom(`school:${students[0]?.schoolId}`, "promotions_created", {
      action: "DROPPED_OUT",
      count: successCount,
    });

    return { droppedOut: successCount, total: students.length, results };
  }

  async _setLifecycleStatus(user, academicYearId, studentId, status, remarks) {
    const year = await this._assertAcademicYear(user, academicYearId);
    const student = await this._assertStudent(user, studentId);

    if (student.status !== "ACTIVE") {
      throw ApiError.badRequestError(`Student is already ${student.status}`);
    }

    let imageUrl = student.imageUrl;
    if (student.imageUrl) {
      const moved = await storageService
        .moveToArchive({ url: student.imageUrl })
        .catch(() => null);
      if (moved?.url) imageUrl = moved.url;
    }

    await promotionRepository.updateStudent(student.id, { status, imageUrl });

    const record = await promotionRepository.createPromotionRecord({
      studentId: student.id,
      academicYearId: year.id,
      fromSectionId: student.sectionId,
      toSectionId: null,
      action: LIFECYCLE_STATUS[status],
      remarks: remarks || null,
    });

    emitToRoom(`school:${student.schoolId}`, "student_status_changed", {
      studentId: student.id,
      status,
    });

    // Portal notification: status change ke baare me
    const statusText = status === "GRADUATED" ? "graduated" : "dropped out";
    portalNotificationService.create({
      schoolId: student.schoolId, senderId: user.id, senderName: user.name,
      title: status === "GRADUATED" ? "STUDENT_GRADUATED" : "STUDENT_WITHDRAWN",
      body: `${student.firstName} ${student.lastName} ${statusText} — ${year.name}.${remarks ? ` Remarks: ${remarks}` : ""}`,
      category: "ADMISSION",
      refType: "STUDENT_LIFECYCLE",
      refId: record.id,
      link: "/students",
    }).catch(() => {});

    // Parent ko bhi portal notification jaye
    if (student.parent) {
      portalNotificationService.create({
        schoolId: student.schoolId, senderName: "System",
        title: status === "GRADUATED" ? "STUDENT_GRADUATED" : "STUDENT_WITHDRAWN",
        body: `${student.firstName} ${student.lastName} ${status === "GRADUATED" ? "apne class me graduate hua hai" : "school se withdraw ho gaya hai"} — ${year.name}.${remarks ? ` Remarks: ${remarks}` : ""}`,
        category: "ADMISSION",
        refType: "STUDENT_LIFECYCLE",
        refId: record.id,
        link: "/student",
      }).catch(() => {});
    }

    return record;
  }

  /**
   * List promotion / lifecycle records. Branch staff see only their own school;
   * SUPER_ADMIN may filter by `schoolId`.
   */
  async list(user, { schoolId, studentId, sectionId, academicYearId, action, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    return promotionRepository.listPromotions({
      schoolId: targetSchoolId,
      studentId,
      sectionId,
      academicYearId,
      action,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  async getRecord(user, id) {
    const record = await promotionRepository.findPromotionById(id);
    if (!record) throw ApiError.notFoundError("Promotion record not found");
    assertSchoolAccess(user, record.student.schoolId);
    return record;
  }

  /**
   * CSV export — current filters ke mutabiq saare promotion/lifecycle records.
   * Year-end reporting: "is saal ke dropouts", "pichle saal kis class ne pass
   * out kiya" — waghera Excel/CSV mein (students export ki tarah).
   */
  async exportPromotions(user, query) {
    const targetSchoolId = getEffectiveSchoolId(user, query.schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const { items } = await promotionRepository.listPromotions({
      schoolId: targetSchoolId,
      studentId: query.studentId,
      sectionId: query.sectionId,
      academicYearId: query.academicYearId,
      action: query.action,
      page: 1,
      pageSize: 10000,
    });

    const dateStr = (d) => (d ? new Date(d).toLocaleDateString("en-PK") : "");

    return buildCsv(
      ["Student", "Roll Number", "Action", "From Class", "From Section", "To Class", "To Section", "Academic Year", "Date", "Remarks"],
      items.map((r) => [
        `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`.trim(),
        r.student?.rollNumber,
        r.action,
        r.fromSection?.class?.name,
        r.fromSection?.name,
        r.toSection?.class?.name,
        r.toSection?.name,
        r.academicYear?.name,
        dateStr(r.createdAt),
        r.remarks,
      ])
    );
  }
}

export default new PromotionService();
