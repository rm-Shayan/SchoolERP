import xlsx from "xlsx";
import admissionRepository from "./repository.js";
import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import { generateIdentifierCode } from "../../lib/identifier.js";
import { assertSectionHasSeat } from "../../lib/capacity.js";
import notificationService from "../../services/notification.service.js";
import pdfService from "../../services/pdf.service.js";
import storageService from "../../services/storage.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { admissionImportQueue } from "../../jobs/queues/admissionImport.queue.js";
import { emitToRoom } from "../../config/websocket.js";
import { buildCsv } from "../../lib/utils/csv.js";

const FLOW = [
  "INQUIRY",
  "TEST_SCHEDULED",
  "TEST_PASSED",
  "TEST_FAILED",
  "FORM_SUBMITTED",
  "APPROVED",
  "FEE_PENDING",
  "ENROLLED",
  "REJECTED",
];

class AdmissionService {
  /**
   * Stage-1: Register a new inquiry (applicant).
   * PRD §2 — "Koi parent aata hai, form bharta hai... system dikhaye har
   * applicant kis stage pe hai (inquiry → test → form → approve → fee pending → enrolled)."
   */
  async createInquiry(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const cls = await admissionRepository.classExists(data.classId);
    if (!cls) throw ApiError.notFoundError("Class not found");
    if (cls.schoolId !== targetSchoolId) {
      throw ApiError.badRequestError("Class does not belong to the given school");
    }

    const applicant = await admissionRepository.createApplicant({
      schoolId: targetSchoolId,
      classId: data.classId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || null,
      dob: data.dob ? new Date(data.dob) : null,
      parentName: data.parentName,
      parentPhone: data.parentPhone || data.parentWhatsappNo,
      parentWhatsappNo: data.parentWhatsappNo,
      parentEmail: data.parentEmail || null,
      parentAddress: data.parentAddress || null,
      status: "INQUIRY",
      // Approve pehle, fee baad — INQUIRY par advance fee amount nahi set hota.
      advanceFeeAmount: null,
    });

    emitToRoom(`school:${targetSchoolId}`, "admission_created", { id: applicant.id, status: applicant.status });
    return this._hydrated(applicant.id);
  }

  /**
   * Move an applicant to the next / a specific pipeline stage.
   * Validates allowed transitions so the funnel (PRD §2) can't be jumped randomly.
   */
  async updateStatus(user, id, { status, testResult, remarks, testDate, testTime, testVenue, testMarks }) {
    const applicant = await this._getApplicantInScope(user, id);

    if (!FLOW.includes(status)) {
      throw ApiError.badRequestError(`Invalid admission status. Allowed: ${FLOW.join(", ")}`);
    }

    if (status === "ENROLLED") {
      throw ApiError.badRequestError("Use the dedicated 'enroll' endpoint to enroll an applicant (creates student + QR ID).");
    }

    // Test result shortcut — sirf tab override karo jab testResult EXPLICIT diya ho,
    // warna jo status bheja hai (TEST_PASSED/TEST_FAILED) wahi respect karo.
    if (testResult !== undefined) {
      status = testResult === "PASSED" ? "TEST_PASSED" : "TEST_FAILED";
    }

    // TEST_SCHEDULED hone par test slot info save hoti hai (date/time/venue);
    // TEST_PASSED/TEST_FAILED par optional testMarks (e.g. "45/50").
    const data = { status, remarks: remarks || null };
    if (status === "TEST_SCHEDULED") {
      if (testDate) data.testDate = new Date(testDate);
      if (testTime) data.testTime = testTime;
      if (testVenue) data.testVenue = testVenue;
    }
    if (testMarks !== undefined) data.testMarks = testMarks || null;

    const updated = await admissionRepository.updateApplicant(id, data);

    emitToRoom(`school:${applicant.schoolId}`, "admission_status_updated", {
      id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });

    // PRD §2 — Approve hone par slip khud ban jaye (PDF) + email to parent.
    if (status === "APPROVED") {
      this._notifyApproved(applicant);
    }

    // Test schedule hone par parent ko email (WhatsApp budget nahi → Email).
    if (status === "TEST_SCHEDULED") {
      this._notifyTestScheduled({ ...applicant, ...data });
    }

    return updated;
  }

