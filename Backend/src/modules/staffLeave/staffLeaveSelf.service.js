import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import portalNotificationService from "../notification/notification.portalService.js";

class StaffLeaveSelfService {
  async requestLeave(staffId, { dateFrom, dateTo, leaveType, reason }) {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, isActive: true },
      select: { id: true, name: true, schoolId: true, role: true },
    });
    if (!staff) throw ApiError.notFoundError("Staff member not found");
    if (!staff.schoolId) throw ApiError.badRequestError("Staff is not assigned to any branch");
    if (!reason?.trim()) throw ApiError.badRequestError("Reason for leave is required");

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      throw ApiError.badRequestError("Invalid date range");
    }

    const overlapping = await prisma.staffAttendance.findFirst({
      where: { staffId, status: "APPROVED_LEAVE", date: { lte: to }, dateTo: { gte: from } },
    });
    if (overlapping) throw ApiError.badRequestError("An approved leave already exists for these dates");

    const leave = await prisma.staffAttendance.create({
      data: {
        staffId,
        schoolId: staff.schoolId,
        date: from,
        dateTo: to,
        status: "PENDING_LEAVE",
        leaveType: leaveType || "CASUAL",
        reason: reason.trim(),
      },
    });

    // Portal notification only — no email (best practice: leave is in-app flow)
    portalNotificationService.create({
      schoolId: staff.schoolId,
      senderName: "Staff Portal",
      title: "STAFF_LEAVE",
      body: `${staff.name} (${staff.role}) requested ${leaveType || "CASUAL"} leave from ${from.toLocaleDateString("en-PK")} to ${to.toLocaleDateString("en-PK")}. Reason: ${reason}`,
      category: "STAFF",
      refType: "STAFF_LEAVE",
      refId: leave.id,
      link: "/leave",
    }).catch(() => {});

    emitToRoom(`school:${staff.schoolId}`, "staff_leave_request_created", {
      id: leave.id,
      staffName: staff.name,
      status: "PENDING_LEAVE",
    });
    return leave;
  }

  async getMyLeaves(staffId, { status, page = 1, limit = 20 } = {}) {
    const where = { staffId, leaveType: { not: null } };
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.staffAttendance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staffAttendance.count({ where }),
    ]);

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new StaffLeaveSelfService();
