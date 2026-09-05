import prisma from "../../config/db.js";

class StudyMaterialRepository {
  async create(data) {
    return prisma.studyMaterial.create({
      data,
      include: {
        section: { include: { class: true } },
        subject: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async findById(id) {
    return prisma.studyMaterial.findUnique({
      where: { id },
      include: {
        section: { include: { class: true } },
        subject: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async listBySchool(schoolId, filters) {
    const where = { schoolId };
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.type) where.type = filters.type;
    if (filters.createdById) where.createdById = filters.createdById;

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;

    const [items, total] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        include: {
          section: { include: { class: true } },
          subject: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.studyMaterial.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async listForPortal(sectionIds) {
    // Student/section na hone par empty [] — Prisma `in: []` valid hai, undefined nahi.
    const valid = (sectionIds ?? []).filter(Boolean);
    if (valid.length === 0) return [];
    return prisma.studyMaterial.findMany({
      where: { sectionId: { in: valid } },
      include: {
        section: { select: { id: true, name: true, class: { select: { name: true } } } },
        subject: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async update(id, data) {
    return prisma.studyMaterial.update({
      where: { id },
      data,
      include: {
        section: { include: { class: true } },
        subject: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async delete(id) {
    return prisma.studyMaterial.delete({ where: { id } });
  }
}

export default new StudyMaterialRepository();
