import conductRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

class ConductService {
  async createRemark(user, data) {
    const student = await conductRepository.findStudentForRemark(data.studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertOwnSchool(user, student.schoolId);

    // Author: khud (default) ya ADMIN/SUPER_ADMIN kisi teacher ke naam par.
    let author = { id: user.id, name: user.name };
    if (data.teacherId && data.teacherId !== user.id) {
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        throw ApiError.forbiddenError("You can only post remarks on your own behalf");
      }
      const staff = await conductRepository.findStaffForRemark(data.teacherId, student.schoolId);
      if (!staff) throw ApiError.badRequestError("Selected teacher is not active in this branch");
      author = { id: staff.id, name: staff.name };
    }

    const academicYear = await conductRepository.findCurrentAcademicYear(student.schoolId);

    const remark = await conductRepository.createRemark({
      studentId: data.studentId,
      teacherId: author.id,
      academicYearId: academicYear?.id || null,
      type: data.type || "NEUTRAL",
      comment: data.comment,
    });

    // In-app portal notification — email nahi bhejte (remark critical action nahi).
    const studentName = `${student.firstName} ${student.lastName}`;
    const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();

    portalNotificationService.create({
      schoolId: student.schoolId, senderId: author.id, senderName: author.name,
      title: "CONDUCT_REMARK",
      body: `${data.type || "NEUTRAL"} remark recorded for ${studentName}${className ? ` (${className})` : ""}: "${data.comment}".`,
      category: "STUDENT",
      refType: "CONDUCT_REMARK",
      refId: remark.id,
      link: "/conduct",
    }).catch(() => {});

    emitToRoom(`school:${student.schoolId}`, "conduct_remark", {
      id: remark.id, studentId: data.studentId, type: remark.type,
    });

    return {
      ...remark,
      student: {
        id: student.id, firstName: student.firstName, lastName: student.lastName,
        rollNumber: student.rollNumber, school: student.school, section: student.section,
      },
      teacher: author,
    };
  }

  async listByStudent(user, studentId, query) {
    const student = await conductRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertSchoolAccess(user, student.schoolId);
    return conductRepository.listRemarksByStudent(studentId, {
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
      academicYearId: query.academicYearId || undefined,
    });
  }

  async listByTeacher(user, query) {
    assertSchoolAccess(user, user.schoolId);
    return conductRepository.listRemarksByTeacher(user.id, {
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
      academicYearId: query.academicYearId || undefined,
    });
  }

  async listBySection(user, sectionId, query) {
    return conductRepository.listRemarksBySection(sectionId, {
      type: query.type,
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
    });
  }

  async listAllBySchool(user, query) {
    assertSchoolAccess(user, user.schoolId);
    return conductRepository.listRemarksBySchool(user.schoolId, {
      type: query.type || undefined,
      teacherId: query.teacherId || undefined,
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 25)),
    });
  }

  async getRemark(user, id) {
    const remark = await conductRepository.findRemarkById(id);
    if (!remark) throw ApiError.notFoundError("Remark not found");
    assertSchoolAccess(user, remark.student.schoolId);
    return remark;
  }

  async updateRemark(user, id, data) {
    const remark = await conductRepository.findRemarkById(id);
    if (!remark) throw ApiError.notFoundError("Remark not found");
    assertOwnSchool(user, remark.student.schoolId);
    if (remark.teacherId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw ApiError.forbiddenError("You can only edit your own remarks");
    }

    const updateData = {};
    if (data.type) updateData.type = data.type;
    if (data.comment !== undefined) updateData.comment = data.comment;

    const updated = await conductRepository.updateRemark(id, updateData);

    // Portal notification — remark updated (fire-and-forget)
    const studentName = `${remark.student.firstName} ${remark.student.lastName}`;
    portalNotificationService.create({
      schoolId: remark.student.schoolId, senderId: user.id, senderName: user.name,
      title: "CONDUCT_REMARK",
      body: `Remark updated for ${studentName}: "${data.comment || remark.comment}".`,
      category: "STUDENT",
      refType: "CONDUCT_REMARK",
      refId: id,
      link: "/conduct",
    }).catch(() => {});

    return updated;
  }

  async deleteRemark(user, id) {
    const remark = await conductRepository.findRemarkById(id);
    if (!remark) throw ApiError.notFoundError("Remark not found");
    assertOwnSchool(user, remark.student.schoolId);
    if (remark.teacherId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw ApiError.forbiddenError("You can only delete your own remarks");
    }

    await conductRepository.deleteRemark(id);

    // Portal notification — remark deleted (fire-and-forget)
    const studentName = `${remark.student.firstName} ${remark.student.lastName}`;
    portalNotificationService.create({
      schoolId: remark.student.schoolId, senderId: user.id, senderName: user.name,
      title: "CONDUCT_REMARK",
      body: `Remark deleted for ${studentName}: "${remark.comment}".`,
      category: "STUDENT",
      refType: "CONDUCT_REMARK",
      refId: id,
      link: "/conduct",
    }).catch(() => {});

    return true;
  }
}

export default new ConductService();
