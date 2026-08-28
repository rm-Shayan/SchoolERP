import { Router } from "express";
import homeworkController from "./homework.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { createHomeworkSchema, listHomeworkSchema, getHomeworkSchema, updateHomeworkSchema } from "./homework.validation.js";

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/homework
 * Post homework for a section → email to parents (PRD §6).
 */
router.post(
  "/",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(createHomeworkSchema),
  homeworkController.createBroadcast
);

/**
 * GET /api/v1/homework
 * List broadcasts.
 */
router.get(
  "/",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listHomeworkSchema),
  homeworkController.listBroadcasts
);

/**
 * GET /api/v1/homework/:id
 */
router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getHomeworkSchema),
  homeworkController.getBroadcast
);

/**
 * PUT /api/v1/homework/:id
 * Update broadcast — ADMIN/SUPER_ADMIN koi bhi, TEACHER sirf apna.
 */
router.put(
  "/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(updateHomeworkSchema),
  homeworkController.updateBroadcast
);

/**
 * DELETE /api/v1/homework/:id
 * ADMIN/SUPER_ADMIN koi bhi, TEACHER sirf apni post (service-level check).
 */
router.delete(
  "/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(getHomeworkSchema),
  homeworkController.deleteBroadcast
);

export default router;
