import prisma from "../../config/db.js";

class HomeworkRepository {
  async sectionExists(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  async createBroadcast(data) {
    return prisma.homeworkBroadcast.create({ data });
  }

  async findBroadcastById(id) {
    return prisma.homeworkBroadcast.findUnique({
      where: { id },
      include: {
        section: { include: { class: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async listBroadcastsBySchool(schoolId, { sectionId, page, pageSize }) {
    const where = { schoolId };
    if (sectionId) where.sectionId = sectionId;

    const [items, total] = await Promise.all([
      prisma.homeworkBroadcast.findMany({
        where,
        include: {
          section: { include: { class: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.homeworkBroadcast.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async listActiveStudentsBySection(sectionId) {
    return prisma.student.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { parent: true },
      orderBy: { rollNumber: "asc" },
    });
  }
}

export default new HomeworkRepository();
