import prisma from "../../config/db.js";

class PtmRepository {
  async teachersInSchool(schoolId, teacherIds) {
    const unique = [...new Set(teacherIds)];
    return prisma.user.findMany({
      where: { id: { in: unique }, schoolId, role: "TEACHER" },
      select: { id: true, name: true },
    });
  }

  async listSchoolClasses(schoolId) {
    return prisma.class.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      select: { id: true, name: true, order: true },
    });
  }

  async sectionIdsForClasses(classIds) {
    const rows = await prisma.section.findMany({
      where: { classId: { in: classIds } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async sectionsWithClass(schoolId, sectionIds) {
    return prisma.section.findMany({
      where: { id: { in: sectionIds }, class: { schoolId } },
      select: { id: true, name: true, classId: true, class: { select: { id: true, name: true, order: true } } },
    });
  }

  async findStudent(schoolId, studentId) {
    return prisma.student.findFirst({
      where: { id: studentId, schoolId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        sectionId: true,
        section: { select: { name: true, class: { select: { name: true } } } },
        parent: { select: { id: true, email: true, phone: true, whatsappNo: true } },
      },
    });
  }

  async studentsByIds(schoolId, ids) {
    return prisma.student.findMany({
      where: { id: { in: ids }, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        sectionId: true,
        section: { select: { name: true, class: { select: { name: true } } } },
      },
    });
  }

  async createSession(data) {
    return prisma.pTMSession.create({ data });
  }

  async findSessionById(id) {
    return prisma.pTMSession.findUnique({
      where: { id },
      include: { school: { select: { id: true, name: true } } },
    });
  }

  async updateSession(id, data) {
    return prisma.pTMSession.update({ where: { id }, data });
  }

  async deleteSession(id) {
    return prisma.pTMSession.delete({ where: { id } });
  }

  async listSessionsBySchool(schoolId, { page, pageSize }) {
    const [items, total] = await Promise.all([
      prisma.pTMSession.findMany({
        where: { schoolId },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pTMSession.count({ where: { schoolId } }),
    ]);
    return { items, total, page, pageSize };
  }

  async listStudentParentsBySections(schoolId, sectionIds) {
    if (!sectionIds || sectionIds.length === 0) {
      return prisma.student.findMany({
        where: { schoolId, status: "ACTIVE" },
        include: { parent: { select: { id: true, email: true, phone: true, whatsappNo: true } } },
      });
    }
    return prisma.student.findMany({
      where: { schoolId, status: "ACTIVE", sectionId: { in: sectionIds } },
      include: { parent: { select: { id: true, email: true, phone: true, whatsappNo: true } } },
    });
  }

  async classesByIds(schoolId, classIds) {
    return prisma.class.findMany({
      where: { id: { in: classIds }, schoolId },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    });
  }

  async usersByIds(schoolId, ids) {
    return prisma.user.findMany({
      where: { id: { in: ids }, schoolId },
      select: { id: true, name: true },
    });
  }
}

export default new PtmRepository();
