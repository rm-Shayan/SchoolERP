import academicRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertSchoolAccess, assertOwnSchool, assertSchoolExists } from "../../lib/scope.js";
import { cacheGet, cacheSet, cacheDel } from "../../lib/utils/cache.js";

const YEARS_TTL = 45;
const CLASSES_TTL = 45;
const TEMPLATES_TTL = 60;

/** School-scoped create/list ke liye effective schoolId + write assert. */
function _schoolWriteScope(user, schoolId) {
  const targetSchoolId = getEffectiveSchoolId(user, schoolId);
  assertOwnSchool(user, targetSchoolId);
  return targetSchoolId;
}

/** Entity fetch + 404 + apni branch check (writes ke liye) — 6 resources mein repeat tha. */
async function _owned(user, promise, label, schoolIdOf) {
  const entity = await promise;
  if (!entity) throw ApiError.notFoundError(`${label} not found`);
  assertOwnSchool(user, schoolIdOf(entity));
  return entity;
}

/** Date fields ISO string → Date (year/term payloads). */
function _coerceDates(data) {
  const out = { ...data };
  if (data.startDate) out.startDate = new Date(data.startDate);
  if (data.endDate) out.endDate = new Date(data.endDate);
  return out;
}

class AcademicService {
  // ── Academic Year ─────────────────────────────────────────────
  async createAcademicYear(user, schoolId, data) {
    const targetSchoolId = _schoolWriteScope(user, schoolId);
    await assertSchoolExists(targetSchoolId);

    if (data.isCurrent) {
      await academicRepository.setAcademicYearsCurrent(targetSchoolId);
    }

    const result = await academicRepository.createAcademicYear({
      schoolId: targetSchoolId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: Boolean(data.isCurrent),
    });
    await cacheDel(`academic:years:${targetSchoolId}`);
    return result;
  }

  async listAcademicYears(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    const key = `academic:years:${targetSchoolId}`;
    const cached = await cacheGet(key);
    if (cached) return cached;
    const years = await academicRepository.listAcademicYearsBySchool(targetSchoolId);
    await cacheSet(key, years, YEARS_TTL);
    return years;
  }

  async getAcademicYear(user, id) {
    const year = await academicRepository.findAcademicYearById(id);
    if (!year) throw ApiError.notFoundError("Academic year not found");
    assertSchoolAccess(user, year.schoolId);
    return year;
  }

  async updateAcademicYear(user, id, data) {
    const year = await this.getAcademicYear(user, id);
    assertOwnSchool(user, year.schoolId);

    if (data.isCurrent === true) {
      await academicRepository.setAcademicYearsCurrent(year.schoolId, year.id);
    } else if (data.isCurrent === false && year.isCurrent) {
      // Prevent unsetting the only current year silently
      const allYears = await academicRepository.listAcademicYearsBySchool(year.schoolId);
      if (allYears.length === 1) {
        throw ApiError.badRequestError(
          "Cannot unset the current year. Create a new academic year and set it current instead."
        );
      }
    }

    const result = await academicRepository.updateAcademicYear(id, _coerceDates(data));
    await cacheDel(`academic:years:${year.schoolId}`);
    return result;
  }

  async deleteAcademicYear(user, id) {
    const year = await this.getAcademicYear(user, id);
    assertOwnSchool(user, year.schoolId);
    const result = await academicRepository.deleteAcademicYear(id);
    await cacheDel(`academic:years:${year.schoolId}`);
    return result;
  }

