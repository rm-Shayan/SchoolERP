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
    return prisma.conductRemark.create({
      data,
      include: {
        academicYear: { select: { id: true, name: true } },
        ptmSession: { select: { id: true, title: true, scheduledAt: true } },
      },
    });
  }

  async findStudentForRemark(id) {
    return prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        schoolId: true,
        sectionId: true,
        parent: { select: { id: true, email: true, phone: true } },
        school: { select: { id: true, name: true } },
        section: { select: { name: true, class: { select: { name: true } } } },
      },
    });
  }

  async findCurrentAcademicYear(schoolId) {
    return prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
  }

  /** PTM session par remark link karne se pehle scope validation ke liye. */
  async findPTMForRemark(id) {
    return prisma.pTMSession.findUnique({
      where: { id },
      select: { id: true, schoolId: true, scope: true, studentId: true, sectionIds: true },
    });
  }

  /** Section belong-karta hai kis school ko — listBySection query ki access check. */
  async findSectionScope(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, class: { select: { schoolId: true } } },
    });
  }

  /** Staff member on whose behalf an admin can author a remark (same school). */
  async findStaffForRemark(id, schoolId) {
    return prisma.user.findFirst({
      where: {
        id,
        schoolId,
        isActive: true,
        role: { in: ["TEACHER", "ADMIN", "RECEPTIONIST"] },
      },
      select: { id: true, name: true, role: true },
    });
  }

  async findRemarkById(id) {
    return prisma.conductRemark.findUnique({
      where: { id },
      include: {
        student: { include: { school: true, parent: { select: { id: true } } } },
        teacher: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        ptmSession: { select: { id: true, title: true, scheduledAt: true } },
      },
    });
  }

  async listRemarksByStudent(studentId, { page, pageSize, academicYearId }) {
    const where = { studentId };
    if (academicYearId) where.academicYearId = academicYearId;
    const [items, total] = await Promise.all([
      prisma.conductRemark.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
          ptmSession: { select: { id: true, title: true, scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listRemarksByTeacher(teacherId, { page, pageSize, academicYearId }) {
    const where = { teacherId };
    if (academicYearId) where.academicYearId = academicYearId;
    const [items, total] = await Promise.all([
      prisma.conductRemark.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { include: { class: true } } } },
          academicYear: { select: { id: true, name: true } },
          ptmSession: { select: { id: true, title: true, scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where }),
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
          academicYear: { select: { id: true, name: true } },
          ptmSession: { select: { id: true, title: true, scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listRemarksBySchool(schoolId, { type, teacherId, page, pageSize }) {
    const where = { student: { section: { class: { schoolId } } } };
    if (type) where.type = type;
    if (teacherId) where.teacherId = teacherId;
    const [items, total] = await Promise.all([
      prisma.conductRemark.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { include: { class: true } } } },
          academicYear: { select: { id: true, name: true } },
          ptmSession: { select: { id: true, title: true, scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conductRemark.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async updateRemark(id, data) {
    return prisma.conductRemark.update({
      where: { id },
      data,
      include: {
        student: { include: { section: { include: { class: true } } } },
        teacher: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        ptmSession: { select: { id: true, title: true, scheduledAt: true } },
      },
    });
  }

  async deleteRemark(id) {
    return prisma.conductRemark.delete({ where: { id } });
  }
}

export default new ConductRepository();
