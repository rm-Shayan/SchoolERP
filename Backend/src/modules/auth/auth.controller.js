import authService from "./auth.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import { sendCsv } from "../../lib/utils/csv.js";

class AuthController {
  // ==========================================
  // STAFF AUTH
  // ==========================================

  /**
   * POST /api/v1/auth/login
   * Staff login (Supports Email+Password OR School Code + Username/Phone).
   */
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);

    return res.status(200).json(
      ApiResponse.ok("Login successful", result)
    );
  });

  /**
   * POST /api/v1/auth/forgot-password
   * Emails a temporary password. Generic response — no account enumeration.
   */
  forgotPassword = asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    return res
      .status(200)
      .json(ApiResponse.ok("If an account exists for this email, a new password has been sent.", { sent: true }));
  });

  /**
   * GET /api/v1/auth/me
   * Get currently logged-in staff profile.
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    return res.status(200).json(
      ApiResponse.ok("Profile fetched successfully", user)
    );
  });

  /**
   * PATCH /api/v1/auth/me
   * Update own profile (name, phone).
   */
  updateOwnProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateOwnProfile(req.user.id, req.body);
    return res.status(200).json(
      ApiResponse.ok("Profile updated successfully", user)
    );
  });

  /**
   * POST /api/v1/auth/me/avatar
   * Upload / replace the current user's profile picture (multer single "file").
   */
  uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequestError("Please attach an image file");
    const user = await authService.uploadAvatar(req.user.id, req.file.buffer);
    return res.status(200).json(
      ApiResponse.ok("Profile picture updated successfully", user)
    );
  });

  /**
   * POST /api/v1/auth/refresh
   * Issue new access + refresh token pair (token rotation).
   */
  refreshTokens = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    return res.status(200).json(
      ApiResponse.ok("Tokens refreshed successfully", result)
    );
  });

  /**
   * POST /api/v1/auth/logout
   * Invalidate the provided refresh token (single device logout).
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    // Activity Log (req.user is optional — logout route is public)
    await authService.recordLogout(req.user);
    return res.status(200).json(
      ApiResponse.ok("Logged out successfully")
    );
  });

  /**
   * POST /api/v1/auth/logout-all
   * Revoke ALL refresh tokens for current user (logout from all devices).
   */
  logoutAllDevices = asyncHandler(async (req, res) => {
    await authService.logoutAllDevices(req.user.id);
    return res.status(200).json(
      ApiResponse.ok("Logged out from all devices successfully")
    );
  });

  /**
   * POST /api/v1/auth/change-password
   * Change own password. Forces logout from all other devices.
   */
  changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    return res.status(200).json(
      ApiResponse.ok(
        "Password changed successfully. Please login again on all devices."
      )
    );
  });

  // ==========================================
  // USER MANAGEMENT (RBAC)
  // ==========================================

  /**
   * POST /api/v1/auth/users/import
   * Upload Excel file for bulk staff registration.
   */
  importStaffExcel = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)");
    }
    const result = await authService.importStaffExcel(req.file.buffer, req.user);
    return res.status(202).json(
      ApiResponse.ok("Staff bulk import job queued successfully", result)
    );
  });

  /**
   * POST /api/v1/auth/users
   * Create a new staff user. SUPER_ADMIN or ADMIN only.
   */
  createUser = asyncHandler(async (req, res) => {
    const user = await authService.createUser(req.user, req.body);
    return res.status(201).json(
      ApiResponse.created("Staff account created successfully", user)
    );
  });

  /**
   * POST /api/v1/auth/users/sample
   * Create demo/sample staff for a branch (shared password + class teacher assign).
   */
  createSampleStaff = asyncHandler(async (req, res) => {
    const result = await authService.createSampleStaff(req.user);
    return res.status(201).json(
      ApiResponse.created("Sample staff created", result)
    );
  });

  /**
   * GET /api/v1/auth/users/import-template
   * Streams the .xlsx bulk-import template for staff.
   */
  downloadImportTemplate = asyncHandler(async (req, res) => {
    const buffer = authService.buildImportTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="staff-import-template.xlsx"'
    );
    return res.send(buffer);
  });

  /**
   * GET /api/v1/auth/users
   * List all users in scope (SUPER_ADMIN = org-wide, ADMIN = branch-only).
   */
  listUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize) || 50));
    const users = await authService.listUsers(req.user, { page, pageSize });
    return res.status(200).json(
      ApiResponse.ok("Users fetched successfully", users)
    );
  });

  /**
   * GET /api/v1/auth/users/all
   * Platform-wide user directory — every staff account across all orgs.
   * Server-side filters: search, role, status, reason.
   */
  listAllUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const filters = this.#parseUserFilters(req.query);
    const result = await authService.listAllUsersPlatform(req.user, { page, pageSize, ...filters });
    return res.status(200).json(
      ApiResponse.ok("Platform user directory fetched successfully", result)
    );
  });

  /**
   * GET /api/v1/auth/users/all/export
   * CSV export — current filters ke mutabiq saare platform users.
   */
  exportAllUsers = asyncHandler(async (req, res) => {
    const filters = this.#parseUserFilters(req.query);
    const { csv } = await authService.exportAllUsersPlatform(req.user, filters);
    return sendCsv(res, csv, "users");
  });

  #parseUserFilters(query) {
    const filters = {};
    if (query.search) filters.search = String(query.search).trim();
    if (query.role) filters.role = String(query.role);
    if (query.status === "ACTIVE") filters.isActive = true;
    else if (query.status === "INACTIVE") filters.isActive = false;
    if (query.reason === "WITH_REASON") filters.hasBlockReason = true;
    else if (query.reason === "WITHOUT_REASON") filters.hasBlockReason = false;
    return filters;
  }

  /**
   * GET /api/v1/auth/users/export
   * Export staff as Excel (.xlsx) for download.
   */
  exportStaffExcel = asyncHandler(async (req, res) => {
    const buffer = await authService.exportStaffExcel(req.user);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=staff-export-${Date.now()}.xlsx`);
    return res.send(Buffer.from(buffer));
  });

  /**
   * GET /api/v1/auth/users/:id
   * Get a single user profile by ID.
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user, req.params.id);
    return res.status(200).json(
      ApiResponse.ok("User fetched successfully", user)
    );
  });

  /**
   * PATCH /api/v1/auth/users/:id
   * Update user details (name, phone, role, isActive).
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await authService.updateUser(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json(
      ApiResponse.ok("User updated successfully", user)
    );
  });

  /**
   * DELETE /api/v1/auth/users/:id
   * Soft-deactivate a user (isActive = false, revoke all tokens).
   */
  deactivateUser = asyncHandler(async (req, res) => {
    const user = await authService.deactivateUser(req.user, req.params.id, req.body?.reason);
    return res.status(200).json(
      ApiResponse.ok("User deactivated successfully", user)
    );
  });

  /**
   * PATCH /api/v1/auth/users/:id/reactivate
   * Reactivate a previously deactivated user.
   */
  reactivateUser = asyncHandler(async (req, res) => {
    const user = await authService.reactivateUser(req.user, req.params.id);
    return res.status(200).json(
      ApiResponse.ok("User reactivated successfully", user)
    );
  });

  /**
   * POST /api/v1/auth/users/:id/reset-password
   * Admin resets a user's password.
   */
  adminResetPassword = asyncHandler(async (req, res) => {
    await authService.adminResetPassword(
      req.user,
      req.params.id,
      req.body.newPassword
    );
    return res.status(200).json(
      ApiResponse.ok("Password reset successfully. User must login again.")
    );
  });

  // ==========================================
  // PARENT PORTAL — OTP Auth
  // ==========================================

  /**
   * POST /api/v1/auth/parent/request-otp
   * Parent requests OTP sent to their WhatsApp number.
   */
  parentRequestOtp = asyncHandler(async (req, res) => {
    const { whatsappNo } = req.body;
    const result = await authService.requestParentOtp(whatsappNo);
    return res.status(200).json(
      ApiResponse.ok(result.message, result)
    );
  });

  /**
   * POST /api/v1/auth/parent/verify-otp
   * Parent submits OTP → receives portal JWT.
   */
  parentVerifyOtp = asyncHandler(async (req, res) => {
    const { whatsappNo, otp } = req.body;
    const result = await authService.verifyParentOtp(whatsappNo, otp);
    return res.status(200).json(
      ApiResponse.ok("OTP verified. Welcome to the parent portal!", result)
    );
  });

  /**
   * POST /api/v1/auth/parent/login
   * Direct Parent Login — School Code + Phone + shared school password.
   */
  parentLogin = asyncHandler(async (req, res) => {
    const { schoolCode, phone, password } = req.body;
    const result = await authService.parentLogin({ schoolCode, phone, password });
    return res.status(200).json(
      ApiResponse.ok("Login successful. Welcome to the parent portal!", result)
    );
  });

  /**
   * GET /api/v1/auth/parent/me
   * Get parent profile + linked children.
   */
  parentGetMe = asyncHandler(async (req, res) => {
    const parent = await authService.getParentById(req.parent.parentId);
    return res.status(200).json(
      ApiResponse.ok("Parent profile fetched successfully", parent)
    );
  });

  // ==========================================
  // STUDENT / PARENT PORTAL — Direct Login (Zero OTP)
  // ==========================================

  /**
   * POST /api/v1/auth/student/login
   * Direct Student/Parent Portal Login using School Code + Roll Number
   */
  studentDirectLogin = asyncHandler(async (req, res) => {
    const { schoolCode, rollNumber, password } = req.body;
    const result = await authService.studentDirectLogin({ schoolCode, rollNumber, password });
    return res.status(200).json(
      ApiResponse.ok("Login successful. Welcome to Student/Parent Portal!", result)
    );
  });

  /**
   * POST /api/v1/auth/student/request-otp
   * Student enters: (School Code + Roll Number) OR Card ID
   * OTP is sent to parent contact.
   */
  studentRequestOtp = asyncHandler(async (req, res) => {
    const { schoolCode, rollNumber, cardId } = req.body;
    const result = await authService.requestStudentOtp({ schoolCode, rollNumber, cardId });
    return res.status(200).json(
      ApiResponse.ok(result.message, result)
    );
  });

  /**
   * POST /api/v1/auth/student/verify-otp
   * Student submits OTP -> receives portal JWT.
   */
  studentVerifyOtp = asyncHandler(async (req, res) => {
    const { identifier, schoolCode, rollNumber, otp } = req.body;
    const result = await authService.verifyStudentOtp({ identifier, schoolCode, rollNumber, otp });
    return res.status(200).json(
      ApiResponse.ok("OTP verified. Welcome to the student portal!", result)
    );
  });

  /**
   * GET /api/v1/auth/student/me
   * Get student profile (read-only).
   */
  studentGetMe = asyncHandler(async (req, res) => {
    const student = await authService.getStudentById(req.student.studentId);
    return res.status(200).json(
      ApiResponse.ok("Student profile fetched successfully", student)
    );
  });
}

export default new AuthController();
