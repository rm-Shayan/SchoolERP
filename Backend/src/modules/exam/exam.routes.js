import { Router } from "express";
import examController from "./exam.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  createExamSchema,
  listExamsSchema,
  getExamSchema,
  enterResultsSchema,
  publishResultsSchema,
  getStudentResultSchema,
} from "./exam.validation.js";

const router = Router();
router.use(authenticate);

// ==========================================
// EXAMS & RESULTS (PRD §6)
// ==========================================
router.post(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ACADEMIC),
  assertSameSchool,
  validate(createExamSchema),
  examController.createExam
);

router.get(
  "/schools/:schoolId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listExamsSchema),
  examController.listExams
);

router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getExamSchema),
  examController.getExam
);

router.delete(
  "/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getExamSchema),
  examController.deleteExam
);

router.post(
  "/:id/results",
  authorize(ROLE_GROUPS.ACADEMIC),
  validate(enterResultsSchema),
  examController.enterResults
);

router.post(
  "/:id/publish",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(publishResultsSchema),
  examController.publishResults
);

router.get(
  "/:examId/students/:studentId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getStudentResultSchema),
  examController.getStudentResult
);

router.get(
  "/:examId/students/:studentId/card",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getStudentResultSchema),
  examController.getStudentResultCard
);

export default router;
