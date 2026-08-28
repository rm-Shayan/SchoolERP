import { Router } from "express";
import activityController from "./activity.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { createActivitySchema, listActivitiesSchema, getActivitySchema, updateActivitySchema } from "./activity.validation.js";

const router = Router();
router.use(authenticate);

router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createActivitySchema),
  activityController.createActivity
);

router.get(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listActivitiesSchema),
  activityController.listActivities
);

router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getActivitySchema),
  activityController.getActivity
);

router.patch(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateActivitySchema),
  activityController.updateActivity
);

router.delete(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getActivitySchema),
  activityController.deleteActivity
);

export default router;
