import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import redis from "../../config/redis.js";

class LeaveCrudService {
  async create(schoolId, { studentId, dateFrom, dateTo, reason, status = "PENDING" }, adminId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        parentId: true,
        parent: { select: { email: true, phone: true } },
      },
    });
    if (!student) throw ApiError.notFoundError("Student not found in this branch");
    if (!reason?.trim()) throw ApiError.badRequestError("Reason is required");

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      throw ApiError.badRequestError("Invalid date range");
    }
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      throw ApiError.badRequestError("Invalid status");
    }

    const data = {
      studentId,
      parentId: student.parentId,
      schoolId,
      dateFrom: from,
      dateTo: to,
      reason: reason.trim(),
      status,
    };
    if (status !== "PENDING") {
      data.reviewedBy = adminId;
      data.reviewedAt = new Date();
    }

    const leave = await prisma.leaveRequest.create({ data });

    if (status === "APPROVED") {
      await this._applyAttendance(schoolId, studentId, from, to, reason);
      const studentName = `${student.firstName} ${student.lastName}`;
      await notificationService.notifyParent({
        schoolId,
        parentEmail: student.parent?.email,
        parentPhone: student.parent?.phone,
        title: "Leave Request APPROVED",
        message: `Your leave request for ${studentName} (${from.toLocaleDateString("en-PK")}–${to.toLocaleDateString("en-PK")}) was APPROVED by admin.`,
        details: [
          ["Student", studentName],
          ["From", from.toLocaleDateString("en-PK")],
          ["To", to.toLocaleDateString("en-PK")],
          ["Status", "APPROVED"],
        ],
      }).catch(() => {});
    }

    portalNotificationService.create({
      schoolId,
      senderName: "Leave Management",
      title: status === "APPROVED" ? "LEAVE_APPROVED" : status === "REJECTED" ? "LEAVE_REJECTED" : "LEAVE_REQUEST",
      body: `Leave for ${student.firstName} ${student.lastName} ${status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : "requested"} (${from.toLocaleDateString("en-PK")} – ${to.toLocaleDateString("en-PK")}).`,
      category: "STUDENT",
      refType: "LEAVE_REQUEST",
      refId: leave.id,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${schoolId}`, "leave_request_created", { id: leave.id, status });
    return leave;
  }

  async update(schoolId, id, { dateFrom, dateTo, reason, status }, adminId) {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, parentId: true, parent: { select: { email: true, phone: true } } } },
      },
    });
    if (!leave) throw ApiError.notFoundError("Leave request not found");
    if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)) {
      throw ApiError.badRequestError("Invalid date range");
    }

    const data = {};
    if (reason !== undefined) data.reason = reason.trim();
    if (status !== undefined) {
      if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        throw ApiError.badRequestError("Invalid status");
      }
      data.status = status;
      data.reviewedBy = adminId;
      data.reviewedAt = new Date();
    }
    if (dateFrom !== undefined) data.dateFrom = new Date(dateFrom);
    if (dateTo !== undefined) data.dateTo = new Date(dateTo);

    const updated = await prisma.leaveRequest.update({ where: { id }, data });

    // Status PENDING → APPROVED hon par student ke attendance par LEAVE apply
    // karo + parent ko email + portal notification (create() jaisa hi behavior).
    if (status === "APPROVED" && leave.status !== "APPROVED") {
      await this._applyAttendance(schoolId, updated.studentId, updated.dateFrom, updated.dateTo, updated.reason);
      const studentName = `${leave.student.firstName} ${leave.student.lastName}`;
      notificationService.notifyParent({
        schoolId,
        parentEmail: leave.student.parent?.email,
        parentPhone: leave.student.parent?.phone,
        title: "Leave Request APPROVED",
        message: `Your leave request for ${studentName} (${new Date(updated.dateFrom).toLocaleDateString("en-PK")}–${new Date(updated.dateTo).toLocaleDateString("en-PK")}) was APPROVED by admin.`,
        details: [
          ["Student", studentName],
          ["From", new Date(updated.dateFrom).toLocaleDateString("en-PK")],
          ["To", new Date(updated.dateTo).toLocaleDateString("en-PK")],
          ["Status", "APPROVED"],
        ],
      }).catch(() => {});
    }

    // Portal notification for the branch admin feed (class/section context).
    const studentName = `${leave.student.firstName} ${leave.student.lastName}`;
    const statusText = status || leave.status;
    portalNotificationService.create({
      schoolId,
      senderName: "Leave Management",
      title: statusText === "APPROVED" ? "LEAVE_APPROVED" : statusText === "REJECTED" ? "LEAVE_REJECTED" : "LEAVE_REQUEST",
      body: `Leave for ${studentName} ${statusText === "APPROVED" ? "approved" : statusText === "REJECTED" ? "rejected" : "updated"} (${new Date(updated.dateFrom).toLocaleDateString("en-PK")} – ${new Date(updated.dateTo).toLocaleDateString("en-PK")}).`,
      category: "STUDENT",
      refType: "LEAVE_REQUEST",
      refId: id,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${schoolId}`, "leave_request_updated", {
      id,
      status: data.status || leave.status,
      studentName,
    });
    return updated;
  }

  async remove(schoolId, id) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id, schoolId } });
    if (!leave) throw ApiError.notFoundError("Leave request not found");
    await prisma.leaveRequest.delete({ where: { id } });
    emitToRoom(`school:${schoolId}`, "leave_request_deleted", { id });
    return { success: true };
  }

  async _applyAttendance(schoolId, studentId, from, to, reason) {
    const current = new Date(from);
    const upserts = [];
    while (current <= to) {
      const day = new Date(current);
      day.setHours(0, 0, 0, 0);
      upserts.push(
        prisma.attendanceRecord.upsert({
          where: { studentId_date: { studentId, date: day } },
          update: { status: "LEAVE", remarks: `Leave approved: ${reason}` },
          create: { studentId, date: day, status: "LEAVE", remarks: `Leave approved: ${reason}` },
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
}

export default new LeaveCrudService();
