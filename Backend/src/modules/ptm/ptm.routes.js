import { Router } from "express";
import ptmController from "./ptm.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { createPtmSchema, listPtmSchema, getPtmSchema, updatePtmSchema } from "./ptm.validation.js";

const router = Router();
router.use(authenticate);

router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createPtmSchema),
  ptmController.createSession
);

router.get(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listPtmSchema),
  ptmController.listSessions
);

router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getPtmSchema),
  ptmController.getSession
);

router.patch(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updatePtmSchema),
  ptmController.updateSession
);

router.delete(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getPtmSchema),
  ptmController.deleteSession
);

export default router;
