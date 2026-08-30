import examService from "./exam.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { streamPdf, buildExamDateSheetPdf } from "../../lib/pdf/reportPdf.js";

class ExamController {
  /**
   * POST /api/v1/exams/schools/:schoolId
   * Create an exam under a term.
   */
  createExam = asyncHandler(async (req, res) => {
    const exam = await examService.createExam(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Exam created", exam));
  });

  /**
   * GET /api/v1/exams/schools/:schoolId
   * List exams for a school.
   */
  listExams = asyncHandler(async (req, res) => {
    const result = await examService.listExams(req.user, req.params.schoolId, req.query);
    return res.status(200).json(ApiResponse.ok("Exams fetched", result));
  });

  /**
   * GET /api/v1/exams/:id
   * Single exam detail.
   */
  getExam = asyncHandler(async (req, res) => {
    const exam = await examService.getExam(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Exam fetched", exam));
  });

  /**
   * GET /api/v1/exams/:id/date-sheet
   * PDF download — paper-wise date sheet for the exam.
   */
  downloadDateSheet = asyncHandler(async (req, res) => {
    const exam = await examService.getExam(req.user, req.params.id);
    const safe = (exam.name || "exam").replace(/[^\w-]+/g, "-").toLowerCase();
    streamPdf(res, `${safe}-date-sheet.pdf`, (doc) =>
      buildExamDateSheetPdf(doc, exam, exam.school?.name || "School", exam.papers)
    );
  });

  /**
   * DELETE /api/v1/exams/:id
   */
  deleteExam = asyncHandler(async (req, res) => {
    await examService.deleteExam(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Exam deleted"));
  });

  /**
   * PUT /api/v1/exams/:id
   * Update exam details + replace date-wise papers.
   */
  updateExam = asyncHandler(async (req, res) => {
    const exam = await examService.updateExam(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Exam updated", exam));
  });

  /**
   * POST /api/v1/exams/:id/results
   * Bulk enter results (PRD §6 — bulk Excel-style entry).
   */
  enterResults = asyncHandler(async (req, res) => {
    const results = await examService.enterResults(req.user, req.params.id, req.body);
    return res.status(201).json(ApiResponse.created("Results saved", { count: results.length }));
  });

  /**
   * POST /api/v1/exams/:id/publish
   * Email result summary to each parent.
   */
  publishResults = asyncHandler(async (req, res) => {
    const result = await examService.publishResults(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Results published to parents", result));
  });

  /**
   * GET /api/v1/exams/:examId/students/:studentId
   * Student result card for an exam.
   */
  getStudentResult = asyncHandler(async (req, res) => {
    const result = await examService.getStudentResult(req.user, req.params.examId, req.params.studentId);
    return res.status(200).json(ApiResponse.ok("Student result fetched", result));
  });

  /**
   * GET /api/v1/exams/:examId/students/:studentId/card
   * Generated result card (total/percentage/grade/division).
   */
  getStudentResultCard = asyncHandler(async (req, res) => {
    const result = await examService.getStudentResultCard(req.user, req.params.examId, req.params.studentId);
    return res.status(200).json(ApiResponse.ok("Result card generated", result));
  });
}

export default new ExamController();
