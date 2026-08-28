import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import redis from "../../config/redis.js";

class LeaveService {
  async listAll(schoolId, { status, page = 1, limit = 20 } = {}) {
    const where = { schoolId };
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rollNumber: true,
              section: { include: { class: { select: { name: true } } } },
            },
          },
          parent: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async review(schoolId, leaveId, { status, remarks }, adminId) {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw ApiError.badRequestError("Status must be APPROVED or REJECTED");
    }

    const leave = await prisma.leaveRequest.findFirst({
      where: { id: leaveId, schoolId, status: "PENDING" },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            section: { include: { class: { select: { name: true } } } },
          },
        },
        parent: { select: { id: true, name: true, phone: true, whatsappNo: true, email: true } },
      },
    });
    if (!leave) throw ApiError.notFoundError("Leave request not found or already reviewed");

    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status, reviewedBy: adminId, reviewedAt: new Date(), remarks: remarks || null },
    });

    if (status === "APPROVED") {
      const from = new Date(leave.dateFrom);
      const to = new Date(leave.dateTo);
      const current = new Date(from);
      const upserts = [];
      while (current <= to) {
        const day = new Date(current);
        day.setHours(0, 0, 0, 0);
        upserts.push(
          prisma.attendanceRecord.upsert({
            where: { studentId_date: { studentId: leave.studentId, date: day } },
            update: { status: "LEAVE", remarks: `Leave approved: ${leave.reason}` },
            create: { studentId: leave.studentId, date: day, status: "LEAVE", remarks: `Leave approved: ${leave.reason}` },
          })
        );
        current.setDate(current.getDate() + 1);
      }
      await Promise.all(upserts);
      try {
        const dateKey = from.toISOString().split("T")[0];
        await redis.del(`attendance:daily:${schoolId}:${dateKey}`);
      } catch (_) {}
    }

    const studentName = `${leave.student.firstName} ${leave.student.lastName}`;
    const statusText = status === "APPROVED" ? "APPROVED" : "REJECTED";
    const parentMsg = status === "APPROVED"
      ? `Your leave request for ${studentName} has been APPROVED. Leave dates: ${new Date(leave.dateFrom).toLocaleDateString("en-PK")} to ${new Date(leave.dateTo).toLocaleDateString("en-PK")}.`
      : `Your leave request for ${studentName} has been REJECTED.${remarks ? ` Reason: ${remarks}` : ""}`;

    notificationService.notifyParent({
      schoolId,
      parentEmail: leave.parent.email,
      parentPhone: leave.parent.phone,
      message: parentMsg,
      title: `Leave Request ${statusText}`,
      details: [
        ["Student", studentName],
        ["From", new Date(leave.dateFrom).toLocaleDateString("en-PK")],
        ["To", new Date(leave.dateTo).toLocaleDateString("en-PK")],
        ["Status", statusText],
        ...(remarks ? [["Remarks", remarks]] : []),
      ],
    }).catch(() => {});

    // Portal notification — branch feed ko review ka pata chale.
    portalNotificationService.create({
      schoolId,
      senderName: "Leave Management",
      title: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      body: `Leave for ${studentName} has been ${statusText}${remarks ? ` (${remarks})` : ""}.`,
      category: "STUDENT",
      refType: "LEAVE_REQUEST",
      refId: leaveId,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${schoolId}`, "leave_request_reviewed", { id: leaveId, studentName, status });
    return leave;
  }

  async hasApprovedLeave(studentId, date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const leave = await prisma.leaveRequest.findFirst({
      where: { studentId, status: "APPROVED", dateFrom: { lte: dayEnd }, dateTo: { gte: dayStart } },
    });
    return !!leave;
  }
}

export default new LeaveService();
