import { Router } from "express";
import moderationController from "./moderation.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  blockOrganizationSchema,
  unblockOrganizationSchema,
  blockSchoolSchema,
  unblockSchoolSchema,
  blockUserSchema,
  unblockUserSchema,
  blockStudentSchema,
  unblockStudentSchema,
  blockParentSchema,
  unblockParentSchema,
} from "./moderation.validation.js";

const router = Router();
router.use(authenticate);

// ── Organization (Super Admin governance) ──────────────────────
router.post(
  "/organizations/:id/block",
  authorize(ROLE_GROUPS.ORG_LEVEL),
  validate(blockOrganizationSchema),
  moderationController.blockOrganization
);
router.post(
  "/organizations/:id/unblock",
  authorize(ROLE_GROUPS.ORG_LEVEL),
  validate(unblockOrganizationSchema),
  moderationController.unblockOrganization
);

// ── Branch / School (Super Admin governance) ───────────────────
router.post(
  "/schools/:id/block",
  authorize(ROLE_GROUPS.ORG_LEVEL),
  validate(blockSchoolSchema),
  moderationController.blockSchool
);
router.post(
  "/schools/:id/unblock",
  authorize(ROLE_GROUPS.ORG_LEVEL),
  validate(unblockSchoolSchema),
  moderationController.unblockSchool
);

// ── User / staff (Super Admin any branch, Branch Admin own branch) ─
router.post(
  "/users/:id/block",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(blockUserSchema),
  moderationController.blockUser
);
router.post(
  "/users/:id/unblock",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(unblockUserSchema),
  moderationController.unblockUser
);

// ── Student (Management) ────────────────────────────────────────
router.post(
  "/students/:id/block",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(blockStudentSchema),
  moderationController.blockStudent
);
router.post(
  "/students/:id/unblock",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(unblockStudentSchema),
  moderationController.unblockStudent
);

// ── Parent (Management) ─────────────────────────────────────────
router.post(
  "/parents/:id/block",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(blockParentSchema),
  moderationController.blockParent
);
router.post(
  "/parents/:id/unblock",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(unblockParentSchema),
  moderationController.unblockParent
);

export default router;
