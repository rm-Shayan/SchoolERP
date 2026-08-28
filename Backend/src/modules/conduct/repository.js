import prisma from "../../config/db.js";

class ConductRepository {
  async findStudentById(id) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        school: { select: { id: true, name: true } },
        section: { include: { class: true } },
      },
    });
  }

  async createRemark(data) {
    return prisma.conductRemark.create({ data });
  }

  async findRemarkById(id) {
    return prisma.conductRemark.findUnique({
      where: { id },
      include: { student: { include: { school: true } }, teacher: { select: { id: true, name: true } } },
    });
  }

  async listRemarksByStudent(studentId, { page, pageSize }) {
    const [items, total] = await Promise.all([
      prisma.conductRemark.findMany({
        where: { studentId },
        include: { teacher: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where: { studentId } }),
    ]);
    return { items, total, page, pageSize };
  }

  async listRemarksBySection(sectionId, { type, page, pageSize }) {
    const where = { student: { sectionId } };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.conductRemark.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

export default new ConductRepository();
