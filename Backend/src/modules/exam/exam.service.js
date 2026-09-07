import examRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

class ExamService {
  /**
   * Normalize + validate paper list. Dedupes by classId:subjectId and returns
   * Prisma-ready paper objects (already scoped to the given school).
   */
  async _validatePapers(schoolId, papers) {
    if (!papers?.length) return { creates: [] };
    const seen = new Set();
    const creates = [];
    for (const p of papers) {
      const cls = await examRepository.findClassById(p.classId);
      if (!cls || cls.schoolId !== schoolId) {
        throw ApiError.badRequestError("Paper class does not belong to this school");
      }
      if (!cls.subjects.some((s) => s.id === p.subjectId)) {
        throw ApiError.badRequestError("Subject does not belong to the given class");
      }
      if (p.sectionId) {
        const sec = await examRepository.sectionExists(p.sectionId);
        if (!sec || sec.classId !== p.classId) {
          throw ApiError.badRequestError("Section does not belong to the given class");
        }
      }
      const key = `${p.classId}:${p.subjectId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      creates.push({
        classId: p.classId,
        subjectId: p.subjectId,
        sectionId: p.sectionId || null,
        date: new Date(p.date),
        startTime: p.startTime || null,
        endTime: p.endTime || null,
        maxMarks: p.maxMarks != null ? p.maxMarks : null,
        roomNumber: p.roomNumber || null,
      });
    }
    return { creates };
  }

  _guardPaperDates(creates, startDate, endDate) {
    const ss = startDate.toISOString().slice(0, 10);
    const es = endDate.toISOString().slice(0, 10);
    for (const p of creates) {
      const ds = p.date.toISOString().slice(0, 10);
      if (ds < ss || ds > es) {
        throw ApiError.badRequestError(`Paper date ${ds} is outside the exam window (${ss} → ${es})`);
      }
    }
  }

  async createExam(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const term = await examRepository.termExists(data.termId);
    if (!term) throw ApiError.notFoundError("Term not found");
    if (term.academicYear.schoolId !== targetSchoolId) {
      throw ApiError.badRequestError("Term does not belong to the given school");
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate < startDate) throw ApiError.badRequestError("End date cannot be before start date");

    const { creates } = await this._validatePapers(targetSchoolId, data.papers);
    this._guardPaperDates(creates, startDate, endDate);

    const exam = await examRepository.createExam({
      schoolId: targetSchoolId,
      termId: data.termId,
      name: data.name || `${term.name} Examination`,
      startDate,
      endDate,
      papers: creates.length > 0 ? { create: creates } : undefined,
    });

    portalNotificationService.create({
      schoolId: targetSchoolId, senderId: user.id, senderName: user.name,
      title: "EXAM_CREATED", body: `"${exam.name}" scheduled from ${new Date(exam.startDate).toLocaleDateString("en-PK")} to ${new Date(exam.endDate).toLocaleDateString("en-PK")}.`,
      category: "EXAM", refType: "EXAM", refId: exam.id, link: "/exams",
    }).catch(() => {});

    return exam;
  }

  async listExams(user, schoolId, { termId, academicYearId, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    return examRepository.listExamsBySchool(targetSchoolId, {
      termId,
      academicYearId,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  async getExam(user, id) {
    const exam = await examRepository.findExamById(id);
    if (!exam) throw ApiError.notFoundError("Exam not found");
    assertSchoolAccess(user, exam.schoolId);
    return exam;
  }

  async deleteExam(user, id) {
    const exam = await this.getExam(user, id);
    assertOwnSchool(user, exam.schoolId);
    await examRepository.deleteExam(id);

    portalNotificationService.create({
      schoolId: exam.schoolId, senderId: user.id, senderName: user.name,
      title: "EXAM_DELETED", body: `"${exam.name}" has been deleted.`,
      category: "EXAM", refType: "EXAM", refId: id, link: "/exams",
    }).catch(() => {});

    return true;
  }

  /** PUT /exams/:id — update exam dates/details + replace date-wise papers. */
  async updateExam(user, id, data) {
    const exam = await this.getExam(user, id);
    assertOwnSchool(user, exam.schoolId);

    const updateData = {};
    if (data.termId) {
      const term = await examRepository.termExists(data.termId);
      if (!term) throw ApiError.notFoundError("Term not found");
      if (term.academicYear.schoolId !== exam.schoolId) {
        throw ApiError.badRequestError("Term does not belong to the given school");
      }
      updateData.termId = data.termId;
    }
    if (data.name != null) updateData.name = data.name;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      throw ApiError.badRequestError("End date cannot be before start date");
    }

    const { creates } = await this._validatePapers(exam.schoolId, data.papers);
    this._guardPaperDates(
      creates,
      updateData.startDate || new Date(exam.startDate),
      updateData.endDate || new Date(exam.endDate)
    );

    const updated = await examRepository.updateExamPapers(id, updateData, creates);

    portalNotificationService.create({
      schoolId: exam.schoolId, senderId: user.id, senderName: user.name,
      title: "EXAM_UPDATED", body: `"${updated.name}" date sheet updated — papers assigned date-wise.`,
      category: "EXAM", refType: "EXAM", refId: id, link: "/exams",
    }).catch(() => {});

    emitToRoom(`school:${exam.schoolId}`, "exam_date_sheet_updated", { examId: id });
    return updated;
  }

  /**
   * PRD §6 — Marks/result: bulk Excel-style entry.
   * `entries`: [{ studentId, subjectId, marksObtained, maxMarks, remarks }]
   * Results are upserted in bulk (re-entry allowed for corrections).
   * TEACHER role sirf apne assigned sections/subjects ke results daal sakta hai.
   */
  async enterResults(user, examId, { sectionId, entries }) {
    const exam = await this.getExam(user, examId);
    assertOwnSchool(user, exam.schoolId);

    if (!entries?.length) {
      throw ApiError.badRequestError("No result entries provided");
    }

    if (user.role === "TEACHER") {
      const coverage = await examRepository.teacherCoverage(user.id);
      const studentMap = new Map(
        (await examRepository.studentsByIds(entries.map((e) => e.studentId))).map((s) => [s.id, s])
      );

      for (const entry of entries) {
        const student = studentMap.get(entry.studentId);
        if (!student?.section) throw ApiError.badRequestError("Student not found");
        const allowed = coverage.some(
          (a) =>
            a.classId === student.section.classId &&
            (a.sectionId === null || a.sectionId === student.section.id) &&
            (a.subjectId === null || a.subjectId === entry.subjectId)
        );
        if (!allowed) {
          throw ApiError.forbiddenError("Aap sirf apne assigned class/section/subject ke results daal sakte hain");
        }
      }
    }

    let results = await Promise.all(
      entries.map((entry) =>
        examRepository.upsertExamResult({
          examId,
          studentId: entry.studentId,
          subjectId: entry.subjectId,
          marksObtained: Number(entry.marksObtained),
          maxMarks: Number(entry.maxMarks),
          remarks: entry.remarks || null,
        })
      )
    );

    emitToRoom(`school:${exam.schoolId}`, "exam_results_entered", {
      examId,
      count: results.length,
    });

    return results;
  }

  /**
   * Publish results for an exam → portal notification only (NO email).
   * Parents results portal me view karenge, email par result PDF/shayan nahi jata.
   */
  async publishResults(user, examId) {
    const exam = await this.getExam(user, examId);
    assertOwnSchool(user, exam.schoolId);

    const results = await examRepository.findResultsByExam(examId);
    if (!results.length) {
      throw ApiError.badRequestError("No results recorded for this exam yet");
    }

    const byStudent = results.reduce((acc, r) => {
      const sid = r.studentId;
      if (!acc[sid]) acc[sid] = { student: r.student, results: [] };
      acc[sid].results.push(r);
      return acc;
    }, {});

    const activeCount = Object.values(byStudent).filter(({ student }) => student.status === "ACTIVE").length;

    // Portal notification to admin — sirf in-app
    portalNotificationService.create({
      schoolId: exam.schoolId, senderId: user.id, senderName: user.name,
      title: "EXAM_PUBLISHED", body: `Results for "${exam.name}" published — ${activeCount} student(s) ke results ab portal me available hain.`,
      category: "EXAM", refType: "EXAM", refId: examId, link: "/exams",
    }).catch(() => {});

    emitToRoom(`school:${exam.schoolId}`, "exam_results_published", { examId, notified: activeCount });
    return { examId, notified: activeCount, students: Object.keys(byStudent).length };
  }

  /**
   * Get a single student's result card for an exam (portal/office).
   */
  async getStudentResult(user, examId, studentId) {
    const exam = await this.getExam(user, examId);
    assertSchoolAccess(user, exam.schoolId);
    return examRepository.findResultByStudent(examId, studentId);
  }

  /** Result card: per-subject breakdown + total/percentage/grade/division. */
  async getStudentResultCard(user, examId, studentId) {
    const exam = await this.getExam(user, examId);
    assertSchoolAccess(user, exam.schoolId);

    const student = await examRepository.studentBySchool(exam.schoolId, studentId);
    if (!student) throw ApiError.notFoundError("Student not found");

    const results = await examRepository.findResultByStudent(examId, studentId);
    const subjects = results.map((r) => ({
      subject: r.subject.name,
      marksObtained: Number(r.marksObtained),
      maxMarks: Number(r.maxMarks),
      remarks: r.remarks || null,
    }));

    const totalObtained = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

    let grade = "F";
    if (percentage >= 80) grade = "A+";
    else if (percentage >= 70) grade = "A";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C";
    else if (percentage >= 40) grade = "D";

    const division =
      percentage >= 60 ? "First" : percentage >= 45 ? "Second" : percentage >= 33 ? "Third" : "Fail";

    return {
      exam: { id: exam.id, name: exam.name, startDate: exam.startDate, endDate: exam.endDate, term: exam.term?.name },
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        rollNumber: student.rollNumber,
        section: student.section ? `${student.section.class?.name || ""} ${student.section.name || ""}`.trim() : "—",
      },
      subjects,
      totalObtained,
      totalMax,
      percentage,
      grade,
      division,
      result: division === "Fail" ? "FAIL" : "PASS",
    };
  }
}

export default new ExamService();
