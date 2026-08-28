import academicService from "./academic.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class AcademicController {
  // ── Academic Years ────────────────────────────────────────────
  createAcademicYear = asyncHandler(async (req, res) => {
    const year = await academicService.createAcademicYear(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Academic year created", year));
  });

  listAcademicYears = asyncHandler(async (req, res) => {
    const years = await academicService.listAcademicYears(req.user, req.params.schoolId || req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Academic years fetched", years));
  });

  getAcademicYear = asyncHandler(async (req, res) => {
    const year = await academicService.getAcademicYear(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Academic year fetched", year));
  });

  updateAcademicYear = asyncHandler(async (req, res) => {
    const year = await academicService.updateAcademicYear(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Academic year updated", year));
  });

  deleteAcademicYear = asyncHandler(async (req, res) => {
    await academicService.deleteAcademicYear(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Academic year deleted"));
  });

  // ── Terms ─────────────────────────────────────────────────────
  createTerm = asyncHandler(async (req, res) => {
    const term = await academicService.createTerm(req.user, req.params.academicYearId, req.body);
    return res.status(201).json(ApiResponse.created("Term created", term));
  });

  listTerms = asyncHandler(async (req, res) => {
    const terms = await academicService.listTerms(req.user, req.params.academicYearId);
    return res.status(200).json(ApiResponse.ok("Terms fetched", terms));
  });

  updateTerm = asyncHandler(async (req, res) => {
    const term = await academicService.updateTerm(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Term updated", term));
  });

  deleteTerm = asyncHandler(async (req, res) => {
    await academicService.deleteTerm(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Term deleted"));
  });

  // ── Classes ───────────────────────────────────────────────────
  createClass = asyncHandler(async (req, res) => {
    const cls = await academicService.createClass(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Class created", cls));
  });

  listClasses = asyncHandler(async (req, res) => {
    const classes = await academicService.listClasses(req.user, req.params.schoolId || req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Classes fetched", classes));
  });

  getClass = asyncHandler(async (req, res) => {
    const cls = await academicService.getClass(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Class fetched", cls));
  });

  updateClass = asyncHandler(async (req, res) => {
    const cls = await academicService.updateClass(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Class updated", cls));
  });

  deleteClass = asyncHandler(async (req, res) => {
    await academicService.deleteClass(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Class deleted"));
  });

  // ── Section Templates (school-level section pool) ────────────
  listSectionTemplates = asyncHandler(async (req, res) => {
    const templates = await academicService.listSectionTemplates(req.user, req.params.schoolId || req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("Section templates fetched", templates));
  });

  createSectionTemplate = asyncHandler(async (req, res) => {
    const template = await academicService.createSectionTemplate(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Section template created", template));
  });

  updateSectionTemplate = asyncHandler(async (req, res) => {
    const template = await academicService.updateSectionTemplate(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Section template updated", template));
  });

  deleteSectionTemplate = asyncHandler(async (req, res) => {
    await academicService.deleteSectionTemplate(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Section template deleted"));
  });

  // ── Sections ──────────────────────────────────────────────────
  createSection = asyncHandler(async (req, res) => {
    const section = await academicService.createSection(req.user, req.params.classId, req.body);
    return res.status(201).json(ApiResponse.created("Section created", section));
  });

  listSections = asyncHandler(async (req, res) => {
    const sections = await academicService.listSections(req.user, req.params.classId);
    return res.status(200).json(ApiResponse.ok("Sections fetched", sections));
  });

  updateSection = asyncHandler(async (req, res) => {
    const section = await academicService.updateSection(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Section updated", section));
  });

  deleteSection = asyncHandler(async (req, res) => {
    await academicService.deleteSection(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Section deleted"));
  });

  // ── Subjects ──────────────────────────────────────────────────
  createSubject = asyncHandler(async (req, res) => {
    const subject = await academicService.createSubject(req.user, req.params.classId, req.body);
    return res.status(201).json(ApiResponse.created("Subject created", subject));
  });

  listSubjects = asyncHandler(async (req, res) => {
    const subjects = await academicService.listSubjects(req.user, req.params.classId);
    return res.status(200).json(ApiResponse.ok("Subjects fetched", subjects));
  });

  updateSubject = asyncHandler(async (req, res) => {
    const subject = await academicService.updateSubject(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Subject updated", subject));
  });

  deleteSubject = asyncHandler(async (req, res) => {
    await academicService.deleteSubject(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Subject deleted"));
  });
}

export default new AcademicController();
