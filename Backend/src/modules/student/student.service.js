import xlsx from "xlsx";
import studentRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import { generateIdentifierCode } from "../../lib/identifier.js";
import storageService from "../../services/storage.service.js";
import pdfService from "../../services/pdf.service.js";
import { studentImportQueue } from "../../jobs/queues/studentImport.queue.js";
import prisma from "../../config/db.js";
import { assertSectionHasSeat } from "../../lib/capacity.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import { buildCsv } from "../../lib/utils/csv.js";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "../../lib/utils/cache.js";

class StudentService {
  /**
   * Create a new student. Parent is upserted by WhatsApp number
   * (one parent record can have multiple children — sibling handling).
   */
  async createStudent(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const section = await studentRepository.sectionExists(data.sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    if (section.class.schoolId !== targetSchoolId) {
      throw ApiError.badRequestError("Section does not belong to the given school");
    }

    // Capacity check + insert ek hi transaction me (row-lock — race-safe).
    const student = await prisma.$transaction(async (tx) => {
      await assertSectionHasSeat(tx, data.sectionId);

      // Unique roll number within the school
      const existingRoll = await studentRepository.findRollNumberInSchool(
        targetSchoolId,
        data.rollNumber,
        undefined,
        tx
      );
      if (existingRoll) {
        throw ApiError.badRequestError(`Roll number '${data.rollNumber}' is already in use in this school`);
      }

      const parent = await studentRepository.upsertParent(
        {
          name: data.parentName,
          whatsappNo: data.parentWhatsappNo,
          phone: data.parentPhone || null,
          email: data.parentEmail || null,
          address: data.parentAddress || null,
        },
        tx
      );

      return studentRepository.createStudent(
        {
          schoolId: targetSchoolId,
          sectionId: data.sectionId,
          parentId: parent.id,
          identifierCode: generateIdentifierCode(),
          rollNumber: data.rollNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender || null,
          dob: data.dob ? new Date(data.dob) : null,
          status: "ACTIVE",
        },
        tx
      );
    });

    cacheInvalidatePrefix(`students:list:${targetSchoolId}:`);
    return this._hydrated(student.id);
  }

  async listStudents(user, { schoolId, sectionId, classId, status, search, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    const cacheKey = `students:list:${targetSchoolId}:${sectionId || "_"}:${classId || "_"}:${status || "_"}:${search || "_"}:${p}:${ps}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await studentRepository.listStudents({
      schoolId: targetSchoolId,
      sectionId,
      classId,
      status,
      search,
      page: p,
      pageSize: ps,
    });

    await cacheSet(cacheKey, result, 30);
    return result;
  }

  async getStudent(user, id) {
    const student = await studentRepository.findStudentById(id);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertSchoolAccess(user, student.schoolId);
    return student;
  }

  async updateStudent(user, id, data) {
    const student = await this.getStudent(user, id);
    assertOwnSchool(user, student.schoolId);

    // Parent details update if any provided
    if (data.parentName || data.parentPhone || data.parentEmail || data.parentAddress) {
      await studentRepository.updateParent(student.parentId, {
        name: data.parentName,
        phone: data.parentPhone,
        email: data.parentEmail,
        address: data.parentAddress,
      });
    }

    const studentData = {};
    if (data.firstName) studentData.firstName = data.firstName;
    if (data.lastName) studentData.lastName = data.lastName;
    if (data.gender !== undefined) studentData.gender = data.gender;
    if (data.dob !== undefined) studentData.dob = data.dob ? new Date(data.dob) : null;

    if (data.sectionId && data.sectionId !== student.sectionId) {
      const section = await studentRepository.sectionExists(data.sectionId);
      if (!section) throw ApiError.notFoundError("Section not found");
      if (section.class.schoolId !== student.schoolId) {
        throw ApiError.badRequestError("Section does not belong to this student's school");
      }
      studentData.sectionId = data.sectionId;
    }

    if (data.rollNumber && data.rollNumber !== student.rollNumber) {
      const existingRoll = await studentRepository.findRollNumberInSchool(
        student.schoolId,
        data.rollNumber,
        student.id
      );
      if (existingRoll) {
        throw ApiError.badRequestError(`Roll number '${data.rollNumber}' is already in use in this school`);
      }
      studentData.rollNumber = data.rollNumber;
    }

    // Section change ho rahi hai → target section ki capacity check (row-lock).
    // Exclude current student: wo abhi target section me nahi hai.
    if (studentData.sectionId) {
      await prisma.$transaction(async (tx) => {
        await assertSectionHasSeat(tx, studentData.sectionId);
        await studentRepository.updateStudent(id, studentData, tx);
      });
    } else {
      await studentRepository.updateStudent(id, studentData);
    }
    cacheInvalidatePrefix(`students:list:${student.schoolId}:`);
    return this._hydrated(id);
  }

  /**
   * Upload / replace the student's photo (compressed + resized by storage service).
   */
  async uploadPhoto(user, id, buffer) {
    const student = await this.getStudent(user, id);
    assertOwnSchool(user, student.schoolId);

    const folder = student.status === "ACTIVE" ? "active-students" : "archive";
    const { url, overwritten } = await storageService.uploadImage({
      buffer,
      folder,
      existingUrl: student.imageUrl,
      organizationId: user.organizationId,
      schoolId: student.schoolId,
    });

    // Remove the old image (best-effort, non-fatal) — rule 5: one image per
    // student. Skipped when the upload already overwrote the same asset.
    if (!overwritten && student.imageUrl) {
      await storageService.deleteImage({ url: student.imageUrl, organizationId: user.organizationId, schoolId: student.schoolId }).catch(() => {});
    }

    await studentRepository.updateStudent(id, { imageUrl: url });
    return this._hydrated(id);
  }

  /**
   * Change student lifecycle status (GRADUATED / DROPPED_OUT / TRANSFERRED_OUT / ACTIVE).
   * Non-active students have their photo moved to cold/archive storage and are
   * excluded from active dashboards (PRD §9 — records are archived, never deleted).
   */
  async changeStatus(user, id, { status, remarks }) {
    const student = await this.getStudent(user, id);
    assertOwnSchool(user, student.schoolId);

    if (!["ACTIVE", "GRADUATED", "DROPPED_OUT", "TRANSFERRED_OUT"].includes(status)) {
      throw ApiError.badRequestError("Invalid student status");
    }

    let imageUrl = student.imageUrl;
    if (status !== "ACTIVE" && student.imageUrl && student.status === "ACTIVE") {
      const moved = await storageService.moveToArchive({ url: student.imageUrl, organizationId: user.organizationId, schoolId: student.schoolId });
      imageUrl = moved.url || imageUrl;
    } else if (status === "ACTIVE" && student.imageUrl && student.status !== "ACTIVE") {
      // Re-activation — leave the image where it is (archive path remains valid)
    }

    await studentRepository.updateStudent(id, { status, imageUrl });
    return this._hydrated(id);
  }

  /**
   * Re-issue a student's ID: generates a brand-new identifierCode (QR value),
   * invalidating the old one (PRD §9 — ID reissue after promotion / loss).
   * Returns the new code plus a printable ID slip PDF buffer.
   */
  async reissueId(user, id) {
    const student = await this.getStudent(user, id);
    assertOwnSchool(user, student.schoolId);

    const newIdentifierCode = generateIdentifierCode();
    await studentRepository.updateStudent(id, { identifierCode: newIdentifierCode });

    const updated = await this._hydrated(id);
    const pdfBuffer = await pdfService.studentIdSlip({
      schoolName: updated.school.name,
      studentName: `${updated.firstName} ${updated.lastName}`,
      fatherName: updated.parent?.name || null,
      className: updated.section?.class?.name,
      sectionName: updated.section?.name,
      rollNumber: updated.rollNumber,
      identifierCode: newIdentifierCode,
      refNo: `ID-${updated.id.slice(0, 8)}`,
      photoUrl: updated.imageUrl || null,
      gender: updated.gender || null,
      themeColor: updated.school?.organization?.themeColor || "#2563eb",
      logoUrl: updated.school?.organization?.logoUrl || null,
      // Back-of-card contact info
      schoolAddress: updated.school?.address || null,
      schoolPhone: updated.school?.phone || null,
      campusName: updated.school?.name || null,
    });

    return { student: updated, identifierCode: newIdentifierCode, idSlipPdf: pdfBuffer };
  }

  /**
   * Hard delete — permanently removes the student record (overrides the
   * archive-only rule). Attendance, fees, exam results, conduct remarks and
   * promotion records cascade-delete via the schema. The parent record is
   * removed too when this was the parent's last child. The photo is cleaned
   * up best-effort. Action is recorded in the audit log (survives deletion
   * since entity fields are denormalized strings).
   */
  async deleteStudent(user, id, req) {
    const student = await this.getStudent(user, id);
    assertOwnSchool(user, student.schoolId);

    const { parentId, imageUrl, rollNumber } = student;
    await prisma.$transaction(async (tx) => {
      await studentRepository.deleteStudent(id, tx);
      const remaining = await studentRepository.countStudentsByParent(parentId, tx);
      if (remaining === 0) {
        await studentRepository.deleteParent(parentId, tx);
      }
    });

    if (imageUrl) {
      await storageService.deleteImage({ url: imageUrl, organizationId: user.organizationId, schoolId: student.schoolId }).catch(() => {});
    }

    auditService.record(
      auditService.fromRequest(user, req, {
        action: AUDIT_ACTIONS.DELETE_STUDENT,
        entityType: AUDIT_ENTITY_TYPES.STUDENT,
        entityId: id,
        entityName: `${student.firstName} ${student.lastName}`.trim(),
        organizationId: student.school?.organization?.id,
        schoolId: student.schoolId,
        details: JSON.stringify({ rollNumber }),
      })
    );

    cacheInvalidatePrefix(`students:list:${student.schoolId}:`);
    return { id };
  }

  /**
   * PRD §3 — Bulk student Excel import.
   * Parses the uploaded .xlsx, queues an async job, and returns the jobId so
   * the dashboard can subscribe to `job:{jobId}` WebSocket progress events.
   */
  async importStudents(user, schoolId, fileBuffer) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);
    cacheInvalidatePrefix(`students:list:${targetSchoolId}:`);

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError("Excel sheet is empty");
    }

    const rows = rawRows
      .map((row) => ({
        sectionId: row.SectionId || row.sectionId || row["Section ID"],
        className: row.Class || row.class || row["Class Name"],
        sectionName: row.Section || row.section || row["Section Name"],
        rollNumber: row.RollNumber || row.rollNumber || row["Roll Number"] || row["Roll No"],
        firstName: row.FirstName || row.firstName || row["First Name"],
        lastName: row.LastName || row.lastName || row["Last Name"],
        gender: row.Gender || row.gender,
        dob: row.DOB || row.dob || row["Date of Birth"],
        parentName: row.ParentName || row.parentName || row["Parent Name"],
        parentWhatsappNo: row.ParentWhatsapp || row.parentWhatsapp || row["Parent WhatsApp"] || row["Parent Whatsapp"],
        parentPhone: row.ParentPhone || row.parentPhone || row["Parent Phone"],
        parentEmail: row.ParentEmail || row.parentEmail || row["Parent Email"],
        parentAddress: row.ParentAddress || row.parentAddress || row["Parent Address"],
      }))
      .filter((r) => r.rollNumber || r.firstName);

    if (rows.length === 0) {
      throw ApiError.badRequestError(
        "No valid student rows found. Ensure columns like 'Roll Number', 'First Name', 'Class Name', 'Section Name' exist."
      );
    }

    const job = await studentImportQueue.add("import-students", {
      rows,
      schoolId: targetSchoolId,
    });

    return { jobId: job.id, totalRows: rows.length };
  }

  /**
   * CSV export — current filters ke mutabiq saare students (har branch staff).
   * Branch admin ke liye "proper school system" requirement: data Excel/CSV
   * mein nikalna hamesha available hona chahiye (admissions export ki tarah).
   */
  async exportStudents(user, query) {
    const targetSchoolId = getEffectiveSchoolId(user, query.schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const { items } = await studentRepository.listStudents({
      schoolId: targetSchoolId,
      sectionId: query.sectionId,
      classId: query.classId,
      status: query.status,
      search: query.search,
      page: 1,
      pageSize: 10000,
    });

    const dateStr = (d) => (d ? new Date(d).toLocaleDateString("en-PK") : "");

    return buildCsv(
      ["First Name", "Last Name", "Roll Number", "Class", "Section", "Gender", "DOB", "Status", "Parent Name", "Parent Phone", "Parent WhatsApp", "Parent Email", "Identifier Code", "Blocked"],
      items.map((st) => [
        st.firstName, st.lastName, st.rollNumber,
        st.section?.class?.name, st.section?.name,
        st.gender, dateStr(st.dob), st.status,
        st.parent?.name, st.parent?.phone, st.parent?.whatsappNo, st.parent?.email,
        st.identifierCode, st.isBlocked ? "YES" : "NO",
      ])
    );
  }

  async _hydrated(id) {
    return studentRepository.findStudentById(id);
  }
}

export default new StudentService();
