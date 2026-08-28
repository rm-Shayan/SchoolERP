import { Router } from "express";
import schoolController from "./school.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// School management routes
// GET /schools/branding — PUBLIC (used by the login screen for dynamic org branding)
router.get("/branding", schoolController.branding);

// Branch creation = platform/org-level decision — SUPER_ADMIN only.
// (Branch principal ko apni branch ke alawa doosri branch banane ka koi
// kaam nahi — wo power pehle ADMIN ko bhi thi, ab sirf platform owner ko.)
router.post("/", authenticate, authorize("SUPER_ADMIN"), schoolController.create);
router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN"), schoolController.list);

// ─── BULK IMPORT (must be before /:id to avoid route conflict) ───────────────
router.post(
  "/import-excel",
  authenticate,
  authorize("SUPER_ADMIN"),
  schoolController.uploadMiddleware,
  schoolController.importExcel
);

// ─── EXPORT (must be before /:id to avoid route conflict) ───────────────
router.get(
  "/export",
  authenticate,
  authorize("SUPER_ADMIN"),
  schoolController.exportExcel
);

// ─── IMPORT TEMPLATE (must be before /:id to avoid route conflict) ───────
router.get(
  "/import-template",
  authenticate,
  authorize("SUPER_ADMIN"),
  schoolController.downloadImportTemplate
);

// ─── LOGO UPLOAD (must be before /:id to avoid route conflict) ───────────────────────
router.post(
  "/logo",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  schoolController.logoUploadMiddleware,
  schoolController.uploadLogo
);

router.get("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN"), schoolController.getById);
router.patch("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN"), schoolController.update);

// ─── Shared parent/student portal password (branch admin apni branch ka) ────
// GET    /schools/:id/portal-password → status (custom set hai ya default code)
// PUT    /schools/:id/portal-password → { password } set/update
// DELETE /schools/:id/portal-password → reset to default (school code)
router.get(
  "/:id/portal-password",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  schoolController.portalPasswordStatus
);
router.put(
  "/:id/portal-password",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  schoolController.setPortalPassword
);
router.delete(
  "/:id/portal-password",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  schoolController.resetPortalPassword
);

// ─── Branch admin re-assignment (SUPER_ADMIN only) ──────────────────────────
router.patch(
  "/:id/admin",
  authenticate,
  authorize("SUPER_ADMIN"),
  schoolController.assignAdmin
);

router.delete("/:id", authenticate, authorize("SUPER_ADMIN"), schoolController.remove);


export default router;
