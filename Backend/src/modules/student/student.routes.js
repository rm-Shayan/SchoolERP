import { Router } from "express";
import studentController from "./student.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  createStudentSchema,
  listStudentsSchema,
  getStudentSchema,
  updateStudentSchema,
  changeStatusSchema,
  reissueIdSchema,
} from "./student.validation.js";
import multer from "multer";

const MAX_IMAGE_UPLOAD_SIZE_MB = Number.parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE_MB || "5", 10);
const MAX_IMAGE_UPLOAD_BYTES = Number.isFinite(MAX_IMAGE_UPLOAD_SIZE_MB)
  ? MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
  : 1 * 1024 * 1024;
// Excel imports are NOT images — keep their own (larger) cap so the strict
// 1MB image limit doesn't reject big bulk-import files.
const MAX_FILE_UPLOAD_SIZE_MB = Number.parseInt(process.env.MAX_FILE_UPLOAD_SIZE_MB || "10", 10);
const MAX_FILE_UPLOAD_BYTES = Number.isFinite(MAX_FILE_UPLOAD_SIZE_MB)
  ? MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024
  : 10 * 1024 * 1024;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
});
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_UPLOAD_BYTES },
});

const router = Router();
router.use(authenticate);

// ==========================================
// STUDENTS (PRD §3, §9)
// ==========================================

/**
 * GET /api/v1/students/platform
 * Platform-wide student directory (SUPER_ADMIN only).
 */
router.get(
  "/platform",
  authorize(["SUPER_ADMIN"]),
  studentController.listAllStudentsPlatform
);

/**
 * POST /api/v1/students/schools/:schoolId/import
 * Bulk student import via Excel — queued, async progress via WebSocket.
 */
router.post(
  "/schools/:schoolId/import",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  fileUpload.single("file"),
  studentController.importStudents
);

/**
 * POST /api/v1/students/schools/:schoolId
 * Create a new student (parent upserted by WhatsApp number).
 * Receptionist (front desk) ko limited CRUD diya jata hai — enrollment entry.
 */
router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.MANAGEMENT.concat("RECEPTIONIST")),
  assertSameSchool,
  validate(createStudentSchema),
  studentController.createStudent
);

/**
 * GET /api/v1/students
 * List students with filters.
 */
router.get(
  "/",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listStudentsSchema),
  studentController.listStudents
);

/**
 * GET /api/v1/students/export
 * CSV export — current filters ke mutabiq (har branch staff).
 * Must be declared before /:id to avoid route conflict.
 */
router.get(
  "/export",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listStudentsSchema),
  studentController.exportStudents
);

/**
 * GET /api/v1/students/:id
 * Single student detail.
 */
router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getStudentSchema),
  studentController.getStudent
);

/**
 * PATCH /api/v1/students/:id
 * Update student and/or parent details. (limited CRUD — receptionist).
 */
router.patch(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT.concat("RECEPTIONIST")),
  validate(updateStudentSchema),
  studentController.updateStudent
);

/**
 * DELETE /api/v1/students/:id
 * Hard delete — permanently removes the student record and all history.
 * SUPER_ADMIN ONLY: proper school system mein branch admin archive karta hai
 * (lifecycle: graduate/dropout/transfer), permanently delete nahi — fee,
 * attendance aur exam history kabhi wipe nahi honi chahiye kisi branch se.
 */
router.delete(
  "/:id",
  authorize(["SUPER_ADMIN"]),
  validate(getStudentSchema),
  studentController.deleteStudent
);

/**
 * POST /api/v1/students/:id/photo
 * Upload student photo (multer single "file").
 */
router.post(
  "/:id/photo",
  authorize(ROLE_GROUPS.MANAGEMENT.concat("RECEPTIONIST")),
  imageUpload.single("file"),
  studentController.uploadPhoto
);

/**
 * PATCH /api/v1/students/:id/status
 * Graduate / dropout / transfer / reactivate (PRD §9 — archive, never delete).
 * Receptionist ko status change diya jata hai (front-desk archive op).
 */
router.patch(
  "/:id/status",
  authorize(ROLE_GROUPS.MANAGEMENT.concat("RECEPTIONIST")),
  validate(changeStatusSchema),
  studentController.changeStatus
);

/**
 * POST /api/v1/students/:id/reissue-id
 * Re-issue QR / RFID identifier + ID slip (PRD §9).
 */
router.post(
  "/:id/reissue-id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(reissueIdSchema),
  studentController.reissueId
);

export default router;

