import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import redis from "../config/redis.js";
import ApiError from "../lib/utils/ApiError.js";
import { BLOCKED_MESSAGE } from "../constants.js";
import { setRequestOrganization } from "../lib/requestContext.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_school_erp_token";

// Auth snapshot cache — har request par DB user lookup skip karta hai (H1).
// Block/unblock/status changes apne aap token revoke karte hain (moderation
// service), isliye chhota TTL security ke liye safe hai.
const AUTH_CACHE_TTL = 300; // 5 min — heavy 3-table join skip hota hai, login redirect issue bhi fix

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  schoolId: true,
  organizationId: true,
  isActive: true,
  branchAccess: true,
  school: { select: { id: true, name: true, code: true, status: true, logoUrl: true } },
  organization: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
};

async function getCachedUser(userId) {
  try {
    const cached = await redis.get(`auth:user:${userId}`);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return null;
}

async function cacheUser(user) {
  try {
    await redis.setEx(`auth:user:${user.id}`, AUTH_CACHE_TTL, JSON.stringify(user));
  } catch (_) {}
}

/** Moderation/profile updates ke baad stale snapshot ko turant hatao. */
export async function invalidateUserCache(userId) {
  if (!userId) return;
  try {
    await redis.del(`auth:user:${userId}`);
  } catch (_) {}
}

/** Parent/student portal session snapshot (short TTL, portals poll heavily). */
export async function invalidateEntityCache(prefix, id) {
  if (!id) return;
  try {
    await redis.del(`${prefix}:${id}`);
  } catch (_) {}
}

async function cachedLookup(prefix, id, fetchFn) {
  try {
    const cached = await redis.get(`${prefix}:${id}`);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  const fresh = await fetchFn();
  if (fresh) {
    try {
      await redis.setEx(`${prefix}:${id}`, AUTH_CACHE_TTL, JSON.stringify(fresh));
    } catch (_) {}
  }
  return fresh;
}

// ==========================================
// STAFF AUTH MIDDLEWARE
// ==========================================

/**
 * authenticate — Verifies JWT and attaches req.user for all staff endpoints.
 * Works for all staff roles: SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorizedError("Authentication token missing or malformed. Include: Authorization: Bearer <token>"));
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorizedError("Access token has expired. Please refresh your token."));
      }
      return next(ApiError.unauthorizedError("Invalid authentication token."));
    }

    // This middleware is only for staff tokens
    if (decoded.tokenType !== "staff") {
      return next(ApiError.unauthorizedError("Invalid token type for this endpoint."));
    }

    const cached = await getCachedUser(decoded.userId);
    const user = cached || (await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: USER_SELECT,
    }));
    if (user && !cached) await cacheUser(user);

    if (!user) {
      return next(ApiError.unauthorizedError("User account not found. Please contact your administrator."));
    }

    if (!user.isActive) {
      return next(ApiError.unauthorizedError("Your account has been deactivated. Please contact your administrator."));
    }

    // Blocking enforcement — a blocked org/branch locks out every role under
    // it, including users who already hold a valid access token.
    if (
      user.organization?.status === "BLOCKED" ||
      user.school?.status === "BLOCKED"
    ) {
      return next(ApiError.unauthorizedError(BLOCKED_MESSAGE));
    }

    // Attach user context to request. The SCOPE is the JWT's claim — a
    // multi-branch admin who switched branches carries that branch in the
    // token; the DB row's `schoolId` stays their HOME branch (unchanged).
    // Fallback to the DB row only when the claim is missing (legacy tokens).
    const effectiveSchoolId =
      decoded.schoolId && user.branchAccess && Array.isArray(user.branchAccess)
        ? user.branchAccess.includes(decoded.schoolId) || decoded.schoolId === user.schoolId
          ? decoded.schoolId
          : user.schoolId
        : decoded.schoolId || user.schoolId;

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: effectiveSchoolId,
      organizationId: user.organizationId,
      school: user.school,
      organization: user.organization,
    };

    // ALS tenant context — storage.service deep layers isi se org resolve
    // karta hai (tenant Cloudinary creds ke liye).
    setRequestOrganization(user.organizationId);

    return next();
  } catch (error) {
    return next(ApiError.unauthorizedError("Authentication failed."));
  }
};

// ==========================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ==========================================

/**
 * authorize(...roles) — Restrict access to specific staff roles.
 *
 * Usage examples:
 *   router.get('/dashboard', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), handler)
 *   router.post('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), handler)
 *
 * Import ROLE_GROUPS from constants.js for convenient role groupings.
 */
export const authorize = (...allowedRoles) => {
  // Flatten in case ROLE_GROUPS arrays are spread in
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorizedError("You must be logged in."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbiddenError(
          `Access denied. Role '${req.user.role}' is not permitted to access this resource.`
        )
      );
    }

    return next();
  };
};

