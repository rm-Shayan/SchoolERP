import { Router } from "express";
import academicController from "./academic.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  getAcademicYearSchema,
  createTermSchema,
  listTermsSchema,
  updateTermSchema,
  deleteTermSchema,
  createClassSchema,
  listClassesSchema,
  getClassSchema,
  updateClassSchema,
  deleteClassSchema,
  createSectionSchema,
  listSectionsSchema,
  updateSectionSchema,
  deleteSectionSchema,
  createSubjectSchema,
  listSubjectsSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
  listSectionTemplatesSchema,
  createSectionTemplateSchema,
  updateSectionTemplateSchema,
  getSectionTemplateSchema,
} from "./academic.validation.js";

const router = Router();
router.use(authenticate);

// ==========================================
// ACADEMIC YEARS
// ==========================================
router.post(
  "/schools/:schoolId/academic-years",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createAcademicYearSchema),
  academicController.createAcademicYear
);
router.get(
  "/academic-years/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getAcademicYearSchema),
  academicController.getAcademicYear
);
router.get(
  "/schools/:schoolId/academic-years",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listClassesSchema),
  academicController.listAcademicYears
);
router.patch(
  "/academic-years/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateAcademicYearSchema),
  academicController.updateAcademicYear
);
router.delete(
  "/academic-years/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getAcademicYearSchema),
  academicController.deleteAcademicYear
);

// ==========================================
// TERMS
// ==========================================
router.post(
  "/academic-years/:academicYearId/terms",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(createTermSchema),
  academicController.createTerm
);
router.get(
  "/academic-years/:academicYearId/terms",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listTermsSchema),
  academicController.listTerms
);
router.patch(
  "/terms/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateTermSchema),
  academicController.updateTerm
);
router.delete(
  "/terms/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(deleteTermSchema),
  academicController.deleteTerm
);

// ==========================================
// CLASSES
// ==========================================
router.post(
  "/schools/:schoolId/classes",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createClassSchema),
  academicController.createClass
);
router.get(
  "/classes/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getClassSchema),
  academicController.getClass
);
router.get(
  "/schools/:schoolId/classes",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listClassesSchema),
  academicController.listClasses
);
router.patch(
  "/classes/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateClassSchema),
  academicController.updateClass
);
router.delete(
  "/classes/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(deleteClassSchema),
  academicController.deleteClass
);

// ==========================================
// SECTION TEMPLATES (school-level section pool)
// ==========================================
router.get(
  "/schools/:schoolId/section-templates",
  authorize(ROLE_GROUPS.ALL_STAFF),
  assertSameSchool,
  validate(listSectionTemplatesSchema),
  academicController.listSectionTemplates
);
router.post(
  "/schools/:schoolId/section-templates",
  authorize(ROLE_GROUPS.MANAGEMENT),
  assertSameSchool,
  validate(createSectionTemplateSchema),
  academicController.createSectionTemplate
);
router.patch(
  "/section-templates/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateSectionTemplateSchema),
  academicController.updateSectionTemplate
);
router.delete(
  "/section-templates/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(getSectionTemplateSchema),
  academicController.deleteSectionTemplate
);

// ==========================================
// SECTIONS
// ==========================================
router.post(
  "/classes/:classId/sections",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(createSectionSchema),
  academicController.createSection
);
router.get(
  "/classes/:classId/sections",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listSectionsSchema),
  academicController.listSections
);
router.patch(
  "/sections/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateSectionSchema),
  academicController.updateSection
);
router.delete(
  "/sections/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(deleteSectionSchema),
  academicController.deleteSection
);

// ==========================================
// SUBJECTS
// ==========================================
router.post(
  "/classes/:classId/subjects",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(createSubjectSchema),
  academicController.createSubject
);
router.get(
  "/classes/:classId/subjects",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listSubjectsSchema),
  academicController.listSubjects
);
router.patch(
  "/subjects/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(updateSubjectSchema),
  academicController.updateSubject
);
router.delete(
  "/subjects/:id",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(deleteSubjectSchema),
  academicController.deleteSubject
);

export default router;
