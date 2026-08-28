import { Router } from "express";
import teachingAssignmentController from "./teachingAssignment.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  assignTeacherSchema,
  listAssignmentsSchema,
  getAssignmentSchema,
} from "./teachingAssignment.validation.js";

const router = Router();
router.use(authenticate);

router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(assignTeacherSchema),
  teachingAssignmentController.assign
);

router.get(
  "/schools/:schoolId/me",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listAssignmentsSchema),
  teachingAssignmentController.listMe
);

router.get(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listAssignmentsSchema),
  teachingAssignmentController.list
);

router.delete(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getAssignmentSchema),
  teachingAssignmentController.remove
);

export default router;