/**
 * authorizeOrgSelf — SUPER_ADMIN hamesha; ADMIN sirf apni organization ke liye
 * aur tab bhi jab organization ke sirf ek branch (school) ho. Multi-branch org
 * par ADMIN ko org-level edit SUPER_ADMIN se karwana hai.
 *
 * Route param `:id` organization id expect karta hai.
 */
export const authorizeOrgSelf = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorizedError("You must be logged in."));
    }

    if (req.user.role === "SUPER_ADMIN") return next();

    if (req.user.role === "ADMIN") {
      const targetOrgId = req.params.id;
      if (targetOrgId && targetOrgId === req.user.organizationId) {
        try {
          const schoolCount = await prisma.school.count({
            where: { organizationId: targetOrgId },
          });
          // Single-branch org: koi bhi ADMIN chal sakta hai.
          if (schoolCount <= 1) return next();

          // Multi-branch org: sirf default branch (org creation waqt bani
          // pehli school) ka ADMIN organization manage kar sakta hai.
          if (req.user.schoolId) {
            const defaultBranch = await prisma.school.findFirst({
              where: { organizationId: targetOrgId },
              orderBy: { createdAt: "asc" },
              select: { id: true },
            });
            if (defaultBranch && defaultBranch.id === req.user.schoolId) {
              return next();
            }
          }
        } catch (_) {
          /* fall through to 403 */
        }
      }
      return next(
        ApiError.forbiddenError(
          "Access denied. ADMIN can edit only their own organization's default branch. Other branches or multi-branch orgs require SUPER_ADMIN."
        )
      );
    }

    return next(
      ApiError.forbiddenError(
        `Access denied. Role '${req.user.role}' is not permitted to access this resource.`
      )
    );
  };
};

// ==========================================
// PARENT PORTAL MIDDLEWARE
// ==========================================

/**
 * authenticateParent — Verifies parent portal JWT.
 * Attaches req.parent with parentId and whatsappNo.
 *
 * Used on parent portal routes only.
 */
export const authenticateParent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorizedError("Parent portal token missing."));
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorizedError("Parent session has expired. Please request a new OTP."));
      }
      return next(ApiError.unauthorizedError("Invalid parent portal token."));
    }

    if (decoded.tokenType !== "parent") {
      return next(ApiError.unauthorizedError("Invalid token type for parent portal."));
    }

    // Verify parent still exists in DB
    const parent = await cachedLookup("auth:parent", decoded.parentId, () =>
      prisma.parent.findUnique({
        where: { id: decoded.parentId },
        select: { id: true, name: true, whatsappNo: true, isBlocked: true },
      })
    );

    if (!parent) {
      return next(ApiError.unauthorizedError("Parent account not found."));
    }

    if (parent.isBlocked) {
      return next(ApiError.unauthorizedError(BLOCKED_MESSAGE));
    }

    req.parent = {
      parentId: parent.id,
      name: parent.name,
      whatsappNo: parent.whatsappNo,
    };

    return next();
  } catch (error) {
    return next(ApiError.unauthorizedError("Parent portal authentication failed."));
  }
};

// ==========================================
// STUDENT PORTAL MIDDLEWARE
// ==========================================

/**
 * authenticateStudent — Verifies student portal JWT.
 * Attaches req.student with studentId and schoolId.
 *
 * Used on student portal routes only.
 */
