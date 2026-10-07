import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import emailTemplatesController from "./emailTemplates.controller.js";

const router = Router();

// ─── Org-scoped customizable mail templates ─────────────────────────────────
// Rewriting what every branch mails out is an org-level action: only the
// organization owner (or a super admin) may touch these.
router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

// GET    /api/v1/email-templates?organizationId=
router.get("/", emailTemplatesController.list);

// POST   /api/v1/email-templates/:key/preview
router.post("/:key/preview", emailTemplatesController.preview);

// GET    /api/v1/email-templates/:key
router.get("/:key", emailTemplatesController.getOne);

// PUT    /api/v1/email-templates/:key
router.put("/:key", emailTemplatesController.upsert);

// DELETE /api/v1/email-templates/:key
router.delete("/:key", emailTemplatesController.reset);

export default router;
