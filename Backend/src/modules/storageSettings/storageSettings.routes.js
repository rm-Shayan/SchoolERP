import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import storageSettingsController from "./storageSettings.controller.js";

const router = Router();

// ─── Per-tenant Cloudinary (media storage) settings ─────────────────────────
// SUPER_ADMIN: kisi bhi org ke liye manage kar sakta hai.
// ADMIN: sirf apni organization ke liye.
router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

// GET  /api/v1/storage/settings?organizationId=
router.get("/settings", storageSettingsController.getStatus);

// PUT  /api/v1/storage/settings
router.put("/settings", storageSettingsController.upsert);

// DELETE /api/v1/storage/settings?organizationId=
router.delete("/settings", storageSettingsController.remove);

export default router;
