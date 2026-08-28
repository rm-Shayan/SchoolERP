import prisma from "../../config/db.js";

class PromotionRepository {
  async academicYearExists(id) {
    return prisma.academicYear.findUnique({
      where: { id },
      select: { id: true, name: true, schoolId: true, isCurrent: true },
    });
  }

  async sectionExists(id) {
    return prisma.section.findUnique({
      where: { id },
      include: { class: true },
    });
  }

  async studentById(id) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        section: { include: { class: true } },
        parent: { select: { id: true, name: true, email: true, whatsappNo: true } },
      },
    });
  }

  async activeStudentsBySection(sectionId) {
    return prisma.student.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: {
        section: { include: { class: true } },
        parent: { select: { id: true, name: true, email: true, whatsappNo: true } },
      },
      orderBy: { rollNumber: "asc" },
    });
  }

  async updateStudent(id, data, client = prisma) {
    return client.student.update({ where: { id }, data });
  }

  async createPromotionRecord(data, client = prisma) {
    return client.promotionRecord.create({ data });
  }

  async findPromotionById(id) {
    const record = await prisma.promotionRecord.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, rollNumber: true, schoolId: true },
        },
        academicYear: { select: { id: true, name: true } },
      },
    });
    if (!record) return null;
    return this._hydrateSections(record);
  }

  async listPromotions({ schoolId, studentId, sectionId, academicYearId, action, page, pageSize }) {
    const where = {};

    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (sectionId) where.fromSectionId = sectionId;
    if (action) where.action = action;
    if (schoolId) {
      // Scope via the student's school (PromotionRecord has no direct schoolId).
      where.student = { schoolId };
    }

    const [items, total] = await Promise.all([
      prisma.promotionRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rollNumber: true,
              identifierCode: true,
              status: true,
            },
          },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.promotionRecord.count({ where }),
    ]);

    const hydrated = await this._hydrateSections(items);

    return { items: hydrated, total, page, pageSize };
  }

  /**
   * Resolve fromSection / toSection names for promotion records.
   * PromotionRecord stores section IDs as plain scalars (no Prisma relation),
   * so sections are fetched in one bulk query and mapped.
   */
  async _hydrateSections(records) {
    const single = !Array.isArray(records);
    const list = single ? [records] : records;
    if (!list.length) return single ? null : [];

    const sectionIds = new Set();
    list.forEach((r) => {
      if (r.fromSectionId) sectionIds.add(r.fromSectionId);
      if (r.toSectionId) sectionIds.add(r.toSectionId);
    });

    let sectionMap = {};
    if (sectionIds.size) {
      const sections = await prisma.section.findMany({
        where: { id: { in: [...sectionIds] } },
        include: { class: { select: { name: true } } },
      });
      sectionMap = Object.fromEntries(
        sections.map((s) => [
          s.id,
          { id: s.id, name: s.name, class: { name: s.class.name } },
        ])
      );
    }

    const withSections = list.map((r) => ({
      ...r,
      fromSection: r.fromSectionId ? sectionMap[r.fromSectionId] || null : null,
      toSection: r.toSectionId ? sectionMap[r.toSectionId] || null : null,
    }));

    return single ? withSections[0] : withSections;
  }
}

export default new PromotionRepository();
