import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../config/db.js";
import authRepository from "./repository.js";
import { UserResponseDTO, ParentPortalDTO, StudentPortalDTO } from "./auth.dto.js";
import ApiError from "../../lib/utils/ApiError.js";
import { ROLES, OTP, JWT, BLOCKED_MESSAGE } from "../../constants.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import organizationService from "../organization/organization.service.js";
import storageService from "../../services/storage.service.js";
import { sendEmail, sendOtpEmail } from "../../services/email.service.js";
import { queueEmail } from "../../services/emailOutbox.js";
import { buildLoginUrl } from "../../services/email.templates.js";
import portalNotificationService from "../notification/notification.portalService.js";
import Logger from "../../lib/utils/logger.js";
import redis from "../../config/redis.js";
import userManagementService from "./userManagement.service.js";

const logger = new Logger("auth-service");

// Auth snapshot cache — same key/TTL as auth middleware.
// Avoids a heavy 3-table join on every token refresh when the user
// snapshot hasn't changed (most common case).
const AUTH_CACHE_KEY = (id) => `auth:user:${id}`;
const AUTH_CACHE_TTL = 300; // 5 min — align with auth middleware cache

async function getCachedUser(userId) {
  try {
    const cached = await redis.get(AUTH_CACHE_KEY(userId));
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return null;
}

async function cacheUser(user) {
  try {
    await redis.setEx(AUTH_CACHE_KEY(user.id), AUTH_CACHE_TTL, JSON.stringify(user));
  } catch (_) {}
}

// ==========================================
// HELPER UTILITIES
// ==========================================

/**
 * Generate a cryptographically random token
 */
const generateSecureToken = () => crypto.randomBytes(64).toString("hex");

/**
 * Generate a 6-digit numeric OTP
 */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Hash a value using SHA-256 (for tokens and OTPs stored in DB)
 */
const hashValue = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

/**
 * Shared "school password" check — all portals (staff / student / parent) use
 * the SAME school-level password. Since there is no dedicated password column
 * on a school, the school CODE doubles as that shared password (case-insensitive),
 * matching the existing staff fallback in login().
 */
const matchesSchoolPassword = (password, schoolCode) =>
  !!password &&
  !!schoolCode &&
  password.trim().toUpperCase() === schoolCode.trim().toUpperCase();

/**
 * Portal password verify: agar branch admin ne custom shared password set kiya
 * hai (hashed portalPassword) to wahi chalega, warna fallback = school code.
 */
const verifyPortalPassword = async (school, password) => {
  if (!password || !school) return false;
  if (school.portalPassword) {
    try {
      return await bcrypt.compare(password.trim(), school.portalPassword);
    } catch {
      return false;
    }
  }
  return matchesSchoolPassword(password, school.code);
};

/**
 * Session-user overlay: token + DTO get scoped to the branch the user is
 * actually working in (home schoolId OR one of their branchAccess schools).
 * A shallow copy keeps the DB row (home branch) intact for access rules.
 */
const buildSessionUser = (user, branchSchool) => ({
  ...user,
  schoolId: branchSchool.id,
  school: branchSchool,
  organization: branchSchool.organization || user.organization,
});

/**
 * Attach the accessible-branch list (home + extras) to a session user so the
 * DTO's `schools` reflects every branch the account can open.
 */
const attachAccessibleBranches = async (sessionUser, user) => {
  const extras = user.branchAccess && Array.isArray(user.branchAccess) ? user.branchAccess : [];
  if (extras.length > 0) {
    sessionUser._accessible = await authRepository.listAccessibleSchools(user.organizationId, [
      ...(sessionUser.schoolId ? [sessionUser.schoolId] : []),
      ...extras,
    ]);
  }
  return sessionUser;
};

/**
 * Sign a JWT access token for staff
 */
const signAccessToken = (payload) =>
  jwt.sign(
    payload,
    process.env.JWT_SECRET || "super_secret_school_erp_token",
    { expiresIn: JWT.ACCESS_EXPIRY }
  );

/**
 * Sign a JWT for parent portal access
 */
const signParentToken = (payload) =>
  jwt.sign(
    payload,
    process.env.JWT_SECRET || "super_secret_school_erp_token",
    { expiresIn: JWT.PARENT_EXPIRY }
  );

/**
 * Sign a JWT for student portal access
 */
const signStudentToken = (payload) =>
  jwt.sign(
    payload,
    process.env.JWT_SECRET || "super_secret_school_erp_token",
    { expiresIn: JWT.STUDENT_EXPIRY }
  );

// ==========================================
// RBAC SCOPE RULES
// ==========================================

/**
 * Determine which roles a requester can create/manage.
 * SUPER_ADMIN → can manage any role in their org
 * ADMIN       → can manage branch-level staff (not SUPER_ADMIN)
 */
const CREATABLE_ROLES_BY = {
  // Platform owner — sab kuch
  SUPER_ADMIN: [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.RECEPTIONIST,
  ],
  // Branch principal — apni branch ke staff
  ADMIN: [
    ROLES.TEACHER,
    ROLES.RECEPTIONIST,
  ],
};

// ==========================================
// AUTH SERVICE
// ==========================================

class AuthService {
  // ──────────────────────────────────────────
  // STAFF AUTH
  // ──────────────────────────────────────────

  /**
   * Login method supporting:
   * 1. SUPER_ADMIN: Email + Password
   * 2. BRANCH STAFF (Admin, Teacher, Receptionist, etc.): (School Code + Email/Phone/Username) OR Email + Password
   */
  async login({ email, username, phone, schoolCode, password }, req) {
    let user = null;
    let sessionUser = null;
    const identifier = email || username || phone;

    if (schoolCode && identifier) {
      // Branch Staff login via School Code + Identifier. `school` is the
      // branch the code resolved to (home OR a branchAccess branch) — the
      // whole session (token + DTO) gets scoped to it.
      const { user: matched, school } = await authRepository.findStaffBySchoolAndCredential(schoolCode, identifier);
      if (!matched || !school) {
        throw ApiError.unauthorizedError("Invalid login credentials or school code");
      }
      if (school.status === "BLOCKED") {
        throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
      }
      user = matched;
      sessionUser = buildSessionUser(user, school);
    } else if (email) {
      // Direct Email Login (Super Admin or direct staff login)
      user = await authRepository.findByEmail(email);
      if (user) sessionUser = user;
    }

    if (!user) {
      throw ApiError.unauthorizedError("Invalid login credentials or school code");
    }

    if (!user.isActive) {
      throw ApiError.unauthorizedError(
        "Your account has been deactivated. Please contact your administrator."
      );
    }

    // Blocking enforcement (spec §2): a blocked organization or the session
    // branch locks out every role under it — checked before password verify
    // on purpose so the reason is never masked by a generic credential error.
    if (
      user.organization?.status === "BLOCKED" ||
      sessionUser?.school?.status === "BLOCKED" ||
      user.school?.status === "BLOCKED"
    ) {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    // Verify Password (or School Code as default password if password equals schoolCode)
    let isMatch = await bcrypt.compare(password, user.password);

    // Portal password (singleton password set by branch admin)
    if (!isMatch && user.school) {
      isMatch = await verifyPortalPassword(user.school, password);
    }

    // Default fallback: If password matches School Code (for newly imported staff
    // without custom password set). When schoolCode is not in the request body
    // (e.g. AdminLoginForm sends only email+password), still try the user's
    // home branch code so the admin doesn't need to enter the school code.
    if (!isMatch) {
      const codeToCheck = schoolCode || user.school?.code || null;
      if (codeToCheck && password.trim().toUpperCase() === codeToCheck.trim().toUpperCase()) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw ApiError.unauthorizedError("Invalid email, username, or password");
    }

    // Generate access + refresh tokens — scoped to the session branch
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      schoolId: sessionUser.schoolId,
      organizationId: user.organizationId,
      tokenType: "staff",
    });

    const rawRefreshToken = generateSecureToken();
    const tokenHash = hashValue(rawRefreshToken);
    const expiresAt = new Date(Date.now() + JWT.REFRESH_EXPIRY_MS);

    // Parallelize: refresh token write + branch list query + audit log
    const [, ,] = await Promise.all([
      authRepository.createRefreshToken(user.id, tokenHash, expiresAt),
      attachAccessibleBranches(sessionUser, user),
      auditService.record({
        actorId: user.id, actorName: user.name, actorRole: user.role,
        action: AUDIT_ACTIONS.LOGIN, entityType: AUDIT_ENTITY_TYPES.AUTH,
        entityId: user.id, entityName: user.name,
        organizationId: user.organizationId, schoolId: sessionUser.schoolId,
        details: JSON.stringify({ loginId: identifier || email }),
        ipAddress: req?.ip || null,
      }),
    ]);

    // Delivery cycle: the org is "delivered" (SETUP_PENDING → ACTIVE) on the
    // FIRST successful login — no earlier. Blocked orgs never reach this point.
    if (user.organization?.status === "SETUP_PENDING") {
      await organizationService.markDeliveredOnLogin(user);
      user.organization.status = "ACTIVE";
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: UserResponseDTO.toDTO(sessionUser),
    };
  }

  /**
   * Get the currently logged in staff user profile.
   * `currentSchoolId` = the JWT's session branch (may differ from the user's
   * home branch when switching branches).
   */
  async getCurrentUser(userId, currentSchoolId) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFoundError("User not found");

    let sessionUser = user;
    if (currentSchoolId && currentSchoolId !== user.schoolId) {
      if (!(user.branchAccess || []).includes(currentSchoolId)) {
        throw ApiError.unauthorizedError("Access to this branch has been revoked.");
      }
      const school = await authRepository.findSchoolForSession(currentSchoolId);
      if (school && school.organizationId === user.organizationId) {
        sessionUser = buildSessionUser(user, school);
      }
    }

    await attachAccessibleBranches(sessionUser, user);
    return UserResponseDTO.toDTO(sessionUser);
  }

  /**
   * Update the currently logged-in user's own profile (name, phone, avatarUrl).
   * Email/role cannot be changed here.
   */
  async updateOwnProfile(userId, data) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFoundError("User not found");

    const { name, phone, avatarUrl } = data;

    // Rule 5 — when the avatar is replaced via PATCH, remove the old file
    // from storage so old versions don't pile up on the 25GB plan. Guard:
    // skip when the new URL is the SAME Cloudinary asset — the upload
    // endpoint already overwrote it, so deleting would destroy the
    // just-uploaded replacement.
    if (
      avatarUrl !== undefined &&
      user.avatarUrl &&
      avatarUrl !== user.avatarUrl &&
      !storageService.hasSamePublicId(user.avatarUrl, avatarUrl)
    ) {
      await storageService.deleteImage({ url: user.avatarUrl, organizationId: user.organizationId, schoolId: user.schoolId }).catch(() => {});
    }

    const updated = await authRepository.updateUser(userId, {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    });

    return UserResponseDTO.toDTO(updated);
  }

  /**
   * Upload the current user's avatar photo (multer single "file").
   * Old avatar is removed from storage once the new one is saved.
   */
  async uploadAvatar(userId, buffer) {
    if (!buffer || buffer.length === 0) {
      throw ApiError.badRequestError("Please attach an image file");
    }

    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFoundError("User not found");

    const { url, overwritten } = await storageService.uploadImage({
      buffer,
      folder: "avatars",
      existingUrl: user.avatarUrl,
      organizationId: user.organizationId,
      schoolId: user.schoolId,
    });

    // Best-effort cleanup of the previous avatar (local disk / Cloudinary) —
    // skipped when the upload already overwrote the same Cloudinary asset.
    if (!overwritten && user.avatarUrl) {
      await storageService
        .deleteImage({ url: user.avatarUrl, organizationId: user.organizationId, schoolId: user.schoolId })
        .catch(() => {});
    }

    const updated = await authRepository.updateUser(userId, { avatarUrl: url });
    return UserResponseDTO.toDTO(updated);
  }

  /**
   * Rotate refresh token — validates the existing token and issues a new pair.
   * Old token is revoked on use (token rotation).
   */
  async refreshTokens(rawRefreshToken, requestedSchoolId) {
    const tokenHash = hashValue(rawRefreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorizedError(
        "Refresh token is invalid or expired. Please login again."
      );
    }

    const { user: lightweightUser } = stored;

    if (!lightweightUser.isActive) {
      throw ApiError.unauthorizedError("Account deactivated.");
    }

    // Blocking enforcement on token refresh — a user blocked mid-session
    // (org/branch block) loses the ability to mint new access tokens.
    if (
      lightweightUser.organization?.status === "BLOCKED" ||
      lightweightUser.school?.status === "BLOCKED"
    ) {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    // Revoke old token + create new one in parallel (saves ~1 DB round-trip)
    const newRawToken = generateSecureToken();
    const newHash = hashValue(newRawToken);
    const expiresAt = new Date(Date.now() + JWT.REFRESH_EXPIRY_MS);
    await Promise.all([
      authRepository.revokeRefreshToken(tokenHash),
      authRepository.createRefreshToken(lightweightUser.id, newHash, expiresAt),
    ]);

    // Fetch full user snapshot for DTO — check Redis cache first
    // (same cache the auth middleware populates on every authenticated request).
    let user = await getCachedUser(lightweightUser.id);
    if (!user) {
      user = await authRepository.findById(lightweightUser.id);
      if (user) await cacheUser(user);
    }
    if (!user) {
      throw ApiError.unauthorizedError("User account not found.");
    }

    // Keep the session scoped to the branch it was on before rotation.
    let sessionUser = user;
    let effectiveSchoolId = user.schoolId;
    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      if (!(user.branchAccess || []).includes(requestedSchoolId)) {
        throw ApiError.unauthorizedError("Access to this branch has been revoked.");
      }
      const school = await authRepository.findSchoolForSession(requestedSchoolId);
      if (!school || school.organizationId !== user.organizationId) {
        throw ApiError.unauthorizedError("Branch not found for this account.");
      }
      if (school.status === "BLOCKED") {
        throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
      }
      effectiveSchoolId = requestedSchoolId;
      sessionUser = buildSessionUser(user, school);
    }
    await attachAccessibleBranches(sessionUser, user);

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      schoolId: effectiveSchoolId,
      organizationId: user.organizationId,
      tokenType: "staff",
    });

    return {
      accessToken,
      refreshToken: newRawToken,
      user: UserResponseDTO.toDTO(sessionUser),
    };
  }

  /**
   * Switch the branch for an authenticated user WITHOUT new credentials —
   * same identity/role, JWT re-scoped to the target branch. Refresh token
   * stays (user-scoped); the client keeps the same refresh token.
   */
  async switchBranch(userId, targetSchoolId) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.unauthorizedError("User not found");

    if (user.schoolId !== targetSchoolId && !(user.branchAccess || []).includes(targetSchoolId)) {
      throw ApiError.forbiddenError("You do not have access to this branch");
    }

    const school = await authRepository.findSchoolForSession(targetSchoolId);
    if (!school || school.organizationId !== user.organizationId) {
      throw ApiError.notFoundError("Branch not found");
    }
    if (school.status === "BLOCKED" || user.organization?.status === "BLOCKED") {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    const sessionUser = await attachAccessibleBranches(buildSessionUser(user, school), user);
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      schoolId: school.id,
      organizationId: user.organizationId,
      tokenType: "staff",
    });

    return { accessToken, user: UserResponseDTO.toDTO(sessionUser) };
  }

  /**
   * Branches this account can open (home + extras). `isCurrent` marks the
   * branch the request's JWT is currently scoped to.
   */
  async myBranches(userId, currentSchoolId) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.unauthorizedError("User not found");

    const ids = [...new Set([
      ...(user.schoolId ? [user.schoolId] : []),
      ...(user.branchAccess || []),
    ])];
    const branches = await authRepository.listAccessibleSchools(user.organizationId, ids);
    return branches.map((b) => ({
      ...b,
      isHome: b.id === user.schoolId,
      isCurrent: b.id === currentSchoolId,
    }));
  }

  /**
   * Logout: revoke the provided refresh token.
   */
  async logout(rawRefreshToken) {
    const tokenHash = hashValue(rawRefreshToken);
    await authRepository.revokeRefreshToken(tokenHash);
    return true;
  }

  /**
   * Record a staff logout in the activity log (needs the user context).
   * Kept separate from logout() so the controller can pass req.user.
   */
  async recordLogout(user) {
    if (!user) return;
    auditService.record({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGOUT,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: user.id,
      entityName: user.name,
      organizationId: user.organizationId,
      schoolId: user.schoolId,
    });
  }

  /**
   * Logout from ALL devices: revoke all refresh tokens for a user.
   */
  async logoutAllDevices(userId) {
    await authRepository.revokeAllRefreshTokens(userId);
    return true;
  }

  /**
   * Change own password.
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await authRepository.findById(userId);
    if (!user) throw ApiError.notFoundError("User not found");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequestError("Current password is incorrect");
    }

    if (oldPassword === newPassword) {
      throw ApiError.badRequestError(
        "New password must be different from current password"
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(userId, { password: hashed });

    // Revoke all refresh tokens — force re-login on all devices
    await authRepository.revokeAllRefreshTokens(userId);

    return true;
  }


  // ─── User management delegated to userManagement.service.js ───
  async importStaffExcel(fileBuffer, requester) { return userManagementService.importStaffExcel(fileBuffer, requester); }
  buildImportTemplate() { return userManagementService.buildImportTemplate(); }
  async createUser(requester, data) { return userManagementService.createUser(requester, data); }
  async createSampleStaff(requester) { return userManagementService.createSampleStaff(requester); }
  async listUsers(requester, opts) { return userManagementService.listUsers(requester, opts); }
  async exportStaffExcel(requester) { return userManagementService.exportStaffExcel(requester); }
  async listAllUsersPlatform(requester, opts) { return userManagementService.listAllUsersPlatform(requester, opts); }
  async exportAllUsersPlatform(requester, filters) { return userManagementService.exportAllUsersPlatform(requester, filters); }
  async getUserById(requester, targetId) { return userManagementService.getUserById(requester, targetId); }
  async updateUser(requester, targetId, data, file) { return userManagementService.updateUser(requester, targetId, data, file); }
  async deactivateUser(requester, targetId, reason) { return userManagementService.deactivateUser(requester, targetId, reason); }
  async reactivateUser(requester, targetId) { return userManagementService.reactivateUser(requester, targetId); }
  async adminResetPassword(requester, targetId, pw) { return userManagementService.adminResetPassword(requester, targetId, pw); }
  _assertCanAccessUser(requester, target) { return userManagementService._assertCanAccessUser(requester, target); }

  /**
   * Self-service forgot password (staff accounts): email par temporary password
   * bhejta hai. Enumeration se bachne ke liye response hamesha generic hota hai.
   */
  async forgotPassword(email) {
    const normalized = String(email || "").trim().toLowerCase();
    const user = await authRepository.findByEmail(normalized);

    if (user && user.isActive) {
      const tempPassword = `Sch-${crypto.randomBytes(5).toString("base64url")}1!`;
      const hashed = await bcrypt.hash(tempPassword, 12);
      await authRepository.updateUser(user.id, { password: hashed });
      await authRepository.revokeAllRefreshTokens(user.id);

      // Branded login link (org slug + school code) — recipient ko /login par
      // le jaata hai jahan theme or logo already loaded ho.
      const loginUrl = buildLoginUrl({
        orgSlug: user.organization?.slug || null,
        schoolCode: user.school?.code || null,
      });

      auditService.record({
        actorId: user.id,
        actorName: user.name,
        actorRole: "SYSTEM",
        action: AUDIT_ACTIONS.RESET_STAFF_PASSWORD,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: user.id,
        entityName: user.name,
        organizationId: user.organizationId,
        schoolId: user.schoolId,
      });

      queueEmail({
        to: normalized,
        priority: "CRITICAL",
        allowHolderAsRecipient: true,
        subject: "Your SchoolERP account - new password",
        html: `
          <p>Hello <b>${user.name}</b>,</p>
          <p>A new password was requested for your account.</p>
          <p style="font-size:18px;font-weight:bold;letter-spacing:1px;">${tempPassword}</p>
          <p>Please sign in with this password. You can change it later from Settings → Security.</p>
          <p>Sign in here: <a href="${loginUrl}" style="color:#4f46e5;">${loginUrl}</a></p>
        `,
        text: `Your new SchoolERP password: ${tempPassword}\n\nSign in here: ${loginUrl}`,
      }).catch(() => {});
    }

    return true;
  }

  async requestParentOtp(whatsappNo) {
    const parent = await authRepository.findParentByWhatsapp(whatsappNo);
    if (!parent) {
      throw ApiError.notFoundError(
        "No parent account found for this WhatsApp number. Please contact your school."
      );
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiresAt = new Date(
      Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000
    );

    await authRepository.saveOtp(
      whatsappNo,
      "PARENT_LOGIN",
      otpHash,
      expiresAt
    );

    // Dispatch OTP via Email — primary parent channel (no WhatsApp API budget yet).
    // NOTE: future WhatsApp integration will swap this for whatsappService.sendMessage.
    if (parent.email) {
      await sendOtpEmail({
        to: parent.email,
        recipientName: parent.name,
        otp,
      });

      // Log to NotificationLog (PRD §8 delivery status) using the parent's first school
      try {
        const firstStudent = await prisma.student.findFirst({
          where: { parentId: parent.id },
          select: { schoolId: true },
        });
        if (firstStudent) {
          await prisma.notificationLog.create({
            data: {
              schoolId: firstStudent.schoolId,
              recipient: parent.email,
              channel: "EMAIL",
              message: `[Portal OTP] Your School Portal OTP Code`,
              status: "SENT",
              sentAt: new Date(),
            },
          });
        }
      } catch (logErr) {
        logger.logger.warn(`[Parent OTP] Notification log skipped: ${logErr.message}`);
      }
    } else {
      logger.logger.warn(
        `[Parent OTP] No email on file for ${parent.name} (${parent.whatsappNo}) — OTP only returned in dev response.`
      );
    }

    return {
      message: `OTP sent via email for ${parent.name}. Valid for ${OTP.EXPIRY_MINUTES} minutes.`,
      parentName: parent.name,
      // DEV ONLY:
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    };
  }

  /**
   * Step 2: Parent verifies OTP → gets portal JWT.
   */
  async verifyParentOtp(whatsappNo, otp, req) {
    const parent = await authRepository.findParentByWhatsapp(whatsappNo);
    if (!parent) {
      throw ApiError.notFoundError("Parent account not found.");
    }

    // Blocking enforcement (spec §2.C) — blocked parents cannot log in.
    if (parent.isBlocked) {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    const otpRecord = await authRepository.findOtp(whatsappNo, "PARENT_LOGIN");
    if (!otpRecord) {
      throw ApiError.badRequestError(
        "No active OTP found. Please request a new one."
      );
    }

    if (otpRecord.attempts >= OTP.MAX_ATTEMPTS) {
      throw ApiError.badRequestError(
        "Too many failed attempts. Please request a new OTP."
      );
    }

    const inputHash = hashValue(otp);
    if (inputHash !== otpRecord.otpHash) {
      await authRepository.incrementOtpAttempts(otpRecord.id);
      const remaining = OTP.MAX_ATTEMPTS - otpRecord.attempts - 1;
      throw ApiError.badRequestError(
        `Incorrect OTP. ${remaining} attempt(s) remaining.`
      );
    }

    await authRepository.markOtpUsed(otpRecord.id);

    const token = signParentToken({
      parentId: parent.id,
      whatsappNo: parent.whatsappNo,
      tokenType: "parent",
    });

    auditService.record({
      actorId: parent.id,
      actorName: parent.name,
      actorRole: "PARENT",
      action: AUDIT_ACTIONS.PARENT_LOGIN,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: parent.id,
      entityName: parent.name,
      schoolId: parent.students?.[0]?.schoolId || null,
      ipAddress: req?.ip || null,
    });

    return {
      token,
      parent: ParentPortalDTO.toDTO(parent),
    };
  }

  /**
   * Direct Parent Portal Login (password-based, replaces OTP):
   * Parent enters School Code + WhatsApp/Phone number + shared school password.
   * Returns a parent portal JWT without any OTP dispatch.
   */
  async parentLogin({ schoolCode, phone, password }, req) {
    const parent = await authRepository.findParentBySchoolAndPhone(schoolCode, phone);

    if (!parent) {
      throw ApiError.unauthorizedError(
        "Invalid school code or phone number. Please verify your credentials."
      );
    }

    if (parent.isBlocked) {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    // Blocking enforcement — a blocked branch/org locks out its parents.
    const school = parent.students?.[0]?.school;
    if (!school || school.status === "BLOCKED" || school.organization?.status === "BLOCKED") {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }

    // Shared portal password — custom set ho to wahi, warna school code default.
    if (!(await verifyPortalPassword(school, password))) {
      throw ApiError.unauthorizedError(
        "Invalid school password. Please enter the correct school password."
      );
    }

    const token = signParentToken({
      parentId: parent.id,
      whatsappNo: parent.whatsappNo,
      tokenType: "parent",
    });

    auditService.record({
      actorId: parent.id,
      actorName: parent.name,
      actorRole: "PARENT",
      action: AUDIT_ACTIONS.PARENT_LOGIN,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: parent.id,
      entityName: parent.name,
      schoolId: parent.students?.[0]?.schoolId || null,
      ipAddress: req?.ip || null,
    });

    return {
      token,
      parent: ParentPortalDTO.toDTO(parent),
    };
  }

  // ──────────────────────────────────────────
  // STUDENT / PARENT PORTAL — Direct Login (Zero OTP)
  // ──────────────────────────────────────────

  /**
   * Direct Student/Parent Portal Login:
   * Student enters: School Code + Roll Number
   * System verifies student record and returns Portal Token directly!
   */
  async studentDirectLogin({ schoolCode, rollNumber, password }, req) {
    const student = await authRepository.findStudentByRollAndSchool(rollNumber, schoolCode);

    if (!student) {
      throw ApiError.unauthorizedError(
        "Invalid Roll Number or School Code. Please verify your credentials."
      );
    }

    if (student.status !== "ACTIVE") {
      throw ApiError.unauthorizedError("Student account is not active. Please contact school office.");
    }

    // Blocking enforcement (spec §2.A/§2.C) — blocked branch/org/student.
    this._assertStudentNotBlocked(student);

    // Shared portal password — same for all students of the school.
    if (!(await verifyPortalPassword(student.school, password))) {
      throw ApiError.unauthorizedError(
        "Invalid school password. Please enter the correct school password."
      );
    }

    const token = signStudentToken({
      studentId: student.id,
      schoolId: student.schoolId,
      tokenType: "student",
    });

    auditService.record({
      actorId: student.id,
      actorName: `${student.firstName} ${student.lastName}`.trim(),
      actorRole: "STUDENT",
      action: AUDIT_ACTIONS.STUDENT_LOGIN,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: student.id,
      entityName: `${student.firstName} ${student.lastName}`.trim(),
      organizationId: student.school?.organizationId || null,
      schoolId: student.schoolId,
      ipAddress: req?.ip || null,
    });

    return {
      token,
      student: StudentPortalDTO.toDTO(student),
    };
  }

  /**
   * Step 1: Student requests OTP.
   * Student can identify by:
   * 1. School Code + Roll Number (e.g. GULSHAN-01 + 104)
   * 2. Card ID (RFID card)
   */
  async requestStudentOtp({ schoolCode, rollNumber, identifierCode, cardId }) {
    let student = null;
    const targetCode = identifierCode || cardId;

    if (schoolCode && rollNumber) {
      student = await authRepository.findStudentByRollAndSchool(rollNumber, schoolCode);
    } else if (targetCode) {
      student = await authRepository.findStudentByIdentifierCode(targetCode);
    } else {
      throw ApiError.badRequestError("Please provide (schoolCode & rollNumber) OR identifierCode");
    }

    if (!student) {
      throw ApiError.notFoundError(
        "No active student record found matching the details provided."
      );
    }

    if (student.status !== "ACTIVE") {
      throw ApiError.unauthorizedError("Student account is not active.");
    }

    // Blocking enforcement — no OTP for blocked students/branches/orgs.
    this._assertStudentNotBlocked(student);

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiresAt = new Date(
      Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000
    );

    // Identifier key saved for lookup
    const identifier = student.identifierCode || `${student.school.code}:${student.rollNumber}`;
    const parentWhatsapp = student.parent?.whatsappNo;
    const parentEmail = student.parent?.email;

    await authRepository.saveOtp(identifier, "STUDENT_LOGIN", otpHash, expiresAt);

    // PRD §5 — OTP delivered to the parent's primary channel. WhatsApp API is
    // not yet affordable → email today, WhatsApp swap later.
    if (parentEmail) {
      await sendOtpEmail({
        to: parentEmail,
        recipientName: student.parent?.name || "Parent/Guardian",
        otp,
      }).catch((err) => {
        logger.logger.error(`[Student OTP] Email dispatch failed: ${err.message}`);
      });
    } else {
      logger.logger.warn(
        `[Student OTP] No parent email on file for ${student.firstName} ${student.lastName} — OTP not emailed.`
      );
    }

    return {
      message: `OTP generated for ${student.firstName} ${student.lastName}. (Sent to registered Parent email).`,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      schoolCode: student.school.code,
      // DEV ONLY:
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    };
  }

  /**
   * Step 2: Student verifies OTP using identifier + OTP.
   */
  async verifyStudentOtp({ identifier, schoolCode, rollNumber, otp }, req) {
    let lookupKey = identifier;
    if (schoolCode && rollNumber) {
      lookupKey = `${schoolCode.toUpperCase()}:${rollNumber}`;
    }

    let student = await authRepository.findStudentByIdentifierCode(lookupKey);
    if (!student && schoolCode && rollNumber) {
      student = await authRepository.findStudentByRollAndSchool(rollNumber, schoolCode);
    }

    if (!student) {
      throw ApiError.notFoundError("Student record not found.");
    }

    const otpRecord = await authRepository.findOtp(lookupKey, "STUDENT_LOGIN");

    if (!otpRecord) {
      throw ApiError.badRequestError(
        "No active OTP found. Please request a new one."
      );
    }

    if (otpRecord.attempts >= OTP.MAX_ATTEMPTS) {
      throw ApiError.badRequestError(
        "Too many failed attempts. Please request a new OTP."
      );
    }

    const inputHash = hashValue(otp);
    if (inputHash !== otpRecord.otpHash) {
      await authRepository.incrementOtpAttempts(otpRecord.id);
      const remaining = OTP.MAX_ATTEMPTS - otpRecord.attempts - 1;
      throw ApiError.badRequestError(
        `Incorrect OTP. ${remaining} attempt(s) remaining.`
      );
    }

    await authRepository.markOtpUsed(otpRecord.id);

    // Blocking enforcement — re-check right before issuing the token.
    this._assertStudentNotBlocked(student);

    const token = signStudentToken({
      studentId: student.id,
      schoolId: student.schoolId,
      tokenType: "student",
    });

    auditService.record({
      actorId: student.id,
      actorName: `${student.firstName} ${student.lastName}`.trim(),
      actorRole: "STUDENT",
      action: AUDIT_ACTIONS.STUDENT_LOGIN,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: student.id,
      entityName: `${student.firstName} ${student.lastName}`.trim(),
      organizationId: student.school?.organizationId || null,
      schoolId: student.schoolId,
      ipAddress: req?.ip || null,
    });

    return {
      token,
      student: StudentPortalDTO.toDTO(student),
    };
  }

  // ──────────────────────────────────────────
  // PORTAL — Profile Getters
  // ──────────────────────────────────────────

  /**
   * Get parent by parentId for the /me endpoint.
   */
  async getParentById(parentId) {
    try {
      const cached = await redis.get(`portal:parent:${parentId}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    const parent = await authRepository.findParentById(parentId);
    if (!parent) throw ApiError.notFoundError("Parent account not found.");
    const dto = ParentPortalDTO.toDTO(parent);
    try {
      await redis.setEx(`portal:parent:${parentId}`, 300, JSON.stringify(dto));
    } catch (_) {}
    return dto;
  }

  /**
   * Get student by studentId for the /me endpoint.
   */
  async getStudentById(studentId) {
    try {
      const cached = await redis.get(`portal:student:${studentId}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    const student = await authRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found.");
    const dto = StudentPortalDTO.toDTO(student);
    try {
      await redis.setEx(`portal:student:${studentId}`, 300, JSON.stringify(dto));
    } catch (_) {}
    return dto;
  }

  // ──────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────

  /**
   * Blocking enforcement shared by every student portal path (direct login,
   * OTP request, OTP verify). A blocked student, branch, or organization
   * always gets the standard message (spec §2.A/§2.C).
   */
  _assertStudentNotBlocked(student) {
    if (student.isBlocked) throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    if (student.school?.status === "BLOCKED") throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    if (student.school?.organization?.status === "BLOCKED") {
      throw ApiError.unauthorizedError(BLOCKED_MESSAGE);
    }
  }

  /**
   * Check that the requester can access the target user account.
   * SUPER_ADMIN → platform-wide (consistent with org CRUD endpoints, which
   *   are already accessible to every SUPER_ADMIN across all organizations)
   * ADMIN → must be same school
   * Others → forbidden
   */
  _assertCanAccessUser(requester, target) {
    if (requester.role === ROLES.SUPER_ADMIN) {
      return; // platform admins manage users across all organizations
    } else if (requester.role === ROLES.ADMIN) {
      if (target.schoolId !== requester.schoolId) {
        throw ApiError.forbiddenError(
          "You can only manage users within your school branch."
        );
      }
    } else {
      throw ApiError.forbiddenError(
        "You do not have permission to manage user accounts."
      );
    }
  }
}

export default new AuthService();
