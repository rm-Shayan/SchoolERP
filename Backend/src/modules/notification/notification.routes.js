import { Router } from "express";
import notificationController from "./notification.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { getDeliveryStatusSchema, listLogsSchema, listPortalSchema, removePortalSchema, sendFromSuperAdminSchema, markReadSchema } from "./notification.validation.js";

const router = Router();
router.use(authenticate);

// ── Email delivery logs (existing) ──
router.get("/status", authorize(ROLE_GROUPS.MANAGEMENT), validate(getDeliveryStatusSchema), notificationController.getDeliveryStatus);
router.get("/logs", authorize(ROLE_GROUPS.ALL_STAFF), validate(listLogsSchema), notificationController.listLogs);

// ── Portal (in-app) notifications ──
router.get("/portal", authorize(ROLE_GROUPS.ALL_STAFF), validate(listPortalSchema), notificationController.listPortal);
router.get("/portal/unread-count", authorize(ROLE_GROUPS.ALL_STAFF), notificationController.unreadCount);
router.post("/portal/mark-read", authorize(ROLE_GROUPS.ALL_STAFF), validate(markReadSchema), notificationController.markRead);
router.post("/portal/mark-all-read", authorize(ROLE_GROUPS.ALL_STAFF), notificationController.markAllRead);
router.post("/portal/delete", authorize(ROLE_GROUPS.ALL_STAFF), validate(removePortalSchema), notificationController.remove);

// ── Super Admin: send notification to org admin ──
router.post("/portal/send", authorize(...ROLE_GROUPS.ORG_LEVEL), validate(sendFromSuperAdminSchema), notificationController.sendFromSuperAdmin);

export default router;
