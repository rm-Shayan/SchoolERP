import { Router } from "express";
import authController from "./auth.controller.js";
import {
  loginSchema,
  refreshTokenSchema,
  switchBranchSchema,
  logoutSchema,
  forgotPasswordSchema,
  updateOwnProfileSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  deactivateUserSchema,
  adminResetPasswordSchema,
  parentRequestOtpSchema,
  parentVerifyOtpSchema,
  parentLoginSchema,
  studentDirectLoginSchema,
  studentRequestOtpSchema,
  studentVerifyOtpSchema,
} from "./auth.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  authorize,
  authenticateParent,
  authenticateStudent,
} from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { loginLimiter, otpLimiter, sensitiveLimiter } from "../../middlewares/rateLimit.middleware.js";
import { imageUpload, fileUpload } from "../../lib/upload.js";

const router = Router();

// ==========================================
// STAFF AUTH — Public Routes
// ==========================================

/**
 * POST /api/v1/auth/login
 * All staff roles — email + password login
 * Returns: { accessToken, refreshToken, user }
 */
router.post("/login", loginLimiter, validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh
 * Issue new token pair using refresh token (token rotation)
 * Returns: { accessToken, refreshToken, user }
 */
router.post("/refresh", sensitiveLimiter, validate(refreshTokenSchema), authController.refreshTokens);

// ==========================================
// STAFF AUTH — Protected Routes
// ==========================================

/**
 * POST /api/v1/auth/switch-branch
 * Same account ke saath doosri branch par switch (token re-scope, no new creds).
 */
router.post(
  "/switch-branch",
  authenticate,
  validate(switchBranchSchema),
  authController.switchBranch
);

/**
 * GET /api/v1/auth/my-branches
 * Branches this account can open (for the Settings → My Branches switcher).
 */
router.get("/my-branches", authenticate, authController.myBranches);

/**
 * GET /api/v1/auth/me
 * Get currently authenticated staff user profile
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * PATCH /api/v1/auth/me
 * Update own profile (name, phone) — available to ALL authenticated staff
 */
router.patch(
  "/me",
  authenticate,
  validate(updateOwnProfileSchema),
  authController.updateOwnProfile
);

/**
 * POST /api/v1/auth/me/avatar
 * Upload / replace own profile picture — available to ALL authenticated staff
 */
router.post(
  "/me/avatar",
  authenticate,
  imageUpload.single("file"),
  authController.uploadAvatar
);

/**
 * POST /api/v1/auth/logout
 * Logout from current device (invalidate current refresh token)
 */
router.post("/logout", validate(logoutSchema), authController.logout);

/**
 * POST /api/v1/auth/logout-all
 * Logout from ALL devices (revoke all refresh tokens)
 */
router.post("/logout-all", authenticate, authController.logoutAllDevices);

/**
 * POST /api/v1/auth/forgot-password
 * Self-service reset - temporary password emailed (public, rate-limited).
 */
router.post(
  "/forgot-password",
  sensitiveLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * POST /api/v1/auth/change-password
 * Change own password — available to ALL authenticated staff
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

// ==========================================
// USER MANAGEMENT — SUPER_ADMIN & ADMIN only
// ==========================================

/**
 * POST /api/v1/auth/users/import
 * Bulk staff registration via Excel file upload
 */
router.post(
  "/users/import",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  fileUpload.single("file"),
  authController.importStaffExcel
);

/**
 * POST /api/v1/auth/users
 * Create a new staff account
 *   SUPER_ADMIN → can create ADMIN, TEACHER, RECEPTIONIST
 *   ADMIN       → can create TEACHER, RECEPTIONIST (own branch only)
 */
router.post(
  "/users",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(createUserSchema),
  authController.createUser
);

/**
 * POST /api/v1/auth/users/sample
 * Create demo/sample staff for the branch (shared password + class teacher assign).
 */
router.post(
  "/users/sample",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  authController.createSampleStaff
);

/**
 * GET /api/v1/auth/users/import-template
 * .xlsx template for bulk staff import (same columns the importer reads).
 */
router.get(
  "/users/import-template",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  authController.downloadImportTemplate
);

/**
 * GET /api/v1/auth/users
 * List all staff users in scope
 *   SUPER_ADMIN → all users in org (all campuses)
 *   ADMIN       → users in own school only
 */
router.get(
  "/users",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  authController.listUsers
);

/**
 * GET /api/v1/auth/users/export
 * Export staff as Excel (.xlsx) for download.
 */
router.get(
  "/users/export",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  authController.exportStaffExcel
);

/**
 * GET /api/v1/auth/users/all
 * Platform-wide user directory (SUPER_ADMIN only).
 * Must be declared before /users/:id to avoid route conflict.
 */
router.get(
  "/users/all",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  authController.listAllUsers
);

/**
 * GET /api/v1/auth/users/all/export
 * CSV export — current filters ke mutabiq (SUPER_ADMIN only).
 * NOTE: /users/:id se pehle registered.
 */
router.get(
  "/users/all/export",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  authController.exportAllUsers
);

/**
 * GET /api/v1/auth/users/:id
 * Get a specific user profile (scoped)
 */
router.get(
  "/users/:id",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(userIdParamSchema),
  authController.getUserById
);

/**
 * PATCH /api/v1/auth/users/:id
 * Update user (name, phone, role, isActive)
 */
router.patch(
  "/users/:id",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(updateUserSchema),
  authController.updateUser
);

/**
 * DELETE /api/v1/auth/users/:id
 * Soft-deactivate a user (sets isActive = false, revokes all tokens)
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(deactivateUserSchema),
  authController.deactivateUser
);

/**
 * PATCH /api/v1/auth/users/:id/reactivate
 * Reactivate a previously deactivated user
 */
router.patch(
  "/users/:id/reactivate",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(userIdParamSchema),
  authController.reactivateUser
);

/**
 * POST /api/v1/auth/users/:id/reset-password
 * Admin resets a user's password
 */
router.post(
  "/users/:id/reset-password",
  authenticate,
  authorize(ROLE_GROUPS.USER_MANAGERS),
  validate(adminResetPasswordSchema),
  authController.adminResetPassword
);

// ==========================================
// PARENT PORTAL — Direct Password Login (no OTP)
// ==========================================

/**
 * POST /api/v1/auth/parent/request-otp
 * Parent sends their WhatsApp number → receives 6-digit OTP
 * Public (no auth required)
 */
router.post(
  "/parent/request-otp",
  otpLimiter,
  validate(parentRequestOtpSchema),
  authController.parentRequestOtp
);

/**
 * POST /api/v1/auth/parent/verify-otp
 * Parent submits OTP → receives portal JWT (valid 30 days)
 * Public (no auth required)
 */
router.post(
  "/parent/verify-otp",
  otpLimiter,
  validate(parentVerifyOtpSchema),
  authController.parentVerifyOtp
);

/**
 * POST /api/v1/auth/parent/login
 * Direct Parent Portal Login: School Code + Phone + shared school password.
 * Public (no auth required)
 */
router.post(
  "/parent/login",
  loginLimiter,
  validate(parentLoginSchema),
  authController.parentLogin
);

/**
 * GET /api/v1/auth/parent/me
 * Get parent profile + linked children (protected — requires parent token)
 */
router.get(
  "/parent/me",
  authenticateParent,
  authController.parentGetMe
);

// ==========================================
// STUDENT / PARENT PORTAL — Direct Login (Zero OTP)
// ==========================================

/**
 * POST /api/v1/auth/student/login
 * Direct Student/Parent Portal Login: School Code + Roll Number
 * Returns: { token, student }
 */
router.post(
  "/student/login",
  loginLimiter,
  validate(studentDirectLoginSchema),
  authController.studentDirectLogin
);

/**
 * POST /api/v1/auth/student/request-otp
 * Student enters their card ID → OTP sent to parent's WhatsApp
 * Public (no auth required)
 */
router.post(
  "/student/request-otp",
  otpLimiter,
  validate(studentRequestOtpSchema),
  authController.studentRequestOtp
);

/**
 * POST /api/v1/auth/student/verify-otp
 * Student submits OTP → receives student portal JWT (valid 30 days)
 * Public (no auth required)
 */
router.post(
  "/student/verify-otp",
  otpLimiter,
  validate(studentVerifyOtpSchema),
  authController.studentVerifyOtp
);

/**
 * GET /api/v1/auth/student/me
 * Get student profile — read-only (protected — requires student token)
 */
router.get(
  "/student/me",
  authenticateStudent,
  authController.studentGetMe
);

export default router;
