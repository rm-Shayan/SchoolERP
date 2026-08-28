import { Router } from "express";
import auditController from "./audit.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { listAuditLogsSchema } from "./audit.validation.js";

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/audit-logs
 * Activity log — every privileged action across the platform.
 * SUPER_ADMIN sees everything, ADMIN sees their own branch.
 */
router.get(
  "/",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(listAuditLogsSchema),
  auditController.listLogs
);

export default router;
