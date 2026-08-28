import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import portalNotificationService from "../notification/notification.portalService.js";

class StaffLeaveService {
  async listAll(schoolId, { status, staffId, page = 1, limit = 20 } = {}) {
    const where = { schoolId, leaveType: { not: null } };
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    const [requests, total] = await Promise.all([
      prisma.staffAttendance.findMany({
        where,
        include: {
          staff: { select: { id: true, name: true, email: true, role: true, username: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staffAttendance.count({ where }),
    ]);

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async review(schoolId, leaveId, { status, remarks }, adminId) {
    if (!["APPROVED_LEAVE", "REJECTED_LEAVE"].includes(status)) {
      throw ApiError.badRequestError("Status must be APPROVED_LEAVE or REJECTED_LEAVE");
    }

    const leave = await prisma.staffAttendance.findFirst({
      where: { id: leaveId, schoolId, status: "PENDING_LEAVE" },
      include: { staff: { select: { id: true, name: true, phone: true, email: true } } },
    });
    if (!leave) throw ApiError.notFoundError("Leave request not found or already reviewed");

    await prisma.staffAttendance.update({
      where: { id: leaveId },
      data: { status, reviewedBy: adminId, reviewedAt: new Date(), remarks: remarks || null },
    });

    if (status === "APPROVED_LEAVE" && leave.dateTo) {
      const from = new Date(leave.date);
      const to = new Date(leave.dateTo);
      const days = Math.ceil((to - from) / 86400000) + 1;
      const rows = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        rows.push({ staffId: leave.staffId, schoolId, date: d, status: "LEAVE", leaveType: leave.leaveType });
      }
      await prisma.staffAttendance.createMany({ data: rows, skipDuplicates: true });
    }

    const statusText = status === "APPROVED_LEAVE" ? "APPROVED" : "REJECTED";
    const dateFromStr = new Date(leave.date).toLocaleDateString("en-PK");
    const dateToStr = leave.dateTo ? new Date(leave.dateTo).toLocaleDateString("en-PK") : dateFromStr;
    portalNotificationService.create({
      schoolId,
      senderName: "Leave Management",
      title: "STAFF_LEAVE",
      body: `${leave.staff.name}'s ${leave.leaveType} leave (${dateFromStr}–${dateToStr}) was ${statusText}.${remarks ? " Remarks: " + remarks : ""}`,
      category: "STAFF",
      refType: "STAFF_LEAVE",
      refId: leaveId,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${schoolId}`, "staff_leave_request_reviewed", {
      id: leaveId,
      staffName: leave.staff.name,
      status,
    });
  }

  async create(schoolId, { staffId, dateFrom, dateTo, leaveType, reason, status = "PENDING_LEAVE" }, adminId) {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, schoolId, isActive: true },
      select: { id: true, name: true },
    });
    if (!staff) throw ApiError.notFoundError("Staff not found in this branch");
    if (!reason?.trim()) throw ApiError.badRequestError("Reason is required");

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      throw ApiError.badRequestError("Invalid date range");
    }

    const data = {
      schoolId,
      staffId,
      date: from,
      dateTo: to,
      status,
      leaveType: leaveType || "CASUAL",
      reason: reason.trim(),
    };
    if (status !== "PENDING_LEAVE") {
      data.reviewedBy = adminId;
      data.reviewedAt = new Date();
    }

    const leave = await prisma.staffAttendance.create({ data });

    if (status === "APPROVED_LEAVE") {
      const days = Math.ceil((to - from) / 86400000) + 1;
      const rows = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        rows.push({ staffId, schoolId, date: d, status: "LEAVE", leaveType: leaveType || "CASUAL" });
      }
      await prisma.staffAttendance.createMany({ data: rows, skipDuplicates: true });
    }

    portalNotificationService.create({
      schoolId,
      senderName: "Leave Management",
      title: "STAFF_LEAVE",
      body: `${staff.name}'s ${leaveType || "CASUAL"} leave (${from.toLocaleDateString("en-PK")}–${to.toLocaleDateString("en-PK")}) was ${status.replace("_LEAVE", "").toLowerCase()} by admin.`,
      category: "STAFF",
      refType: "STAFF_LEAVE",
      refId: leave.id,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${schoolId}`, "staff_leave_request_created", {
      id: leave.id,
      staffName: staff.name,
      status,
    });
    return leave;
  }

  async remove(schoolId, id) {
    const leave = await prisma.staffAttendance.findFirst({ where: { id, schoolId, leaveType: { not: null } } });
    if (!leave) throw ApiError.notFoundError("Leave request not found");
    await prisma.staffAttendance.delete({ where: { id } });
    emitToRoom(`school:${schoolId}`, "staff_leave_request_deleted", { id });
    return { success: true };
  }
}

export default new StaffLeaveService();
