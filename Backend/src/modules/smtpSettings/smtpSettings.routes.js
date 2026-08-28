import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import smtpSettingsController from "./smtpSettings.controller.js";

const router = Router();

// ─── Per-tenant SMTP (outgoing mail) settings ────────────────────────────────
// SUPER_ADMIN: kisi bhi org/branch ke liye manage kar sakta hai.
// ADMIN (branch principal): sirf apni org ka default aur apni branch ka override.
router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

// GET  /api/v1/smtp/settings?organizationId=&schoolId=
router.get("/settings", smtpSettingsController.getStatus);

// PUT  /api/v1/smtp/settings
router.put("/settings", smtpSettingsController.upsert);

// DELETE /api/v1/smtp/settings?organizationId=&schoolId=
router.delete("/settings", smtpSettingsController.remove);

// POST /api/v1/smtp/settings/test-send
router.post("/settings/test-send", smtpSettingsController.testSend);

export default router;
