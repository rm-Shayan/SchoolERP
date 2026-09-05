import { Router } from "express";
import { authenticateAnyPortal } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import portalController from "./portal.controller.js";
import { updateProfileSchema } from "./portal.validation.js";
import studyMaterialController from "../studyMaterial/studyMaterial.controller.js";
import { imageUpload } from "../../lib/upload.js";

const router = Router();

// All portal routes require either parent or student token
router.use(authenticateAnyPortal);

router.patch("/me", validate(updateProfileSchema), portalController.updateProfile);
router.post("/me/avatar", imageUpload.single("file"), portalController.uploadAvatar);

router.get("/overview", portalController.getOverview);
router.get("/attendance", portalController.getAttendance);
router.get("/fees", portalController.getFees);
router.get("/homework", portalController.getHomework);
router.get("/circulars", portalController.getCirculars);
router.get("/results", portalController.getResults);
router.get("/timetable", portalController.getTimetable);
router.get("/conduct", portalController.getConduct);
router.get("/ptm", portalController.getPTM);
router.get("/leave", portalController.getLeaveRequests);
router.post("/leave", portalController.createLeaveRequest);
router.get("/exams", portalController.getExams);
router.get("/exams/:examId/date-sheet", portalController.downloadExamDateSheet);
router.get("/timetable/pdf", portalController.downloadTimetable);
router.get("/study-material", studyMaterialController.listPortal);

export default router;