  // ── Term ──────────────────────────────────────────────────────
  async createTerm(user, academicYearId, data) {
    const year = await this.getAcademicYear(user, academicYearId);
    assertOwnSchool(user, year.schoolId);

    const result = await academicRepository.createTerm({
      academicYearId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
    await cacheDel(`academic:years:${year.schoolId}`);
    return result;
  }

  async listTerms(user, academicYearId) {
    const year = await this.getAcademicYear(user, academicYearId);
    return academicRepository.listTermsByYear(year.id);
  }

  async updateTerm(user, id, data) {
    const term = await academicRepository.findTermById(id);
    if (!term) throw ApiError.notFoundError("Term not found");
    const year = await this.getAcademicYear(user, term.academicYearId);
    assertOwnSchool(user, year.schoolId);
    const result = await academicRepository.updateTerm(id, _coerceDates(data));
    await cacheDel(`academic:years:${year.schoolId}`);
    return result;
  }

  async deleteTerm(user, id) {
    const term = await academicRepository.findTermById(id);
    if (!term) throw ApiError.notFoundError("Term not found");
    const year = await this.getAcademicYear(user, term.academicYearId);
    assertOwnSchool(user, year.schoolId);
    const result = await academicRepository.deleteTerm(id);
    await cacheDel(`academic:years:${year.schoolId}`);
    return result;
  }

  // ── Class ─────────────────────────────────────────────────────
  async createClass(user, schoolId, data) {
    const targetSchoolId = _schoolWriteScope(user, schoolId);
    const result = await academicRepository.createClass({
      schoolId: targetSchoolId,
      name: data.name,
      order: data.order || 0,
    });
    await cacheDel(`academic:classes:${targetSchoolId}`);
    return result;
  }

  async listClasses(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    const key = `academic:classes:${targetSchoolId}`;
    const cached = await cacheGet(key);
    if (cached) return cached;
    const classes = await academicRepository.listClassesBySchool(targetSchoolId);
    await cacheSet(key, classes, CLASSES_TTL);
    return classes;
  }

  async getClass(user, id) {
    const cls = await academicRepository.findClassById(id);
    if (!cls) throw ApiError.notFoundError("Class not found");
    assertSchoolAccess(user, cls.schoolId);
    return cls;
  }

  async updateClass(user, id, data) {
    const cls = await _owned(user, this.getClass(user, id), "Class", (c) => c.schoolId);
    const result = await academicRepository.updateClass(id, data);
    await cacheDel(`academic:classes:${cls.schoolId}`);
    return result;
  }

  async deleteClass(user, id) {
    const cls = await _owned(user, this.getClass(user, id), "Class", (c) => c.schoolId);
    const result = await academicRepository.deleteClass(id);
    await cacheDel(`academic:classes:${cls.schoolId}`);
    return result;
  }

  // ── Section Templates (school-level section pool) ─────────────
  async listSectionTemplates(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    const key = `academic:templates:${targetSchoolId}`;
    const cached = await cacheGet(key);
    if (cached) return cached;
    const templates = await academicRepository.listSectionTemplatesBySchool(targetSchoolId);
    await cacheSet(key, templates, TEMPLATES_TTL);
    return templates;
  }

  // Templates SIRF generic names hain — capacity/room per-class Section par hoti hai.
  async createSectionTemplate(user, schoolId, data) {
    const targetSchoolId = _schoolWriteScope(user, schoolId);
    const result = await academicRepository.createSectionTemplate({ schoolId: targetSchoolId, name: data.name });
    await cacheDel(`academic:templates:${targetSchoolId}`);
    return result;
  }

  async updateSectionTemplate(user, id, data) {
    const template = await _owned(user, academicRepository.findSectionTemplateById(id), "Section template", (t) => t.schoolId);
    const result = await academicRepository.updateSectionTemplate(id, { name: data.name ?? undefined });
    await cacheDel(`academic:templates:${template.schoolId}`);
    return result;
  }

  async deleteSectionTemplate(user, id) {
    const template = await _owned(user, academicRepository.findSectionTemplateById(id), "Section template", (t) => t.schoolId);
    const result = await academicRepository.deleteSectionTemplate(id);
    await cacheDel(`academic:templates:${template.schoolId}`);
    return result;
  }

  // ── Section ───────────────────────────────────────────────────
  async createSection(user, classId, data) {
    const cls = await this.getClass(user, classId);
    assertOwnSchool(user, cls.schoolId);
    const result = await academicRepository.createSection({
      classId,
      name: data.name,
      capacity: data.capacity ?? undefined,
      roomNumber: data.roomNumber ?? undefined,
    });
    await cacheDel(`academic:classes:${cls.schoolId}`);
    return result;
  }

  async listSections(user, classId) {
    const cls = await this.getClass(user, classId);
    return academicRepository.listSectionsByClass(cls.id);
  }

  async updateSection(user, id, data) {
    const section = await _owned(user, academicRepository.findSectionById(id), "Section", (s) => s.class.schoolId);
    const result = await academicRepository.updateSection(id, data);
    await cacheDel(`academic:classes:${section.class.schoolId}`);
    return result;
  }

  async deleteSection(user, id) {
    const section = await _owned(user, academicRepository.findSectionById(id), "Section", (s) => s.class.schoolId);
    const result = await academicRepository.deleteSection(id);
    await cacheDel(`academic:classes:${section.class.schoolId}`);
    return result;
  }

  // ── Subject ───────────────────────────────────────────────────
  async createSubject(user, classId, data) {
    const cls = await this.getClass(user, classId);
    assertOwnSchool(user, cls.schoolId);
    const result = await academicRepository.createSubject({
      classId,
      name: data.name,
      code: data.code || null,
    });
    await cacheDel(`academic:classes:${cls.schoolId}`);
    return result;
  }

  async listSubjects(user, classId) {
    const cls = await this.getClass(user, classId);
    return academicRepository.listSubjectsByClass(cls.id);
  }

  async updateSubject(user, id, data) {
    const subject = await _owned(user, academicRepository.findSubjectById(id), "Subject", (s) => s.class.schoolId);
    const result = await academicRepository.updateSubject(id, data);
    await cacheDel(`academic:classes:${subject.class.schoolId}`);
    return result;
  }

  async deleteSubject(user, id) {
    const subject = await _owned(user, academicRepository.findSubjectById(id), "Subject", (s) => s.class.schoolId);
    const result = await academicRepository.deleteSubject(id);
    await cacheDel(`academic:classes:${subject.class.schoolId}`);
    return result;
  }
}

export default new AcademicService();
