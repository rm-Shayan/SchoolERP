import { Router } from "express";
import organizationController from "./organization.controller.js";
import { authenticate, authorize, authorizeOrgSelf } from "../../middlewares/auth.middleware.js";

const router = Router();

// SUPER_ADMIN only — bulk/create/list/overview/export/import/logo/dashboard
const adminOnly = [authenticate, authorize("SUPER_ADMIN")];
// Per-org routes: SUPER_ADMIN ya single-branch org ka ADMIN (apni hi org)
const orgSelf = [authenticate, authorizeOrgSelf()];

// ─── PUBLIC: org landing page data (/o/:slug) — koi auth nahi ───────────────
router.get("/public/slugs", organizationController.publicSlugs);
router.get("/public/:slug", organizationController.getPublicBySlug);

// ─── BULK IMPORT (must be before /:id to avoid route conflict) ────────────────
router.post(
  "/import-excel",
  ...adminOnly,
  organizationController.uploadMiddleware,
  organizationController.importExcel
);

// ─── IMPORT TEMPLATE (must be before /:id to avoid route conflict) ────────────
router.get(
  "/import-template",
  ...adminOnly,
  organizationController.downloadImportTemplate
);

// ─── LOGO UPLOAD (before /:id to avoid route conflict) ───────────────────────
router.post(
  "/logo",
  ...adminOnly,
  organizationController.logoUploadMiddleware,
  organizationController.uploadLogo
);

// ─── CRUD ────────────────────────────────────────────────────────────────────
router.post(
  "/",
  ...adminOnly,
  organizationController.create
);

router.get(
  "/",
  ...adminOnly,
  organizationController.list
);

// ─── OVERVIEW (must be before /:id to avoid route conflict) ────────────────
router.get(
  "/overview",
  ...adminOnly,
  organizationController.overview
);

// ─── HEALTH AUDIT (must be before /:id to avoid route conflict) ─────────
router.get(
  "/health",
  ...adminOnly,
  organizationController.health
);

// ─── EXPORT (must be before /:id to avoid route conflict) ────────────────
router.get(
  "/export",
  ...adminOnly,
  organizationController.exportExcel
);

// ─── DASHBOARD (must be before /:id to avoid route conflict) ────────────────
router.get(
  "/:id/dashboard",
  ...adminOnly,
  organizationController.dashboard
);

router.get(
  "/:id",
  ...orgSelf,
  organizationController.getById
);

router.patch(
  "/:id",
  ...orgSelf,
  organizationController.update
);

router.delete(
  "/:id",
  ...orgSelf,
  organizationController.remove
);

export default router;

