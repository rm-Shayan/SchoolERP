import prisma from "../../config/db.js";

class AcademicRepository {
  // ── Academic Years ────────────────────────────────────────────
  async createAcademicYear(data) {
    return prisma.academicYear.create({ data });
  }

  async listAcademicYearsBySchool(schoolId) {
    return prisma.academicYear.findMany({
      where: { schoolId },
      include: { terms: true },
      orderBy: { startDate: "desc" },
    });
  }

  async findAcademicYearById(id) {
    return prisma.academicYear.findUnique({
      where: { id },
      include: { terms: { orderBy: { startDate: "asc" } } },
    });
  }

  async updateAcademicYear(id, data) {
    return prisma.academicYear.update({ where: { id }, data });
  }

  async deleteAcademicYear(id) {
    return prisma.academicYear.delete({ where: { id } });
  }

  async setAcademicYearsCurrent(schoolId, exceptId = null) {
    return prisma.academicYear.updateMany({
      where: { schoolId, id: exceptId ? { not: exceptId } : undefined },
      data: { isCurrent: false },
    });
  }

  // ── Terms ─────────────────────────────────────────────────────
  async createTerm(data) {
    return prisma.term.create({ data });
  }

  async listTermsByYear(academicYearId) {
    return prisma.term.findMany({
      where: { academicYearId },
      include: { exams: true },
      orderBy: { startDate: "asc" },
    });
  }

  async findTermById(id) {
    return prisma.term.findUnique({ where: { id } });
  }

  async updateTerm(id, data) {
    return prisma.term.update({ where: { id }, data });
  }

  async deleteTerm(id) {
    return prisma.term.delete({ where: { id } });
  }

  // ── Classes ───────────────────────────────────────────────────
  async createClass(data) {
    return prisma.class.create({ data });
  }

  async listClassesBySchool(schoolId) {
    return prisma.class.findMany({
      where: { schoolId },
      include: {
        sections: { include: { _count: { select: { students: true } } } },
        subjects: true,
      },
      // School order pehle (PlayGroup < Class 1 < ...), phir alphabetical.
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }

  async findClassById(id) {
    return prisma.class.findUnique({
      where: { id },
      include: { sections: true, subjects: true },
    });
  }

  async updateClass(id, data) {
    return prisma.class.update({ where: { id }, data });
  }

  async deleteClass(id) {
    return prisma.class.delete({ where: { id } });
  }

  // ── Sections ──────────────────────────────────────────────────
  // ── Section Templates (school-level section pool) ─────────────
  async listSectionTemplatesBySchool(schoolId) {
    return prisma.sectionTemplate.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  async findSectionTemplateById(id) {
    return prisma.sectionTemplate.findUnique({ where: { id } });
  }

  async createSectionTemplate(data) {
    return prisma.sectionTemplate.create({ data });
  }

  async updateSectionTemplate(id, data) {
    return prisma.sectionTemplate.update({ where: { id }, data });
  }

  async deleteSectionTemplate(id) {
    return prisma.sectionTemplate.delete({ where: { id } });
  }

  async createSection(data) {
    return prisma.section.create({ data });
  }

  async listSectionsByClass(classId) {
    return prisma.section.findMany({
      where: { classId },
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    });
  }

  async findSectionById(id) {
    return prisma.section.findUnique({
      where: { id },
      include: { class: true },
    });
  }

  async updateSection(id, data) {
    return prisma.section.update({ where: { id }, data });
  }

  async deleteSection(id) {
    return prisma.section.delete({ where: { id } });
  }

  // ── Subjects ──────────────────────────────────────────────────
  async createSubject(data) {
    return prisma.subject.create({ data });
  }

  async listSubjectsByClass(classId) {
    return prisma.subject.findMany({
      where: { classId },
      orderBy: { name: "asc" },
    });
  }

  async findSubjectById(id) {
    return prisma.subject.findUnique({
      where: { id },
      include: { class: { select: { schoolId: true } } },
    });
  }

  async updateSubject(id, data) {
    return prisma.subject.update({ where: { id }, data });
  }

  async deleteSubject(id) {
    return prisma.subject.delete({ where: { id } });
  }
}

export default new AcademicRepository();
