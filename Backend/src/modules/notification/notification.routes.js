import { Router } from "express";
import jwt from "jsonwebtoken";
import notificationController from "./notification.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authenticateAnyPortal, authorize } from "../../middlewares/auth.middleware.js";
import ApiError from "../../lib/utils/ApiError.js";
import { ROLE_GROUPS } from "../../constants.js";
import { getDeliveryStatusSchema, listLogsSchema, listPortalSchema, removePortalSchema, sendFromSuperAdminSchema, markReadSchema } from "./notification.validation.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_school_erp_token";

const router = Router();

/**
 * Portal-aware auth for /portal/* endpoints. Accepts staff, parent AND
 * student portal tokens. For parent/student it normalizes req.portal into a
 * req.user shape (id/schoolId/role) that notification.portalService expects.
 */
const portalOrStaff = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorizedError("Authentication token missing."));
  }
  const token = header.split(" ")[1];
  let tokenType;
  try {
    tokenType = jwt.verify(token, JWT_SECRET).tokenType;
  } catch (err) {
    if (err.name === "TokenExpiredError") return next(ApiError.unauthorizedError("Session expired. Please log in again."));
    return next(ApiError.unauthorizedError("Invalid authentication token."));
  }

  if (tokenType === "staff") {
    return authenticate(req, res, next);
  }

  // Portl tokens (parent/student) → authenticateAnyPortal sets req.portal
  return authenticateAnyPortal(req, res, (err2) => {
    if (err2) return next(err2);
    if (!req.portal) return next(ApiError.unauthorizedError("Invalid token type."));
    req.user = {
      id: req.portal.id,
      role: req.portal.type.toUpperCase(),
      schoolId: req.portal.schoolId || null,
      organizationId: req.portal.organizationId || null,
    };
    return next();
  });
};

// ── Email delivery logs (existing) ──
router.get("/status", authenticate, authorize(ROLE_GROUPS.MANAGEMENT), validate(getDeliveryStatusSchema), notificationController.getDeliveryStatus);
router.get("/logs", authenticate, authorize(ROLE_GROUPS.ALL_STAFF), validate(listLogsSchema), notificationController.listLogs);

// ── Portal (in-app) notifications (STAFF + parent/student portal) ──
router.get("/portal", portalOrStaff, validate(listPortalSchema), notificationController.listPortal);
router.get("/portal/unread-count", portalOrStaff, notificationController.unreadCount);
router.post("/portal/mark-read", portalOrStaff, validate(markReadSchema), notificationController.markRead);
router.post("/portal/mark-all-read", portalOrStaff, notificationController.markAllRead);
router.post("/portal/delete", portalOrStaff, validate(removePortalSchema), notificationController.remove);

// ── Super Admin: send notification to org admin ──
router.post("/portal/send", authenticate, authorize(...ROLE_GROUPS.ORG_LEVEL), validate(sendFromSuperAdminSchema), notificationController.sendFromSuperAdmin);

export default router;
