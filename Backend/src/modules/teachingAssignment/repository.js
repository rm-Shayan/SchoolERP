import prisma from "../../config/db.js";

class TeachingAssignmentRepository {
  async teacherExists(schoolId, teacherId) {
    return prisma.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER", isActive: true },
      select: { id: true, name: true },
    });
  }

  async classExists(schoolId, classId) {
    return prisma.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true, name: true },
    });
  }

  async sectionExists(classId, sectionId) {
    return prisma.section.findFirst({
      where: { id: sectionId, classId },
      select: { id: true, name: true },
    });
  }

  async subjectExists(classId, subjectId) {
    return prisma.subject.findFirst({
      where: { id: subjectId, classId },
      select: { id: true, name: true },
    });
  }

  async upsertAssignment(data) {
    // NOTE: Prisma unique-where nulls allow nahi karta (subjectId/sectionId nullable hain),
    // is liye manual find + update/create.
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: data.teacherId,
        classId: data.classId,
        subjectId: data.subjectId ?? null,
        sectionId: data.sectionId ?? null,
      },
      select: { id: true },
    });

    if (existing) {
      return prisma.teacherAssignment.update({ where: { id: existing.id }, data });
    }
    return prisma.teacherAssignment.create({ data });
  }

  async listBySchool(schoolId, { teacherId, classId }) {
    const where = {};
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;
    return prisma.teacherAssignment.findMany({
      where: { ...where, class: { schoolId } },
      include: {
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: [{ teacher: { name: "asc" } }, { class: { order: "asc" } }],
    });
  }

  async findById(id) {
    return prisma.teacherAssignment.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, schoolId: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });
  }

  async deleteAssignment(id) {
    return prisma.teacherAssignment.delete({ where: { id } });
  }
}

export default new TeachingAssignmentRepository();