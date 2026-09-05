import { Router } from "express";
import admissionController from "./admission.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { imageUpload, fileUpload } from "../../lib/upload.js";
import {
  createInquirySchema,
  updateApplicantSchema,
  updateApplicantDetailsSchema,
  deleteApplicantSchema,
  uploadApplicantPhotoSchema,
  uploadDocumentSchema,
  deleteDocumentSchema,
  importApplicantsSchema,
  approveSchema,
  sendSlipSchema,
  enrollSchema,
  recordAdvanceFeeSchema,
  listApplicantsSchema,
  exportApplicantsSchema,
  getApplicantSchema,
  getFunnelSchema,
  publicClassesSchema,
  publicInquirySchema,
} from "./admission.validation.js";

const router = Router();

// ─── PUBLIC: org admission form (/o/:slug/admission) — koi auth nahi ─────────
router.get("/public/classes", validate(publicClassesSchema), admissionController.publicClasses);
router.post("/public/inquiry", validate(publicInquirySchema), admissionController.publicInquiry);

router.use(authenticate);

// ==========================================
// ADMISSION PIPELINE (PRD §2)
// ==========================================

/**
 * POST /api/v1/admissions/schools/:schoolId/import
 * Bulk admission inquiries via Excel — queued, async progress via WebSocket.
 */
router.post(
  "/schools/:schoolId/import",
  authorize(ROLE_GROUPS.ADMISSIONS),
  assertSameSchool,
  fileUpload.single("file"),
  validate(importApplicantsSchema),
  admissionController.importApplicants
);

/**
 * POST /api/v1/admissions/schools/:schoolId
 * Register a new inquiry.
 */
router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ADMISSIONS),
  assertSameSchool,
  validate(createInquirySchema),
  admissionController.createInquiry
);

/**
 * GET /api/v1/admissions
 * List applicants (filter by status/class/search).
 */
router.get(
  "/",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(listApplicantsSchema),
  admissionController.listApplicants
);

/**
 * GET /api/v1/admissions/export
 * CSV export — current filters ke mutabiq saare matching applicants.
 */
router.get(
  "/export",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(exportApplicantsSchema),
  admissionController.exportApplicants
);

/**
 * GET /api/v1/admissions/funnel
 * Admission funnel counts for dashboard.
 */
router.get(
  "/funnel",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(getFunnelSchema),
  admissionController.getFunnel
);

/**
 * PATCH /api/v1/admissions/:id/status
 * Move applicant through stages (test result, form submitted, rejected, etc.).
 */
router.patch(
  "/:id/status",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(updateApplicantSchema),
  admissionController.updateStatus
);

/**
 * PATCH /api/v1/admissions/:id
 * CRUD — edit applicant details.
 */
router.patch(
  "/:id",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(updateApplicantDetailsSchema),
  admissionController.updateApplicant
);

/**
 * DELETE /api/v1/admissions/:id
 * CRUD — delete an applicant (ENROLLED protected).
 */
router.delete(
  "/:id",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(deleteApplicantSchema),
  admissionController.removeApplicant
);

/**
 * POST /api/v1/admissions/:id/photo
 * Upload / replace the applicant's photo (multer single "file").
 */
router.post(
  "/:id/photo",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(uploadApplicantPhotoSchema),
  imageUpload.single("file"),
  admissionController.uploadPhoto
);

/**
 * POST /api/v1/admissions/:id/documents
 * Upload B-form / birth certificate (multer single "file" + type field).
 */
router.post(
  "/:id/documents",
  authorize(ROLE_GROUPS.ADMISSIONS),
  fileUpload.single("file"), // multer pehle — req.body (type) populate hone ke liye
  validate(uploadDocumentSchema),
  admissionController.uploadDocument
);

/**
 * DELETE /api/v1/admissions/:id/documents/:docId
 * Remove a document from the applicant's file.
 */
router.delete(
  "/:id/documents/:docId",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(deleteDocumentSchema),
  admissionController.removeDocument
);

/**
 * POST /api/v1/admissions/:id/approve
 * Approve → advance-fee slip PDF + email.
 */
router.post(
  "/:id/approve",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(approveSchema),
  admissionController.approve
);

/**
 * POST /api/v1/admissions/:id/advance-fee
 * Record advance fee receipt.
 */
router.post(
  "/:id/advance-fee",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(recordAdvanceFeeSchema),
  admissionController.recordAdvanceFee
);

/**
 * POST /api/v1/admissions/:id/enroll
 * Enroll → Student + QR ID card + confirmation email.
 */
router.post(
  "/:id/enroll",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(enrollSchema),
  admissionController.enroll
);

/**
 * GET /api/v1/admissions/:id
 * Single applicant detail.
 */
router.get(
  "/:id",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(getApplicantSchema),
  admissionController.getApplicant
);

/**
 * GET /api/v1/admissions/:id/slip
 * Download admission slip PDF.
 */
router.get(
  "/:id/slip",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(getApplicantSchema),
  admissionController.getSlip
);

/**
 * POST /api/v1/admissions/:id/send-slip
 * Regenerate the admission slip PDF and send it to the parent.
 */
router.post(
  "/:id/send-slip",
  authorize(ROLE_GROUPS.ADMISSIONS),
  validate(sendSlipSchema),
  admissionController.sendSlip
);

export default router;
