import { Router } from "express";
import timetableController from "./timetable.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { fileUpload } from "../../lib/upload.js";
import {
  createSlotSchema,
  listSlotsBySectionSchema,
  getSlotSchema,
  updateSlotSchema,
  listSlotsByTeacherSchema,
} from "./timetable.validation.js";

const router = Router();
router.use(authenticate);

router.post(
  "/sections/:sectionId/import",
  authorize(ROLE_GROUPS.ACADEMIC),
  fileUpload.single("file"),
  timetableController.importTimetable
);

router.get(
  "/sections/:sectionId/export",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listSlotsBySectionSchema),
  timetableController.exportTimetable
);

router.post(
  "/sections/:sectionId",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(createSlotSchema),
  timetableController.createSlot
);

router.get(
  "/sections/:sectionId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listSlotsBySectionSchema),
  timetableController.listSlotsBySection
);

router.get(
  "/teachers/:teacherId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listSlotsByTeacherSchema),
  timetableController.listSlotsByTeacher
);

router.get(
  "/slots/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getSlotSchema),
  timetableController.getSlot
);

router.patch(
  "/slots/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(updateSlotSchema),
  timetableController.updateSlot
);

router.delete(
  "/slots/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getSlotSchema),
  timetableController.deleteSlot
);

router.delete(
  "/sections/:sectionId/slots",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(listSlotsBySectionSchema),
  timetableController.clearTimetable
);

export default router;
