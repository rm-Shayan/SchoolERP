import portalRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import prisma from "../../config/db.js";
import notificationService from "../../services/notification.service.js";
import { emitToRoom } from "../../config/websocket.js";

class PortalService {
  async getOverview(portal) {
    return portalRepository.getOverview(portal.studentIds, portal.schoolId, portal.sectionIds);
  }

  async getAttendance(portal, { month, year }) {
    const now = new Date();
    const m = Number(month) || now.getMonth() + 1;
    const y = Number(year) || now.getFullYear();
    return portalRepository.getAttendanceMonthSummary(portal.studentIds, y, m);
  }

  async getFees(portal) {
    const [records, summary] = await Promise.all([
      portalRepository.getFeeRecords(portal.studentIds),
      portalRepository.getFeeSummary(portal.studentIds),
    ]);
    return { records, summary };
  }

  async getHomework(portal) {
    return portalRepository.getHomework(portal.sectionIds);
  }

  async getCirculars(portal) {
    return portalRepository.getCirculars(portal.schoolId);
  }

  async getResults(portal) {
    return portalRepository.getExamResults(portal.studentIds);
  }

  async getTimetable(portal) {
    // Return timetable for all child sections
    const allSlots = await Promise.all(
      portal.sectionIds.map((id) => portalRepository.getTimetable(id))
    );
    return allSlots.flat();
  }

  // ── Exam Date Sheets ──────────────────────────────────

  async getExams(portal) {
    const classIds = await portalRepository.sectionClassIds(portal.sectionIds);
    return portalRepository.examSheetsForClasses(portal.schoolId, classIds);
  }

  async getExamDateSheet(portal, examId) {
    const exam = await portalRepository.findExamById(examId);
    if (!exam) throw ApiError.notFoundError("Exam not found");
    if (exam.schoolId !== portal.schoolId) {
      throw ApiError.forbiddenError("You cannot view this exam");
    }
    return exam;
  }

  async getTimetablePdfSlots(portal) {
    return this.getTimetable(portal);
  }

  async getConduct(portal) {
    return portalRepository.getConductRemarks(portal.studentIds);
  }

  async getPTM(portal) {
    return portalRepository.getPTMSessions(portal.schoolId, portal.sectionIds, portal.studentIds);
  }

  // ── Leave Requests ──────────────────────────────────

  async getLeaveRequests(portal) {
    // Parent portal: parentId is portal.id. Student portal: resolve via student.
    const parentId = await this._resolveParentId(portal);
    if (!parentId) return [];
    return portalRepository.getLeaveRequests(parentId, portal.studentIds);
  }

  async createLeaveRequest(portal, { studentId, dateFrom, dateTo, reason }) {
    if (!reason?.trim()) throw ApiError.badRequestError("Reason is required");
    if (!dateFrom || !dateTo) throw ApiError.badRequestError("Both dates are required");
    if (new Date(dateTo) < new Date(dateFrom)) throw ApiError.badRequestError("End date cannot be before start date");

    // Verify student belongs to this portal
    if (!portal.studentIds.includes(studentId)) {
      throw ApiError.forbiddenError("You can only request leave for your own children");
    }

    // Check overlapping approved leaves
    const overlap = await portalRepository.findOverlappingApprovedLeave(studentId, dateFrom, dateTo);
    if (overlap) throw ApiError.badRequestError("An approved leave already exists for these dates");

    const parentId = await this._resolveParentId(portal);
    if (!parentId) throw ApiError.badRequestError("Parent account not found");

    const leave = await portalRepository.createLeaveRequest(parentId, portal.schoolId, studentId, { dateFrom, dateTo, reason });

    // Notify school admin
    try {
      const admins = await notificationService.getSchoolAdmins(portal.schoolId);
      const studentName = `${leave.student.firstName} ${leave.student.lastName}`;
      for (const admin of admins) {
        notificationService.notifyOrgAdmin({
          schoolId: portal.schoolId, adminEmail: admin.email, adminPhone: admin.phone,
          message: `Leave request from parent for ${studentName}. Reason: ${reason}`,
          title: "Leave Request — Pending Approval",
          details: [["Student", studentName], ["From", new Date(dateFrom).toLocaleDateString("en-PK")], ["To", new Date(dateTo).toLocaleDateString("en-PK")], ["Reason", reason], ["Status", "PENDING"]],
        }).catch(() => {});
      }
    } catch (_) {}

    emitToRoom(`school:${portal.schoolId}`, "leave_request_created", {
      id: leave.id, studentName: `${leave.student.firstName} ${leave.student.lastName}`, status: "PENDING",
    });

    return leave;
  }

  async _resolveParentId(portal) {
    if (portal.type === "parent") return portal.id;
    // Student portal: look up parentId from the student record
    const student = await prisma.student.findUnique({ where: { id: portal.id }, select: { parentId: true } });
    return student?.parentId || null;
  }
}

export default new PortalService();