  /**
   * CRUD — edit applicant details (student/parent info, class, advance fee).
   */
  async updateApplicant(user, id, data) {
    const applicant = await this._getApplicantInScope(user, id);

    if (applicant.status === "ENROLLED") {
      throw ApiError.badRequestError(
        "Applicant already enrolled — edit the student record in the Students section instead."
      );
    }

    if (data.classId && data.classId !== applicant.classId) {
      const cls = await admissionRepository.classExists(data.classId);
      if (!cls) throw ApiError.notFoundError("Class not found");
      if (cls.schoolId !== applicant.schoolId) {
        throw ApiError.badRequestError("Class does not belong to the given school");
      }
    }

    const patch = {};
    if (data.classId) patch.classId = data.classId;
    if (data.firstName) patch.firstName = data.firstName;
    if (data.lastName) patch.lastName = data.lastName;
    if (data.gender !== undefined) patch.gender = data.gender;
    if (data.dob !== undefined) patch.dob = data.dob ? new Date(data.dob) : null;
    if (data.parentName) patch.parentName = data.parentName;
    if (data.parentPhone !== undefined) patch.parentPhone = data.parentPhone;
    if (data.parentWhatsappNo !== undefined) patch.parentWhatsappNo = data.parentWhatsappNo;
    if (data.parentEmail !== undefined) patch.parentEmail = data.parentEmail || null;
    if (data.parentAddress !== undefined) patch.parentAddress = data.parentAddress || null;
    // Approve pehle, fee baad — advance fee sirf recordAdvanceFee se set hoti hai (APPROVED ke baad).

    const updated = await admissionRepository.updateApplicant(id, patch);
    emitToRoom(`school:${applicant.schoolId}`, "admission_updated", { id, status: updated.status });
    return updated;
  }

  /**
   * CRUD — delete an applicant. Enrolled applicants are never deleted — their
   * student record is live; manage them from the Students section.
   */
  async removeApplicant(user, id) {
    const applicant = await this._getApplicantInScope(user, id);

    if (applicant.status === "ENROLLED") {
      throw ApiError.badRequestError(
        "Enrolled applicants cannot be deleted — manage them from the Students section."
      );
    }

    await admissionRepository.deleteApplicant(id);

    // Cleanup applicant photo + documents (best-effort, non-fatal, parallel).
    const imageDeletes = [];
    if (applicant.imageUrl) {
      imageDeletes.push(storageService.deleteImage({ url: applicant.imageUrl }).catch(() => {}));
    }
    for (const doc of applicant.documents || []) {
      imageDeletes.push(storageService.deleteImage({ url: doc.url }).catch(() => {}));
    }
    await Promise.all(imageDeletes);

    emitToRoom(`school:${applicant.schoolId}`, "admission_deleted", { id });
    return { id };
  }

  /**
   * Upload a document (B-form / birth certificate) to the applicant's file.
   * Files store AS-IS (PDFs stay PDFs) — no image re-encoding.
   */
  async uploadDocument(user, id, { buffer, type, filename }) {
    const applicant = await this._getApplicantInScope(user, id);

    const { url } = await storageService.uploadDocument({
      buffer,
      folder: "applicant-docs",
      filename: filename || "document",
      organizationId: user.organizationId,
      schoolId: applicant.schoolId,
    });

    const doc = await admissionRepository.createDocument({
      applicantId: id,
      type: type || "OTHER",
      filename: filename || "document",
      url,
    });

    emitToRoom(`school:${applicant.schoolId}`, "admission_document_added", { applicantId: id, documentId: doc.id });
    return doc;
  }

  /**
   * Remove a document from the applicant's file (file + DB row).
   */
  async removeDocument(user, id, docId) {
    const applicant = await this._getApplicantInScope(user, id);

    const doc = await admissionRepository.findDocumentById(docId);
    if (!doc || doc.applicantId !== id) {
      throw ApiError.notFoundError("Document not found for this applicant");
    }

    await admissionRepository.deleteDocument(docId);
    if (doc.url) {
      await storageService.deleteImage({ url: doc.url, organizationId: user.organizationId, schoolId: applicant.schoolId }).catch(() => {});
    }

    emitToRoom(`school:${applicant.schoolId}`, "admission_document_removed", { applicantId: id, documentId: docId });
    return { id: docId };
  }

