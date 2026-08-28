import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";

class LeaveRequestService {
  async requestLeave(parentId, { studentId, dateFrom, dateTo, reason }) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, parentId, status: "ACTIVE" },
      include: { section: { include: { class: { select: { name: true } } } } },
    });
    if (!student) throw ApiError.notFoundError("Student not found or not linked to your account");
    if (!reason || !reason.trim()) throw ApiError.badRequestError("Please provide a reason for the leave");

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) throw ApiError.badRequestError("Invalid date format");
    if (to < from) throw ApiError.badRequestError("End date cannot be before start date");

    const overlapping = await prisma.leaveRequest.findFirst({
      where: { studentId, status: "APPROVED", dateFrom: { lte: to }, dateTo: { gte: from } },
    });
    if (overlapping) throw ApiError.badRequestError("An approved leave already exists for these dates");

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId,
        parentId,
        schoolId: student.schoolId,
        dateFrom: from,
        dateTo: to,
        reason: reason.trim(),
      },
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    const admins = await notificationService.getSchoolAdmins(student.schoolId);
    const studentName = `${student.firstName} ${student.lastName}`;
    const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();
    const dateStr = from.toLocaleDateString("en-PK", { day: "numeric", month: "short" });

    for (const admin of admins) {
      notificationService.notifyOrgAdmin({
        schoolId: student.schoolId,
        adminEmail: admin.email,
        adminPhone: admin.phone,
        message: `Leave request from parent for ${studentName} (${className}) from ${dateStr}. Reason: ${reason}`,
        title: "Leave Request — Pending Approval",
        details: [
          ["Student", studentName],
          ["Class", className || "—"],
          ["From", from.toLocaleDateString("en-PK")],
          ["To", to.toLocaleDateString("en-PK")],
          ["Reason", reason],
          ["Status", "PENDING"],
        ],
      }).catch(() => {});
    }

    // Portal notification — branch feed me pending approval dikhe.
    portalNotificationService.create({
      schoolId: student.schoolId,
      senderName: "Parent Portal",
      title: "LEAVE_REQUEST",
      body: `Parent requested leave for ${studentName}${className ? ` (${className})` : ""} — ${dateStr}, reason: ${reason}.`,
      category: "STUDENT",
      refType: "LEAVE_REQUEST",
      refId: leave.id,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${student.schoolId}`, "leave_request_created", { id: leave.id, studentName, status: "PENDING" });
    return leave;
  }
}

export default new LeaveRequestService();
