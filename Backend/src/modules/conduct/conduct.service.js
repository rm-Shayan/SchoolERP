import conductRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

class ConductService {
  /**
   * PRD §6 — Remark: 10-second form/command.
   * Teacher selects a student, picks a type (POSITIVE/NEUTRAL/NEGATIVE),
   * types a one-line comment → parent is emailed (PRD §5).
   */
  async createRemark(user, data) {
    const student = await conductRepository.findStudentById(data.studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertOwnSchool(user, student.schoolId);

    const remark = await conductRepository.createRemark({
      studentId: data.studentId,
      teacherId: user.id,
      type: data.type || "NEUTRAL",
      comment: data.comment,
    });

    // Email parent — NEGATIVE + POSITIVE both notify (PRD §5 remarks WhatsApp/Email)
    const studentName = `${student.firstName} ${student.lastName}`;
    const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();
    const emoji = data.type === "POSITIVE" ? "Great news!" : data.type === "NEGATIVE" ? "Important update" : "Update";
    await notificationService.notifyParent({
      schoolId: student.schoolId,
      parentEmail: student.parent?.email,
      parentPhone: student.parent?.phone,
      message: `${emoji} A remark has been recorded for ${studentName} (${student.section?.class?.name || ""} ${student.section?.name || ""}).\n\n"${data.comment}"`,
      title: `Student Remark — ${data.type || "NEUTRAL"}`,
    }).catch(() => {});

    // Portal notification — branch admin ko remark ka pata chale.
    portalNotificationService.create({
      schoolId: student.schoolId, senderId: user.id, senderName: user.name,
      title: "CONDUCT_REMARK",
      body: `${data.type || "NEUTRAL"} remark recorded for ${studentName}${className ? ` (${className})` : ""}: "${data.comment}".`,
      category: "STUDENT",
      refType: "CONDUCT_REMARK",
      refId: remark.id,
      link: "/conduct",
    }).catch(() => {});

    emitToRoom(`school:${student.schoolId}`, "conduct_remark", {
      id: remark.id,
      studentId: data.studentId,
      type: remark.type,
    });

    return conductRepository.findRemarkById(remark.id);
  }

  async listByStudent(user, studentId, query) {
    const student = await conductRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");
    assertSchoolAccess(user, student.schoolId);

    return conductRepository.listRemarksByStudent(studentId, {
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
    });
  }

  async listBySection(user, sectionId, query) {
    return conductRepository.listRemarksBySection(sectionId, {
      type: query.type,
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
    });
  }

  async getRemark(user, id) {
    const remark = await conductRepository.findRemarkById(id);
    if (!remark) throw ApiError.notFoundError("Remark not found");
    assertSchoolAccess(user, remark.student.schoolId);
    return remark;
  }
}

export default new ConductService();
