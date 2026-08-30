import { Router } from "express";
import conductController from "./conduct.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  createRemarkSchema,
  listRemarksByStudentSchema,
  listRemarksBySectionSchema,
  getRemarkSchema,
  updateRemarkSchema,
  deleteRemarkSchema,
  listRemarksBySchoolSchema,
} from "./conduct.validation.js";

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/conduct/remarks
 * Record a remark (PRD §6 — 10-second form).
 */
router.post(
  "/remarks",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(createRemarkSchema),
  conductController.createRemark
);

/**
 * GET /api/v1/conduct/remarks/students/:studentId
 */
router.get(
  "/remarks/mine",
  authorize(ROLE_GROUPS.ALL_STAFF),
  conductController.listByTeacher
);

router.get(
  "/remarks/school",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(listRemarksBySchoolSchema),
  conductController.listAllBySchool
);

router.get(
  "/remarks/students/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listRemarksByStudentSchema),
  conductController.listByStudent
);

/**
 * GET /api/v1/conduct/remarks/sections/:sectionId
 */
router.get(
  "/remarks/sections/:sectionId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listRemarksBySectionSchema),
  conductController.listBySection
);

/**
 * GET /api/v1/conduct/remarks/:id
 */
router.get(
  "/remarks/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getRemarkSchema),
  conductController.getRemark
);

router.patch(
  "/remarks/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(updateRemarkSchema),
  conductController.updateRemark
);

router.delete(
  "/remarks/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(deleteRemarkSchema),
  conductController.deleteRemark
);

export default router;
