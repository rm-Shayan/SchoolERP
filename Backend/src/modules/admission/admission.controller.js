import admissionService from "./admission.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import { sendCsv } from "../../lib/utils/csv.js";
import pdfService from "../../services/pdf.service.js";

class AdmissionController {
  /**
   * POST /api/v1/admissions/schools/:schoolId
   * Stage-1: register a new inquiry.
   */
  createInquiry = asyncHandler(async (req, res) => {
    const applicant = await admissionService.createInquiry(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Inquiry registered successfully", applicant));
  });

  /**
   * GET /api/v1/admissions/public/classes?schoolId=... — PUBLIC
   * Public admission form ke liye branch ki classes.
   */
  publicClasses = asyncHandler(async (req, res) => {
    const classes = await admissionService.listClassesBySchool(req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Classes fetched successfully", classes));
  });

  /**
   * POST /api/v1/admissions/public/inquiry — PUBLIC
   * /o/:slug/admission form se inquiry submit (koi auth nahi).
   */
  publicInquiry = asyncHandler(async (req, res) => {
    const applicant = await admissionService.createPublicInquiry(req.body);
    return res.status(201).json(ApiResponse.created("Inquiry registered successfully", applicant));
  });

  /**
   * PATCH /api/v1/admissions/:id/status
   * Move applicant through the pipeline (test result, form submitted, etc.).
   */
  updateStatus = asyncHandler(async (req, res) => {
    const applicant = await admissionService.updateStatus(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Admission status updated", applicant));
  });

  /**
   * PATCH /api/v1/admissions/:id
   * CRUD — edit applicant details (student/parent info, class, advance fee).
   */
  updateApplicant = asyncHandler(async (req, res) => {
    const applicant = await admissionService.updateApplicant(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Applicant updated successfully", applicant));
  });

  /**
   * DELETE /api/v1/admissions/:id
   * CRUD — delete an applicant (ENROLLED applicants protected).
   */
  removeApplicant = asyncHandler(async (req, res) => {
    const result = await admissionService.removeApplicant(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Applicant deleted successfully", result));
  });

  /**
   * POST /api/v1/admissions/:id/photo
   * Upload / replace the applicant's photo (multer single "file").
   */
  uploadPhoto = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please upload an image file");
    const applicant = await admissionService.uploadPhoto(req.user, req.params.id, req.file.buffer);
    return res.status(200).json(ApiResponse.ok("Applicant photo uploaded successfully", applicant));
  });

  /**
   * POST /api/v1/admissions/:id/documents
   * Upload a document (B-form / birth certificate) — multer single "file" + type field.
   */
  uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please upload a document file");
    const doc = await admissionService.uploadDocument(req.user, req.params.id, {
      buffer: req.file.buffer,
      type: req.body.type,
      filename: req.file.originalname,
    });
    return res.status(201).json(ApiResponse.created("Document uploaded successfully", doc));
  });

  /**
   * DELETE /api/v1/admissions/:id/documents/:docId
   * Remove a document from the applicant's file.
   */
  removeDocument = asyncHandler(async (req, res) => {
    const result = await admissionService.removeDocument(req.user, req.params.id, req.params.docId);
    return res.status(200).json(ApiResponse.ok("Document deleted successfully", result));
  });

  /**
   * POST /api/v1/admissions/schools/:schoolId/import
   * Bulk admission inquiries via Excel — queued, async progress via WebSocket.
   */
  importApplicants = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)");
    const result = await admissionService.importApplicants(req.user, req.params.schoolId, req.file.buffer);
    return res.status(200).json(ApiResponse.ok("Admission import started", result));
  });

  /**
   * POST /api/v1/admissions/:id/approve
   * Approve → generates PDF advance-fee slip (emailed to parent) + status APPROVED.
   * Slip download: GET /api/v1/admissions/:id/slip.
   */
  approve = asyncHandler(async (req, res) => {
    const result = await admissionService.approve(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Admission approved — slip emailed to parent", result.applicant));
  });

  /**
   * POST /api/v1/admissions/:id/enroll
   * Enroll → creates Student + Parent + QR ID card + confirmation email.
   */
  enroll = asyncHandler(async (req, res) => {
    const result = await admissionService.enroll(req.user, req.params.id, req.body);
    return res.status(201).json(ApiResponse.created("Student enrolled successfully", {
      applicant: result.applicant,
      student: result.student,
      identifierCode: result.identifierCode,
    }));
  });

  /**
   * POST /api/v1/admissions/:id/advance-fee
   * Record advance fee receipt.
   */
  recordAdvanceFee = asyncHandler(async (req, res) => {
    const applicant = await admissionService.recordAdvanceFee(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Advance fee recorded", applicant));
  });

  /**
   * GET /api/v1/admissions
   * List applicants with funnel filters.
   */
  listApplicants = asyncHandler(async (req, res) => {
    const result = await admissionService.listApplicants(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Applicants fetched successfully", result));
  });

  /**
   * GET /api/v1/admissions/export
   * CSV export — current filters ke mutabiq saare matching applicants.
   */
  exportApplicants = asyncHandler(async (req, res) => {
    const { csv } = await admissionService.exportApplicants(req.user, req.query);
    return sendCsv(res, csv, "admissions");
  });

  /**
   * GET /api/v1/admissions/funnel
   * Admission funnel counts (PRD §8 dashboard).
   */
  getFunnel = asyncHandler(async (req, res) => {
    const funnel = await admissionService.getFunnel(req.user, req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Admission funnel fetched", funnel));
  });

  /**
   * GET /api/v1/admissions/:id
   * Get single applicant.
   */
  getApplicant = asyncHandler(async (req, res) => {
    const applicant = await admissionService.getApplicant(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Applicant fetched successfully", applicant));
  });

  /**
   * GET /api/v1/admissions/:id/slip
   * Download the admission / advance-fee slip PDF.
   */
  getSlip = asyncHandler(async (req, res) => {
    const applicant = await admissionService.getApplicant(req.user, req.params.id);
    if (!applicant.school) throw ApiError.notFoundError("Applicant school not found");

    const slip = await pdfService.admissionSlip({
      schoolName: applicant.school.name,
      applicant: { ...applicant, className: applicant.class?.name },
      refNo: `ADM-${applicant.id.slice(0, 8)}`,
      amount: applicant.advanceFeeAmount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      themeColor: applicant.school?.organization?.themeColor || "#2563eb",
      logoUrl: applicant.school?.organization?.logoUrl || null,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="admission-slip-${applicant.id}.pdf"`);
    return res.send(slip);
  });
}

export default new AdmissionController();
