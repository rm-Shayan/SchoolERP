import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import xlsx from "xlsx";
import prisma from "../../config/db.js";
import authRepository from "./repository.js";
import { UserResponseDTO, ParentPortalDTO, StudentPortalDTO } from "./auth.dto.js";
import ApiError from "../../lib/utils/ApiError.js";
import { ROLES, OTP, JWT, BLOCKED_MESSAGE } from "../../constants.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import organizationService from "../organization/organization.service.js";
import storageService from "../../services/storage.service.js";
import { staffImportQueue } from "../../jobs/queues/staffImport.queue.js";
import { sendEmail, sendOtpEmail } from "../../services/email.service.js";
import { staffCredentialsEmail } from "../../services/email.templates.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { buildCsv } from "../../lib/utils/csv.js";
import { queueEmail } from "../../services/emailOutbox.js";
import Logger from "../../lib/utils/logger.js";
import redis from "../../config/redis.js";

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
  async login({ email, username, phone, schoolCode, password }) {
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

    // Default fallback: If password matches School Code (for newly imported staff without custom password set)
    if (!isMatch && schoolCode && password.trim().toUpperCase() === schoolCode.trim().toUpperCase()) {
      isMatch = true;
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

    await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);

    // Delivery cycle: the org is "delivered" (SETUP_PENDING → ACTIVE) on the
    // FIRST successful login — no earlier. Blocked orgs never reach this point.
    if (user.organization?.status === "SETUP_PENDING") {
      await organizationService.markDeliveredOnLogin(user);
      user.organization.status = "ACTIVE"; // reflect in this response's DTO
    }

    // Activity Log: successful staff login
    auditService.record({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGIN,
      entityType: AUDIT_ENTITY_TYPES.AUTH,
      entityId: user.id,
      entityName: user.name,
      organizationId: user.organizationId,
      schoolId: sessionUser.schoolId,
      details: JSON.stringify({ loginId: identifier || email }),
    });

    await attachAccessibleBranches(sessionUser, user);

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

  /**
   * Parse an uploaded Excel file for staff and queue a bulk import job.
   */
  async importStaffExcel(fileBuffer, requester) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError("Excel sheet is empty");
    }

    const staffMembers = rawRows
      .map((row) => ({
        name: row.Name || row.name || row["Staff Name"],
        email: row.Email || row.email || row["Email Address"],
        phone: row.Phone || row.phone || row["Phone Number"],
        role: row.Role || row.role || row["Staff Role"],
        schoolId: row.SchoolId || row.schoolId || row["School ID"],
      }))
      .filter((s) => s.name && s.email && s.role);

    if (staffMembers.length === 0) {
      throw ApiError.badRequestError(
        "No valid staff rows found. Ensure columns 'Name', 'Email', and 'Role' exist."
      );
    }

    const job = await staffImportQueue.add("import-staff", {
      staffMembers,
      organizationId: requester.organizationId,
      requesterSchoolId: requester.schoolId,
      requesterRole: requester.role,
    });

    return { jobId: job.id, totalRows: staffMembers.length };
  }

  /** .xlsx template matching the columns importStaffExcel expects. */
  buildImportTemplate() {
    const rows = [
      { Name: "Mr. Ahmed Khan", Email: "ahmed@school.edu", Phone: "03001234567", Role: "TEACHER" },
      { Name: "Miss Sana Malik", Email: "sana.malik@school.edu", Phone: "03011223344", Role: "RECEPTIONIST" },
    ];
    const sheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "Staff");
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  // ──────────────────────────────────────────
  // USER MANAGEMENT (RBAC)
  // ──────────────────────────────────────────

  /**
   * Create a new staff user.
   *
   * Rules:
   * - SUPER_ADMIN can create any role (except SUPER_ADMIN) in their org
   * - ADMIN can create branch-level staff only within their own school
   */
  async createUser(requester, data) {
    const allowedRoles = CREATABLE_ROLES_BY[requester.role];
    if (!allowedRoles) {
      throw ApiError.forbiddenError(
        "You do not have permission to create user accounts."
      );
    }

    if (!allowedRoles.includes(data.role)) {
      throw ApiError.forbiddenError(
        `You cannot create a user with role '${data.role}'.`
      );
    }

    // Check email uniqueness
    const existing = await authRepository.findByEmailRaw(data.email);
    if (existing) {
      throw ApiError.badRequestError(
        "A user with this email already exists."
      );
    }

    // Scope assignment
    let organizationId = null;
    let schoolId = null;

    if (requester.role === ROLES.SUPER_ADMIN) {
      // Platform SUPER_ADMIN creates users; schoolId optional (branch staff)
      schoolId = data.schoolId || null;

      // Branch-level roles MUST have a schoolId
      if (data.role !== ROLES.SUPER_ADMIN && !schoolId) {
        throw ApiError.badRequestError(
          "A school (branch) must be specified for branch-level staff."
        );
      }
      if (schoolId) {
        // Platform SUPER_ADMIN (organizationId null) → derive org from the branch,
        // so the created user is correctly scoped to the school's organization.
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: { organizationId: true },
        });
        if (!school) {
          throw ApiError.notFoundError("School not found.");
        }
        organizationId = school.organizationId;
      }
    } else if (requester.role === ROLES.ADMIN) {
      // ADMIN can only create users for their own school
      organizationId = requester.organizationId;
      schoolId = requester.schoolId;
    }

    // Shared school password: agar password nahi diya → school code hi password
    // (sab staff/students/parents ka same password = school code).
    let schoolCode = null;
    let schoolLogoUrl = null;
    let orgLogoUrl = null;
    let emailOrgName = null;
    let emailOrgSlug = null;
    let emailThemeColor = null;
    if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { code: true, logoUrl: true, themeColor: true, organizationId: true },
      });
      schoolCode = school?.code || null;
      schoolLogoUrl = school?.logoUrl || null;
      emailThemeColor = school?.themeColor || null;
      if (school?.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: school.organizationId },
          select: { logoUrl: true, slug: true, name: true, themeColor: true },
        });
        orgLogoUrl = org?.logoUrl || null;
        emailOrgName = org?.name || null;
        emailOrgSlug = org?.slug || null;
      }
    } else if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { logoUrl: true, slug: true, name: true, themeColor: true },
      });
      orgLogoUrl = org?.logoUrl || null;
      emailOrgName = org?.name || null;
      emailOrgSlug = org?.slug || null;
      emailThemeColor = org?.themeColor || null;
    }
    const sharedPassword = data.password || schoolCode || "School@123";
    const hashed = await bcrypt.hash(sharedPassword, 12);

    // Auto-generate System Staff Username / ID if not provided (e.g. STF-8492)
    const generatedUsername = data.username || `STF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = await authRepository.createUser({
      name: data.name,
      username: generatedUsername,
      email: data.email,
      password: hashed,
      phone: data.phone || null,
      role: data.role,
      organizationId,
      schoolId,
    });

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.CREATE_STAFF,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: newUser.id,
      entityName: newUser.name,
      organizationId,
      schoolId,
      details: JSON.stringify({ role: newUser.role, username: generatedUsername }),
    });

    // Portal notification — branch feed me staff creation dikhe.
    portalNotificationService.create({
      schoolId: schoolId || undefined,
      organizationId: organizationId || undefined,
      senderId: requester.id,
      senderName: requester.name,
      title: "STAFF_CREATED",
      body: `New ${newUser.role} account created: ${newUser.name} (${generatedUsername}).`,
      category: "STAFF",
      refType: "STAFF_CREATED",
      refId: newUser.id,
      link: "/staff",
    }).catch(() => {});

    // Send Login Credentials Notification via BullMQ Queue (non-blocking).
    // Slug-based branded links: /login?org={slug} + /o/{slug} root page.
    const mail = staffCredentialsEmail({
      name: newUser.name,
      role: newUser.role,
      username: generatedUsername,
      email: data.email,
      password: sharedPassword,
      schoolCode,
      orgName: emailOrgName,
      orgSlug: emailOrgSlug,
      logoUrl: schoolLogoUrl || orgLogoUrl,
      themeColor: emailThemeColor,
    });
    await queueEmail({
      to: data.email,
      ...mail,
      priority: "CRITICAL",
      organizationId,
      schoolId: schoolId || undefined,
    });

    return UserResponseDTO.toDTO(newUser);
  }

  /**
   * Create demo/sample staff for a branch (normal school behaviour demo).
   * Creates a few teachers + a receptionist with the shared school password
   * and assigns the first teachers as class teachers of existing classes.
   * Idempotent — existing emails are skipped.
   */
  async createSampleStaff(requester) {
    const schoolId = requester.schoolId;
    if (!schoolId) {
      throw ApiError.badRequestError("Sample staff are created per branch.");
    }
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, code: true, name: true },
    });
    if (!school) throw ApiError.notFoundError("School not found");

    const sharedPassword = school.code || "School@123";
    const hashed = await bcrypt.hash(sharedPassword, 12);

    const sample = [
      { name: "Miss Ayesha Khan", email: "ayesha.khan@school.edu", role: ROLES.TEACHER },
      { name: "Mr. Bilal Ahmed", email: "bilal.ahmed@school.edu", role: ROLES.TEACHER },
      { name: "Mrs. Sana Malik", email: "sana.malik@school.edu", role: ROLES.TEACHER },
      { name: "Mr. Farhan Ali", email: "farhan.ali@school.edu", role: ROLES.RECEPTIONIST },
    ];

    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      take: sample.length,
      select: { id: true, name: true },
    });

    let created = 0;
    const results = [];
    for (let i = 0; i < sample.length; i++) {
      const s = sample[i];
      const existing = await prisma.user.findUnique({ where: { email: s.email } });
      if (existing) continue;
      const username = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
      const user = await prisma.user.create({
        data: {
          name: s.name,
          username,
          email: s.email,
          password: hashed,
          role: s.role,
          organizationId: requester.organizationId,
          schoolId,
        },
      });
      created++;
      const klass = classes[i];
      let assignment = null;
      if (s.role === ROLES.TEACHER && klass) {
        assignment = await prisma.teacherAssignment.upsert({
          where: {
            teacherId_classId_subjectId_sectionId: {
              teacherId: user.id,
              classId: klass.id,
              subjectId: null,
              sectionId: null,
            },
          },
          update: {},
          create: {
            teacherId: user.id,
            classId: klass.id,
            subjectId: null,
            sectionId: null,
          },
        });
      }
      results.push({
        name: user.name,
        email: user.email,
        username,
        role: user.role,
        classTeacher: assignment ? klass.name : null,
      });
    }

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.CREATE_STAFF,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: schoolId,
      entityName: school.name,
      organizationId: requester.organizationId,
      schoolId,
      details: JSON.stringify({ mode: "sample", created }),
    });

    return { created, password: sharedPassword, items: results };
  }

  /**
   * List users.
   * - SUPER_ADMIN sees all users in the organization (all branches)
   * - ADMIN sees only users in their school branch
   */
  async listUsers(requester, { page = 1, pageSize = 50 } = {}) {
    let result;

    if (requester.role === ROLES.SUPER_ADMIN) {
      result = await authRepository.findUsersByOrganization(
        requester.organizationId,
        { page, pageSize }
      );
    } else if (requester.role === ROLES.ADMIN) {
      result = await authRepository.findUsersBySchool(requester.schoolId, {
        page,
        pageSize,
      });
      // Branch admin (Principal) khud staff list mein nahi dikhta — org create
      // ke waqt assign hua tha, wo "Staff" nahi hai. Sirf staff roles dikhao.
      result.items = result.items.filter((u) => u.role !== ROLES.ADMIN);
      result.total = result.items.length;
    } else {
      throw ApiError.forbiddenError(
        "You do not have permission to view user accounts."
      );
    }

    return {
      items: result.items.map(UserResponseDTO.toDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  }

  /**
   * Export staff as Excel (.xlsx) for download.
   * SUPER_ADMIN → all org users; ADMIN → own branch staff.
   */
  async exportStaffExcel(requester) {
    const userResult = requester.role === ROLES.SUPER_ADMIN
      ? await authRepository.findUsersByOrganization(requester.organizationId, { pageSize: 10000 })
      : await authRepository.findUsersBySchool(requester.schoolId, { pageSize: 10000 });
    const users = userResult.items;

    const rows = users
      .filter((u) => u.role !== ROLES.SUPER_ADMIN)
      .map((u) => ({
        Name: u.name,
        Email: u.email,
        Phone: u.phone || "",
        Role: u.role,
        Username: u.username || "",
        Status: u.isActive ? "Active" : "Inactive",
        Branch: u.school?.name || "",
        Created: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
      }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Staff");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Platform-wide user directory for the Super Admin console.
   * Server-side filters + pagination; stats global counts hain (page-scoped nahi).
   */
  async listAllUsersPlatform(requester, { page = 1, pageSize = 50, search, role, isActive, hasBlockReason, organizationId } = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbiddenError(
        "Only Super Admins can view the platform-wide user directory."
      );
    }

    const [result, stats] = await Promise.all([
      authRepository.findAllUsersPlatform({ page, pageSize, search, role, isActive, hasBlockReason, organizationId }),
      authRepository.platformUserStats(),
    ]);

    return {
      stats,
      items: result.items.map(UserResponseDTO.toDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  }

  /**
   * CSV export — current filters ke mutabiq saare platform users
   * (frontend ka client-side export 1000+ rows pe UI freeze karta tha).
   */
  async exportAllUsersPlatform(requester, filters = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbiddenError("Only Super Admins can export the user directory.");
    }

    const { items } = await authRepository.findAllUsersPlatform({ ...filters, page: 1, pageSize: 10000 });

    return buildCsv(
      ["Name", "Email", "Role", "Organization", "Branch", "Status", "Block Reason", "Joined"],
      items.map((u) => [
        u.name, u.email, u.role,
        u.organization?.name, u.school?.name,
        u.isActive ? "Active" : "Blocked", u.blockedReason,
        new Date(u.createdAt).toLocaleDateString("en-PK"),
      ])
    );
  }

  /**
   * Get a single user by ID, with scope checks.
   */
  async getUserById(requester, targetId) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");

    this._assertCanAccessUser(requester, target);
    return UserResponseDTO.toDTO(target);
  }

  /**
   * Update a user (name, phone, role, isActive).
   * Cannot change email or password here — separate endpoints for those.
   */
  async updateUser(requester, targetId, data) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");

    this._assertCanAccessUser(requester, target);

    // If trying to change role, validate allowed roles
    if (data.role) {
      const allowedRoles = CREATABLE_ROLES_BY[requester.role];
      if (!allowedRoles || !allowedRoles.includes(data.role)) {
        throw ApiError.forbiddenError(
          `You cannot assign role '${data.role}'.`
        );
      }
    }

    // Strip protected fields from update data
    const { password, email, organizationId, schoolId, ...safeData } = data;

    const updated = await authRepository.updateUser(targetId, safeData);

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.UPDATE_STAFF,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId,
      entityName: target.name,
      organizationId: target.organizationId,
      schoolId: target.schoolId,
      details: JSON.stringify(Object.keys(safeData)),
    });

    return UserResponseDTO.toDTO(updated);
  }

  /**
   * Soft-delete (deactivate) a user.
   */
  async deactivateUser(requester, targetId, reason) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");

    this._assertCanAccessUser(requester, target);

    if (targetId === requester.id) {
      throw ApiError.badRequestError("You cannot deactivate your own account.");
    }

    await authRepository.revokeAllRefreshTokens(targetId);
    const updated = await authRepository.updateUser(targetId, {
      isActive: false,
    });

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.DEACTIVATE_STAFF,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId,
      entityName: target.name,
      organizationId: target.organizationId,
      schoolId: target.schoolId,
      ...(reason ? { details: JSON.stringify({ reason }) } : {}),
    });

    return UserResponseDTO.toDTO(updated);
  }

  /**
   * Reactivate a previously deactivated user.
   */
  async reactivateUser(requester, targetId) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    const updated = await authRepository.updateUser(targetId, {
      isActive: true,
    });

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.REACTIVATE_STAFF,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId,
      entityName: target.name,
      organizationId: target.organizationId,
      schoolId: target.schoolId,
    });

    return UserResponseDTO.toDTO(updated);
  }

  /**
   * Admin resets a user's password (generates a temp password, user must change on next login)
   */
  async adminResetPassword(requester, targetId, newPassword) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);

    const hashed = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(targetId, { password: hashed });
    await authRepository.revokeAllRefreshTokens(targetId);

    auditService.record({
      actorId: requester.id,
      actorName: requester.name,
      actorRole: requester.role,
      action: AUDIT_ACTIONS.RESET_STAFF_PASSWORD,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId,
      entityName: target.name,
      organizationId: target.organizationId,
      schoolId: target.schoolId,
    });

    return true;
  }

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
        organizationId: user.organizationId || undefined,
        schoolId: user.schoolId || undefined,
        subject: "Your SchoolERP account - new password",
        html: `
          <p>Hello <b>${user.name}</b>,</p>
          <p>A new password was requested for your account.</p>
          <p style="font-size:18px;font-weight:bold;letter-spacing:1px;">${tempPassword}</p>
          <p>Please sign in with this password. You can change it later from Settings → Security.</p>
        `,
        text: `Your new SchoolERP password: ${tempPassword}`,
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
  async verifyParentOtp(whatsappNo, otp) {
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
  async parentLogin({ schoolCode, phone, password }) {
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
  async studentDirectLogin({ schoolCode, rollNumber, password }) {
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
  async verifyStudentOtp({ identifier, schoolCode, rollNumber, otp }) {
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
    const parent = await authRepository.findParentById(parentId);
    if (!parent) throw ApiError.notFoundError("Parent account not found.");
    return ParentPortalDTO.toDTO(parent);
  }

  /**
   * Get student by studentId for the /me endpoint.
   */
  async getStudentById(studentId) {
    const student = await authRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found.");
    return StudentPortalDTO.toDTO(student);
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
