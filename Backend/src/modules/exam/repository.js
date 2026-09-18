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

  async classesByIds(ids) {
    return prisma.class.findMany({
      where: { id: { in: ids } },
      select: { id: true, schoolId: true, subjects: { select: { id: true } } },
    });
  }

  async sectionsByIds(ids) {
    return prisma.section.findMany({
      where: { id: { in: ids } },
      select: { id: true, classId: true },
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
          papers: true, // Only fetch flat paper data, omitting heavy joins for class/section/subject
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

  async markExamPublished(id) {
    return prisma.exam.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async findSubjectsByClass(classId) {
    return prisma.subject.findMany({
      where: { classId },
      orderBy: { name: "asc" },
    });
  }

  /**
   * N individual upserts ki jagah ek transaction:
   * 1 query me existing results dekho → naye createMany (skipDuplicates),
   * already-existing ko parallel updateMany. Round trips 1 + N → ~2.
   */
  async bulkUpsertExamResults(examId, entries) {
    const studentIds = [...new Set(entries.map((e) => e.studentId))];
    const subjectIds = [...new Set(entries.map((e) => e.subjectId))];
    const keyOf = (r) => `${r.studentId}:${r.subjectId}`;

    const existingRows = await prisma.examResult.findMany({
      where: { examId, studentId: { in: studentIds }, subjectId: { in: subjectIds } },
      select: { id: true, studentId: true, subjectId: true },
    });
    const existingKeys = new Set(existingRows.map(keyOf));

    const toCreate = entries.filter((e) => !existingKeys.has(keyOf(e)));
    const toUpdate = entries.filter((e) => existingKeys.has(keyOf(e)));

    await prisma.$transaction(async (tx) => {
      if (toCreate.length) {
        await tx.examResult.createMany({
          data: toCreate.map((e) => ({ examId, ...e })),
          skipDuplicates: true,
        });
      }
      if (toUpdate.length) {
        await Promise.all(
          toUpdate.map((e) =>
            tx.examResult.updateMany({
              where: { examId, studentId: e.studentId, subjectId: e.subjectId },
              data: {
                marksObtained: e.marksObtained,
                maxMarks: e.maxMarks,
                remarks: e.remarks || null,
              },
            })
          )
        );
      }
    });
  }

  async findResultsForEntries(examId, studentIds, subjectIds) {
    return prisma.examResult.findMany({
      where: { examId, studentId: { in: studentIds }, subjectId: { in: subjectIds } },
      include: { student: { include: { parent: true, section: { include: { class: true } } } }, subject: true },
    });
  }

  async findResultsByExam(examId) {
    return prisma.examResult.findMany({
      where: { examId },
      select: {
        id: true,
        examId: true,
        studentId: true,
        subjectId: true,
        marksObtained: true,
        maxMarks: true,
        remarks: true,
        subject: { select: { id: true, name: true, code: true } },
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, status: true } },
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
