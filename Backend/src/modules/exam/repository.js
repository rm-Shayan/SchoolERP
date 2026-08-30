import prisma from "../../config/db.js";

class ExamRepository {
  async termExists(termId) {
    return prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    });
  }

  async sectionExists(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  async findClassById(id) {
    return prisma.class.findUnique({
      where: { id },
      select: { id: true, schoolId: true, subjects: { select: { id: true } } },
    });
  }

  async createExam(data) {
    return prisma.exam.create({
      data,
      include: {
        term: { include: { academicYear: true } },
        papers: { include: { subject: true, section: true, class: true } },
      },
    });
  }

  async findExamById(id) {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        term: { include: { academicYear: true } },
        papers: { include: { subject: true, section: true, class: true } },
      },
    });
  }

  async updateExamPapers(id, data, papers) {
    return prisma.$transaction(async (tx) => {
      await tx.exam.update({ where: { id }, data });
      await tx.examPaper.deleteMany({ where: { examId: id } });
      if (papers?.length) {
        await tx.examPaper.createMany({
          data: papers.map((p) => ({
            examId: id,
            classId: p.classId,
            subjectId: p.subjectId,
            sectionId: p.sectionId || null,
            date: new Date(p.date),
            startTime: p.startTime || null,
            endTime: p.endTime || null,
            maxMarks: p.maxMarks != null ? p.maxMarks : null,
            roomNumber: p.roomNumber || null,
          })),
        });
      }
      return tx.exam.findUnique({
        where: { id },
        include: {
          term: { include: { academicYear: true } },
          papers: { include: { subject: true, section: true, class: true } },
        },
      });
    });
  }

  async listExamsBySchool(schoolId, { termId, academicYearId, page, pageSize }) {
    const where = { schoolId };
    if (termId) where.termId = termId;
    if (academicYearId) where.term = { academicYearId };

    const [items, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          term: { include: { academicYear: true } },
          papers: { include: { subject: true, section: true, class: true } },
          _count: { select: { results: true } },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.exam.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async deleteExam(id) {
    return prisma.exam.delete({ where: { id } });
  }

  async findSubjectsByClass(classId) {
    return prisma.subject.findMany({
      where: { classId },
      orderBy: { name: "asc" },
    });
  }

  async upsertExamResult(data) {
    return prisma.examResult.upsert({
      where: {
        examId_studentId_subjectId: {
          examId: data.examId,
          studentId: data.studentId,
          subjectId: data.subjectId,
        },
      },
      update: {
        marksObtained: data.marksObtained,
        maxMarks: data.maxMarks,
        remarks: data.remarks || null,
      },
      create: data,
    });
  }

  async findResultsByExam(examId) {
    return prisma.examResult.findMany({
      where: { examId },
      include: {
        student: { include: { parent: true, section: { include: { class: true } } } },
        subject: true,
      },
    });
  }

  async findResultByStudent(examId, studentId) {
    return prisma.examResult.findMany({
      where: { examId, studentId },
      include: { subject: true },
    });
  }

  async studentsByIds(ids) {
    return prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, section: { select: { id: true, classId: true } } },
    });
  }

  async teacherCoverage(teacherId) {
    return prisma.teacherAssignment.findMany({
      where: { teacherId },
      select: { classId: true, sectionId: true, subjectId: true },
    });
  }

  async studentById(studentId) {
    return prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { include: { class: true } } },
    });
  }

  async studentBySchool(schoolId, studentId) {
    return prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { include: { class: true } } },
    });
  }
}

export default new ExamRepository();
