import prisma from "../../config/db.js";

class CircularRepository {
  async createCircular(data) {
    return prisma.circular.create({ data });
  }

  async findCircularById(id) {
    return prisma.circular.findUnique({
      where: { id },
      include: { school: { select: { id: true, name: true } } },
    });
  }

  async listCircularsBySchool(schoolId, { page, pageSize }) {
    const [items, total] = await Promise.all([
      prisma.circular.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.circular.count({ where: { schoolId } }),
    ]);
    return { items, total, page, pageSize };
  }

  async deleteCircular(id) {
    return prisma.circular.delete({ where: { id } });
  }

  async listActiveStudentsBySchool(schoolId) {
    return prisma.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      select: {
        parent: {
          select: { id: true, name: true, email: true, phone: true, whatsappNo: true },
        },
      },
      orderBy: { rollNumber: "asc" },
    });
  }

  async listSchoolStaff(schoolId) {
    return prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        role: { in: ["ADMIN", "TEACHER", "RECEPTIONIST"] },
      },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    });
  }
}

export default new CircularRepository();
