import { Router } from "express";
import auditController from "./audit.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { listAuditLogsSchema } from "./audit.validation.js";

const router = Router();
router.use(authenticate);

router.get(
  "/export",
  authorize(ROLE_GROUPS.MANAGEMENT),
  auditController.exportCsv
);

router.get(
  "/",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(listAuditLogsSchema),
  auditController.listLogs
);

export default router;
