import studentService from "./student.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import { sendCsv } from "../../lib/utils/csv.js";

class StudentController {
  /**
   * POST /api/v1/students/schools/:schoolId
   * Create a new student (parent is upserted by WhatsApp number).
   */
  createStudent = asyncHandler(async (req, res) => {
    const student = await studentService.createStudent(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Student created successfully", student));
  });

  /**
   * GET /api/v1/students
   * List students in scope with optional filters.
   */
  listStudents = asyncHandler(async (req, res) => {
    const result = await studentService.listStudents(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Students fetched successfully", result));
  });

  /**
   * GET /api/v1/students/stats
   * Lightweight dashboard stats — counts only.
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await studentService.getDashboardStats(req.user, req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Dashboard stats fetched", stats));
  });

  /**
   * GET /api/v1/students/:id
   * Get a single student with full detail.
   */
  getStudent = asyncHandler(async (req, res) => {
    const student = await studentService.getStudent(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Student fetched successfully", student));
  });

  /**
   * PATCH /api/v1/students/:id
   * Update student and/or parent details.
   */
  updateStudent = asyncHandler(async (req, res) => {
    const student = await studentService.updateStudent(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Student updated successfully", student));
  });

  /**
   * DELETE /api/v1/students/:id
   * Hard delete — permanently removes the student (overrides archive-only rule).
   */
  deleteStudent = asyncHandler(async (req, res) => {
    const result = await studentService.deleteStudent(req.user, req.params.id, req);
    return res.status(200).json(ApiResponse.ok("Student deleted successfully", result));
  });

  /**
   * POST /api/v1/students/:id/photo
   * Upload / replace the student photo (multer single "file").
   */
  uploadPhoto = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please attach an image file");
    const student = await studentService.uploadPhoto(req.user, req.params.id, req.file.buffer);
    return res.status(200).json(ApiResponse.ok("Student photo uploaded successfully", student));
  });

  /**
   * PATCH /api/v1/students/:id/status
   * Graduate / dropout / transfer-out / reactivate. Archives the photo on exit.
   */
  changeStatus = asyncHandler(async (req, res) => {
    const student = await studentService.changeStatus(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Student status updated successfully", student));
  });

  /**
   * POST /api/v1/students/:id/rollback
   * Rollback GRADUATED / DROPPED_OUT / TRANSFERRED_OUT → ACTIVE.
   * Admin-only operation for correcting accidental status changes.
   */
  rollback = asyncHandler(async (req, res) => {
    const student = await studentService.rollbackLifecycle(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Student reactivated successfully", student));
  });

  /**
   * GET /api/v1/students/platform
   * Platform-wide student directory (SUPER_ADMIN only).
   */
  listAllStudentsPlatform = asyncHandler(async (req, res) => {
    const result = await studentService.listAllStudentsPlatform(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Platform student directory fetched successfully", result));
  });

  /**
   * POST /api/v1/students/:id/reissue-id
   * Generate a new identifier code (invalidates the old QR) + printable ID slip.
   */
  reissueId = asyncHandler(async (req, res) => {
    const result = await studentService.reissueId(req.user, req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="id-slip-${req.params.id}.pdf"`);
    return res.send(result.idSlipPdf);
  });

  /**
   * POST /api/v1/students/schools/:schoolId/import
   * Bulk student import via Excel (PRD §3) — queues async job with progress.
   */
  importStudents = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)");
    const result = await studentService.importStudents(req.user, req.params.schoolId, req.file.buffer);
    return res.status(202).json(ApiResponse.ok("Student bulk import job queued", result));
  });

  /**
   * GET /api/v1/students/export
   * CSV export — current filters ke mutabiq saare students.
   */
  exportStudents = asyncHandler(async (req, res) => {
    const { csv } = await studentService.exportStudents(req.user, req.query);
    return sendCsv(res, csv, "students");
  });
}

export default new StudentController();
