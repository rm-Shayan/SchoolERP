import { Router } from "express";
import circularController from "./circular.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { createCircularSchema, listCircularsSchema, getCircularSchema } from "./circular.validation.js";

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/circulars/schools/:schoolId
 * Publish circular (PRD §5).
 */
router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createCircularSchema),
  circularController.createCircular
);

/**
 * GET /api/v1/circulars/schools/:schoolId
 */
router.get(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listCircularsSchema),
  circularController.listCirculars
);

/**
 * GET /api/v1/circulars/:id
 */
router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getCircularSchema),
  circularController.getCircular
);

/**
 * DELETE /api/v1/circulars/:id
 */
router.delete(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getCircularSchema),
  circularController.deleteCircular
);

export default router;