export const authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorizedError("Student portal token missing."));
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorizedError("Student session has expired. Please request a new OTP."));
      }
      return next(ApiError.unauthorizedError("Invalid student portal token."));
    }

    if (decoded.tokenType !== "student") {
      return next(ApiError.unauthorizedError("Invalid token type for student portal."));
    }

    // Verify student still exists and is active
    const student = await cachedLookup("auth:student", decoded.studentId, () =>
      prisma.student.findUnique({
        where: { id: decoded.studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          schoolId: true,
          status: true,
          isBlocked: true,
          school: {
            select: {
              status: true,
              organization: { select: { status: true } },
            },
          },
        },
      })
    );

    if (!student) {
      return next(ApiError.unauthorizedError("Student account not found."));
    }

    if (student.status !== "ACTIVE") {
      return next(ApiError.unauthorizedError("Student account is inactive."));
    }

    if (
      student.isBlocked ||
      student.school?.status === "BLOCKED" ||
      student.school?.organization?.status === "BLOCKED"
    ) {
      return next(ApiError.unauthorizedError(BLOCKED_MESSAGE));
    }

    req.student = {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`,
      schoolId: student.schoolId,
    };

    return next();
  } catch (error) {
    return next(ApiError.unauthorizedError("Student portal authentication failed."));
  }
};

// ==========================================
// ANY PORTAL AUTH (parent OR student)
// ==========================================

/**
 * authenticateAnyPortal — accepts both parent and student portal JWTs.
 * Attaches req.portal = { type, id, name, schoolId } on success.
 * Use on /portal/* routes that serve both parent and student views.
 */
export const authenticateAnyPortal = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorizedError("Portal token missing."));
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorizedError("Session expired. Please log in again."));
      }
      return next(ApiError.unauthorizedError("Invalid portal token."));
    }

    if (decoded.tokenType === "parent") {
      const parent = await cachedLookup("auth:parent", decoded.parentId, () =>
        prisma.parent.findUnique({
          where: { id: decoded.parentId },
          select: { id: true, name: true, whatsappNo: true, isBlocked: true },
        })
      );
      if (!parent) return next(ApiError.unauthorizedError("Parent account not found."));
      if (parent.isBlocked) return next(ApiError.unauthorizedError(BLOCKED_MESSAGE));

      // Resolve child sectionIds for scoped queries
      const children = await prisma.student.findMany({
        where: { parentId: parent.id, status: "ACTIVE" },
        select: { id: true, sectionId: true, schoolId: true, firstName: true, lastName: true },
      });
      if (!children.length) return next(ApiError.unauthorizedError("No active children linked."));

      req.portal = {
        type: "parent",
        id: parent.id,
        name: parent.name,
        children,
        schoolId: children[0].schoolId,
        sectionIds: [...new Set(children.map((c) => c.sectionId))],
        studentIds: children.map((c) => c.id),
      };
      return next();
    }

    if (decoded.tokenType === "student") {
      const student = await cachedLookup("auth:student", decoded.studentId, () =>
        prisma.student.findUnique({
          where: { id: decoded.studentId },
          select: {
            id: true, firstName: true, lastName: true,
            schoolId: true, sectionId: true, status: true, isBlocked: true,
            school: { select: { status: true, organization: { select: { status: true } } } },
          },
        })
      );
      if (!student) return next(ApiError.unauthorizedError("Student account not found."));
      if (student.status !== "ACTIVE") return next(ApiError.unauthorizedError("Student account is inactive."));
      if (student.isBlocked || student.school?.status === "BLOCKED" || student.school?.organization?.status === "BLOCKED") {
        return next(ApiError.unauthorizedError(BLOCKED_MESSAGE));
      }

      req.portal = {
        type: "student",
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        schoolId: student.schoolId,
        sectionIds: [student.sectionId],
        studentIds: [student.id],
      };
      return next();
    }

    return next(ApiError.unauthorizedError("Invalid token type."));
  } catch (error) {
    return next(ApiError.unauthorizedError("Portal authentication failed."));
  }
};

// ==========================================
// SCOPE ISOLATION MIDDLEWARE
// ==========================================

/**
 * assertSameSchool — Ensures the target resource's schoolId matches the requester's schoolId.
 * Use this on routes where resource scoping matters (ADMIN can't touch other branches).
 *
 * Usage: router.get('/schools/:schoolId/data', authenticate, assertSameSchool, handler)
 */
export const assertSameSchool = (req, res, next) => {
  const { schoolId } = req.params;

  // SUPER_ADMIN bypasses this check — they see all branches
  if (req.user.role === "SUPER_ADMIN") return next();

  if (req.user.schoolId !== schoolId) {
    return next(
      ApiError.forbiddenError(
        "You can only access data within your own school branch."
      )
    );
  }

  return next();
};