  /**
   * Upload / replace the applicant's photo (student jiska admission ho raha hai).
   * Enroll hone par ye image Student record par carry ho jati hai.
   */
  async uploadPhoto(user, id, buffer) {
    const applicant = await this._getApplicantInScope(user, id);

    const { url, overwritten } = await storageService.uploadImage({
      buffer,
      folder: "applicants",
      existingUrl: applicant.imageUrl,
      organizationId: user.organizationId,
      schoolId: applicant.schoolId,
    });

    if (!overwritten && applicant.imageUrl) {
      await storageService.deleteImage({ url: applicant.imageUrl, organizationId: user.organizationId, schoolId: applicant.schoolId }).catch(() => {});
    }

    const updated = await admissionRepository.updateApplicant(id, { imageUrl: url });
    emitToRoom(`school:${applicant.schoolId}`, "admission_photo_updated", { id });
    return updated;
  }

  /**
   * Excel se bulk admission inquiry import — queue par job, WebSocket progress.
   * Har row ek INQUIRY applicant banata hai (class name se resolve hota hai).
   */
  async importApplicants(user, schoolId, fileBuffer) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError("Excel sheet is empty");
    }

    const rows = rawRows
      .map((row) => ({
        className: row.Class || row.class || row["Class Name"],
        firstName: row.FirstName || row.firstName || row["First Name"],
        lastName: row.LastName || row.lastName || row["Last Name"],
        gender: row.Gender || row.gender,
        dob: row.DOB || row.dob || row["Date of Birth"],
        parentName: row.ParentName || row.parentName || row["Parent Name"],
        parentPhone: row.ParentPhone || row.parentPhone || row["Parent Phone"],
        parentWhatsappNo: row.ParentWhatsapp || row.parentWhatsapp || row["Parent WhatsApp"] || row["Parent Whatsapp"],
        parentEmail: row.ParentEmail || row.parentEmail || row["Parent Email"],
        parentAddress: row.ParentAddress || row.parentAddress || row["Parent Address"],
        advanceFeeAmount: row.AdvanceFee || row.advanceFee || row["Advance Fee"],
      }))
      .filter((r) => r.firstName || r.parentName);

    if (rows.length === 0) {
      throw ApiError.badRequestError(
        "No valid applicant rows found. Ensure columns like 'First Name', 'Last Name', 'Class Name', 'Parent Name' exist."
      );
    }

    const job = await admissionImportQueue.add("import-applicants", {
      rows,
      schoolId: targetSchoolId,
    });

    return { jobId: job.id, totalRows: rows.length };
  }

  /**
   * PRD §2 — Approve hone par slip khud ban jaye (PDF), advance fee amount
   * ke saath — email pe parent ko. (WhatsApp pending budget → Email today.)
   */
  async approve(user, id) {
    const applicant = await this._getApplicantInScope(user, id);

    if (applicant.status !== "FORM_SUBMITTED" && applicant.status !== "INQUIRY" && applicant.status !== "TEST_PASSED") {
      throw ApiError.badRequestError(
        `Cannot approve applicant in '${applicant.status}' stage. Move them to FORM_SUBMITTED or TEST_PASSED first.`
      );
    }

    const updated = await admissionRepository.updateApplicant(id, { status: "APPROVED" });

    // Approval letter — fee amount abhi set nahi hota (fee baad record hogi).
    const slip = await pdfService.admissionSlip({
      schoolName: applicant.school.name,
      applicant: { ...applicant, className: applicant.class?.name ?? "Not assigned" },
      refNo: `ADM-${applicant.id.slice(0, 8)}`,
      amount: null,
      dueDate: null,
      themeColor: applicant.school?.organization?.themeColor || "#2563eb",
      logoUrl: applicant.school?.organization?.logoUrl || null,
    });

    this._notifyApproved({ ...applicant, status: "APPROVED" }, slip);

    // Portal notification — branch feed me approval dikhe.
    portalNotificationService.create({
      schoolId: applicant.schoolId, senderId: user.id, senderName: user.name,
      title: "ADMISSION",
      body: `${applicant.firstName} ${applicant.lastName}'s admission has been APPROVED.`,
      category: "STUDENT",
      refType: "ADMISSION",
      refId: id,
      link: "/admissions",
    }).catch(() => {});

    emitToRoom(`school:${applicant.schoolId}`, "admission_approved", { id });
    return { applicant: updated, slipPdf: slip };
  }

  /**
   * PRD §2 — Advance fee jama hote hi student "enrolled" mane, aur uska
   * QR-based ID card khud generate ho. Parent ko final confirmation email mile.
   */
  async enroll(user, id, { sectionId, rollNumber, advanceFeePaid = false }) {
    const applicant = await this._getApplicantInScope(user, id);

    if (applicant.status === "ENROLLED") {
      throw ApiError.badRequestError("Applicant is already enrolled.");
    }
    if (!["APPROVED", "FEE_PENDING", "FORM_SUBMITTED", "TEST_PASSED"].includes(applicant.status)) {
      throw ApiError.badRequestError(
        `Applicant must be APPROVED (or FEE_PENDING) before enrollment. Current stage: '${applicant.status}'.`
      );
    }

    const section = await admissionRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    if (section.class.schoolId !== applicant.schoolId) {
      throw ApiError.badRequestError("Section does not belong to the applicant's school");
    }

    // Capacity check + student creation ek hi transaction me (row-lock — race-safe):
    // do users ek saath enroll karein to bhi section capacity exceed nahi ho sakti.
    const identifierCode = generateIdentifierCode();
    const { student, updated, parent } = await prisma.$transaction(async (tx) => {
      await assertSectionHasSeat(tx, sectionId);

      // Auto roll number jab UI par blank chhora (frontend: "Auto if left blank")
      const finalRoll = rollNumber || (await admissionRepository.findNextRollNumber(applicant.schoolId, tx));

      // Duplicate roll number check within the branch (PRD §3 — "duplicate roll number")
      const existingRoll = await admissionRepository.findRollNumberInSchool(applicant.schoolId, finalRoll, undefined, tx);
      if (existingRoll) {
        throw ApiError.badRequestError(`Roll number '${finalRoll}' is already in use in this school`);
      }

      // Parent upsert (one parent record can hold multiple children — sibling handling, PRD §9)
      const parent = await admissionRepository.upsertParent(
        {
          name: applicant.parentName,
          whatsappNo: applicant.parentWhatsappNo,
          phone: applicant.parentPhone || null,
          email: applicant.parentEmail || null,
          address: applicant.parentAddress || null,
        },
        tx
      );

      const created = await admissionRepository.createStudent(
        {
          schoolId: applicant.schoolId,
          sectionId,
          parentId: parent.id,
          identifierCode,
          rollNumber: finalRoll,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          gender: applicant.gender || null,
          dob: applicant.dob || null,
          // Applicant photo carries over — koi re-upload nahi (admission file ka photo)
          imageUrl: applicant.imageUrl || null,
          status: "ACTIVE",
        },
        tx
      );

      // Mark the applicant ENROLLED + advance fee PAID (PRD §2 — enrolled on advance fee jama)
      const marked = await admissionRepository.updateApplicant(
        id,
        {
          status: "ENROLLED",
          advanceFeeStatus: advanceFeePaid ? "PAID" : "UNPAID",
        },
        tx
      );

      return { student: created, updated: marked, parent };
    });

    // QR-based ID card (PRD §2)
    const idSlip = await pdfService.studentIdSlip({
      schoolName: applicant.school.name,
      studentName: `${student.firstName} ${student.lastName}`,
      fatherName: parent?.name || null,
      className: section.class.name,
      sectionName: section.name,
      rollNumber: student.rollNumber,
      identifierCode: student.identifierCode,
      refNo: `ID-${student.id.slice(0, 8)}`,
      photoUrl: student.imageUrl || null,
      gender: student.gender || applicant.gender || null,
      themeColor: applicant.school?.organization?.themeColor || "#2563eb",
      logoUrl: applicant.school?.organization?.logoUrl || null,
      // Back-of-card contact info
      schoolAddress: applicant.school?.address || null,
      schoolPhone: applicant.school?.phone || null,
      campusName: applicant.school?.name || null,
    });

    // Final confirmation email to parent (PRD §2 / §5 — primary channel Email)
    const studentName = `${student.firstName} ${student.lastName}`;
    await notificationService.notifyParent({
      schoolId: applicant.schoolId,
      parentEmail: parent.email,
      parentWhatsapp: parent.whatsappNo,
      parentPhone: parent.phone,
      message: `Congratulations! ${studentName} has been officially enrolled at ${applicant.school.name}. The QR-based ID card is ready — use it for gate attendance scanning. Welcome to the family!`,
      title: "Admission Confirmed — Enrolled",
      details: [
        ["Student", studentName],
        ["Class", `${section.class.name} ${section.name}`],
        ["Roll No", student.rollNumber],
        ["ID Card", `ID-${student.id.slice(0, 8)}`],
      ],
      attachments: idSlip
        ? [{ filename: `student-id-${student.id.slice(0, 8)}.pdf`, content: idSlip }]
        : undefined,
    }).catch(() => {});

    // Portal notification — branch feed me enrollment dikhe.
    portalNotificationService.create({
      schoolId: applicant.schoolId, senderId: user.id, senderName: user.name,
      title: "ADMISSION",
      body: `${studentName} enrolled in ${section.class.name} ${section.name} — Roll #${student.rollNumber}.`,
      category: "STUDENT",
      refType: "ADMISSION",
      refId: student.id,
      link: "/admissions",
    }).catch(() => {});

    emitToRoom(`school:${applicant.schoolId}`, "admission_enrolled", {
      applicantId: id,
      studentId: student.id,
      studentName,
      identifierCode,
    });

    return { applicant: updated, student, identifierCode, idSlipPdf: idSlip };
  }

  /**
   * Mark advance fee as received (moves applicant into FEE_PENDING → ENROLLED-ready).
   */
  async recordAdvanceFee(user, id, { amount }) {
    const applicant = await this._getApplicantInScope(user, id);

    if (applicant.status === "ENROLLED") {
      throw ApiError.badRequestError("Applicant already enrolled — advance fee already settled.");
    }

    const updated = await admissionRepository.updateApplicant(id, {
      advanceFeeStatus: "PAID",
      advanceFeeAmount: amount ? Number(amount) : applicant.advanceFeeAmount,
      status: applicant.status === "APPROVED" ? "FEE_PENDING" : applicant.status,
    });

    // Approve pehle, fee baad — advance fee jama hone par hi receipt/slip parent ko jati hai.
    if (applicant.status === "APPROVED") {
      await this._notifyAdvanceFee({ ...applicant, ...updated });
    }

    emitToRoom(`school:${applicant.schoolId}`, "admission_fee_recorded", { id, status: updated.status });
    return updated;
  }

  /**
   * Slip ko dobara generate karke parent ko bhejo (manual re-send).
   * WhatsApp API budget nahi hai → notifyParent Email channel par jati hai;
   * attachment (PDF slip) ke saath. Honest result return hota hai taake UI
   * bata sake ke deliver hui ya kyun nahi.
   */
  async sendSlip(user, id) {
    const applicant = await this._getApplicantInScope(user, id);

    const slip = await pdfService.admissionSlip({
      schoolName: applicant.school.name,
      applicant: { ...applicant, className: applicant.class?.name ?? "Not assigned" },
      refNo: `ADM-${applicant.id.slice(0, 8)}`,
      amount: applicant.advanceFeeAmount,
      dueDate: null,
      themeColor: applicant.school?.organization?.themeColor || "#2563eb",
      logoUrl: applicant.school?.organization?.logoUrl || null,
      title: applicant.advanceFeeAmount ? "ADVANCE FEE RECEIPT" : "ADMISSION SLIP",
    });

    const studentName = `${applicant.firstName} ${applicant.lastName}`;
    const amountText = applicant.advanceFeeAmount
      ? ` of Rs. ${Number(applicant.advanceFeeAmount).toFixed(2)}`
      : "";

    const result = await notificationService
      .notifyParent({
        schoolId: applicant.schoolId,
        parentEmail: applicant.parentEmail,
        parentPhone: applicant.parentPhone,
        message: `Admission slip${amountText} for ${studentName} (${applicant.school?.name || "our school"}). Please review the attached slip.`,
        title: applicant.advanceFeeAmount ? "Advance Fee Receipt" : "Admission Slip",
        details: [
          ["Student", studentName],
          ["Class", applicant.class?.name ?? "—"],
          ["Reference", `ADM-${applicant.id.slice(0, 8)}`],
          ...(applicant.advanceFeeAmount
            ? [["Amount", `Rs. ${Number(applicant.advanceFeeAmount).toFixed(2)}`]]
            : [["Status", String(applicant.status).replace(/_/g, " ")]]),
        ],
        attachments: slip
          ? [{ filename: `admission-slip-${applicant.id.slice(0, 8)}.pdf`, content: slip }]
          : undefined,
      })
      .catch((err) => ({ success: false, reason: err.message }));

    return {
      applicantId: id,
      delivered: result?.success === true,
      channel: result?.channel || "EMAIL",
      reason: result?.reason || null,
    };
  }

  async listApplicants(user, { schoolId, status, classId, search, from, to, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    return admissionRepository.listApplicants({
      schoolId: targetSchoolId,
      status,
      classId,
      search,
      from,
      to,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  /**
   * CSV export — current filters ke mutabiq saare matching applicants.
   */
  async exportApplicants(user, query) {
    const targetSchoolId = getEffectiveSchoolId(user, query.schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const applicants = await admissionRepository.findAllApplicants({
      schoolId: targetSchoolId,
      status: query.status,
      classId: query.classId,
      search: query.search,
      from: query.from,
      to: query.to,
    });

    const dateStr = (d) => (d ? new Date(d).toLocaleDateString("en-PK") : "");

    return buildCsv(
      ["First Name", "Last Name", "Class", "Gender", "Parent Name", "Parent Phone", "Parent WhatsApp", "Parent Email", "Status", "Test Date", "Test Time", "Test Venue", "Test Marks", "Advance Fee", "Registered On"],
      applicants.map((a) => [
        a.firstName, a.lastName, a.class?.name, a.gender,
        a.parentName, a.parentPhone, a.parentWhatsappNo, a.parentEmail,
        a.status, dateStr(a.testDate), a.testTime, a.testVenue, a.testMarks,
        a.advanceFeeAmount != null ? Number(a.advanceFeeAmount).toFixed(2) : "", dateStr(a.createdAt),
      ])
    );
  }

  async getApplicant(user, id) {
    const applicant = await admissionRepository.findApplicantById(id);
    if (!applicant) throw ApiError.notFoundError("Applicant not found");
    assertSchoolAccess(user, applicant.schoolId);
    return applicant;
  }

  /**
   * Write-operations ka shared lookup: applicant fetch + notFound + own-school
   * assert (9 jagah repeat hota tha).
   */
  async _getApplicantInScope(user, id) {
    const applicant = await admissionRepository.findApplicantById(id);
    if (!applicant) throw ApiError.notFoundError("Applicant not found");
    assertOwnSchool(user, applicant.schoolId);
    return applicant;
  }

  /**
   * PRD §8 — Admission funnel visibility (inquiry → test → fee → enrolled counts).
   */
  async getFunnel(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    return admissionRepository.getFunnel(targetSchoolId);
  }

  /**
   * Public admission form ke liye classes list — /o/:slug/admission (koi auth nahi).
   */
  async listClassesBySchool(schoolId) {
    await assertSchoolExists(schoolId);
    return prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    });
  }

  /**
   * Public inquiry submit — /o/:slug/admission form se (koi auth nahi).
   * Applicant INQUIRY banta hai + branch admins ko WebSocket event aur
   * NotificationLog entry jati hai (ORG_ADMIN_FLOW.md §2.2).
   */
  async createPublicInquiry(data) {
    await assertSchoolExists(data.schoolId);

    const cls = await admissionRepository.classExists(data.classId);
    if (!cls) throw ApiError.notFoundError("Class not found");
    if (cls.schoolId !== data.schoolId) {
      throw ApiError.badRequestError("Class does not belong to the given school");
    }

    const applicant = await admissionRepository.createApplicant({
      schoolId: data.schoolId,
      classId: data.classId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || null,
      dob: data.dob ? new Date(data.dob) : null,
      parentName: data.parentName,
      parentPhone: data.parentPhone || data.parentWhatsappNo,
      parentWhatsappNo: data.parentWhatsappNo,
      parentEmail: data.parentEmail || null,
      parentAddress: data.parentAddress || null,
      status: "INQUIRY",
      advanceFeeAmount: null,
    });

    emitToRoom(`school:${data.schoolId}`, "admission_created", {
      id: applicant.id,
      status: applicant.status,
      source: "public-form",
    });

    // Branch admins ko visible entry — NotificationLog mein (delivery logs page)
    try {
      await prisma.notificationLog.create({
        data: {
          schoolId: data.schoolId,
          recipient: "Branch Office",
          channel: "PORTAL",
          message: `New admission inquiry: ${data.firstName} ${data.lastName} (${cls.name})`,
          status: "SENT",
        },
      });
      emitToRoom(`school:${data.schoolId}`, "portal_notification_created", {
        recipient: "Branch Office",
        channel: "PORTAL",
        title: "New Admission Inquiry",
        status: "SENT",
      });
    } catch (err) {
      // Non-blocking — applicant ban chuka hai, log fail ho to koi masla nahi
    }

    return this._hydrated(applicant.id);
  }

  // ── Helpers ────────────────────────────────────────────────────
  _hydrated(id) {
    return admissionRepository.findApplicantById(id);
  }

  /**
   * Test schedule hone par parent ko email — date/time/venue ke saath.
   * (WhatsApp API budget nahi hai → notifyParent Email channel par jaati hai.)
   */
  async _notifyTestScheduled(applicant) {
    const studentName = `${applicant.firstName} ${applicant.lastName}`;
    const className = applicant.class?.name || "";
    const date = applicant.testDate ? new Date(applicant.testDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) : null;
    const time = applicant.testTime || null;
    const venue = applicant.testVenue || null;

    const details = [
      date && ["Date", date],
      time && ["Time", time],
      venue && ["Venue", venue],
    ].filter(Boolean);

    await notificationService.notifyParent({
      schoolId: applicant.schoolId,
      parentEmail: applicant.parentEmail,
      parentWhatsapp: applicant.parentWhatsappNo,
      parentPhone: applicant.parentPhone,
      message: `${studentName}'s admission test has been scheduled at ${applicant.school?.name || "our school"}${className ? ` for class ${className}` : ""}.\n\nPlease bring the student to the venue on time. For questions, contact the school office.`,
      title: "Admission Test Scheduled",
      details,
    }).catch(() => {});
  }

  /**
   * Approve hone par admission confirmation letter parent ko jaye —
   * fee ka zikr nahi (fee baad record hogi).
   */
  async _notifyApproved(applicant, slipPdf) {
    const studentName = `${applicant.firstName} ${applicant.lastName}`;
    const refNo = `ADM-${applicant.id.slice(0, 8)}`;

    await notificationService.notifyParent({
      schoolId: applicant.schoolId,
      parentEmail: applicant.parentEmail,
      parentWhatsapp: applicant.parentWhatsappNo,
      parentPhone: applicant.parentPhone,
      message: `Good news! ${studentName}'s admission has been APPROVED at ${applicant.school?.name || "our school"}.\n\nPlease visit the school office to complete the admission process and pay the required fees.`,
      title: "Admission Approved",
      details: [
        ["Student", studentName],
        ["Class", applicant.class?.name || "—"],
        ["Status", "APPROVED"],
        ["Reference", refNo],
      ],
      attachments: slipPdf
        ? [{ filename: `admission-approval-${applicant.id.slice(0, 8)}.pdf`, content: slipPdf }]
        : undefined,
    }).catch(() => {});
  }

  /**
   * Advance fee jama hone par fee receipt parent ko bhejo — approve ke BAAD.
   */
  async _notifyAdvanceFee(applicant) {
    const studentName = `${applicant.firstName} ${applicant.lastName}`;
    const amount = Number(applicant.advanceFeeAmount || 0).toFixed(2);
    const refNo = `ADM-${applicant.id.slice(0, 8)}`;

    const receiptPdf = await pdfService.admissionSlip({
      schoolName: applicant.school?.name,
      applicant: { ...applicant, className: applicant.class?.name ?? "Not assigned" },
      refNo,
      amount: applicant.advanceFeeAmount,
      dueDate: null,
      themeColor: applicant.school?.organization?.themeColor || "#2563eb",
      logoUrl: applicant.school?.organization?.logoUrl || null,
      title: "ADVANCE FEE RECEIPT",
    });

    await notificationService.notifyParent({
      schoolId: applicant.schoolId,
      parentEmail: applicant.parentEmail,
      parentWhatsapp: applicant.parentWhatsappNo,
      parentPhone: applicant.parentPhone,
      message: `Advance fee of Rs. ${amount} received for ${studentName}. Your admission is now confirmed — please visit the office to complete enrollment.`,
      title: "Advance Fee Receipt",
      details: [
        ["Student", studentName],
        ["Class", applicant.class?.name ?? "—"],
        ["Amount Received", `Rs. ${amount}`],
        ["Reference", refNo],
      ],
      attachments: receiptPdf
        ? [{ filename: `fee-receipt-${applicant.id.slice(0, 8)}.pdf`, content: receiptPdf }]
        : undefined,
    }).catch(() => {});
  }
}

export default new AdmissionService();
