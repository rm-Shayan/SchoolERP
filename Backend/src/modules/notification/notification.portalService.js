import prisma from "../../config/db.js";
import { emitToRoom } from "../../config/websocket.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("portal-notifications");

const TITLE_MAP = {
  PTM_CREATED: "Parent-Teacher Meeting Scheduled",
  PTM_UPDATED: "Parent-Teacher Meeting Updated",
  PTM_DELETED: "Parent-Teacher Meeting Cancelled",
  HOMEWORK_CREATED: "Homework Posted",
  HOMEWORK_UPDATED: "Homework Updated",
  HOMEWORK_DELETED: "Homework Removed",
  EXAM_CREATED: "Exam Scheduled",
  EXAM_PUBLISHED: "Exam Results Published",
  EXAM_DELETED: "Exam Deleted",
  STAFF_CREATED: "Staff Account Created",
  STAFF_BLOCKED: "Staff Account Blocked",
  STAFF_UNBLOCKED: "Staff Account Restored",
  STUDENT_ENROLLED: "Student Enrolled",
  STUDENT_WITHDRAWN: "Student Withdrawn",
  FEE_PAID: "Fee Payment Received",
  FEE_DUE: "Fee Payment Overdue",
  CIRCULAR: "Circular Issued",
  CONDUCT_REMARK: "Student Remark",
  ATTENDANCE_LATE: "Late Arrival Alert",
  ATTENDANCE_ABSENT: "Attendance Alert — Absent",
  LEAVE_REQUEST: "Leave Request",
  LEAVE_APPROVED: "Leave Request Approved",
  LEAVE_REJECTED: "Leave Request Rejected",
  STAFF_LEAVE: "Staff Leave Request",
  STAFF_ATTENDANCE: "Staff Attendance",
  ADMISSION: "Admission Update",
  SCHOOL_CREATED: "Branch Created",
  SCHOOL_DELETED: "Branch Deleted",
  SCHOOL_MODERATION: "Branch Status Changed",
  ORG_CREATED: "Organization Created",
  ORG_DELETED: "Organization Deleted",
  ORG_MODERATION: "Organization Status Changed",
  GENERAL: "Notification",
};

class PortalNotificationService {
  async create({ organizationId, schoolId, senderId, senderName, recipientId, title, body, category = "GENERAL", refType, refId, link }) {
    try {
      if (!organizationId && schoolId) {
        const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } }).catch(() => null);
        organizationId = school?.organizationId || null;
      }

      const notification = await prisma.notificationLog.create({
        data: {
          organizationId: organizationId || null,
          schoolId: schoolId || null,
          recipient: "",
          recipientId: recipientId || null,
          senderId: senderId || null,
          senderName: senderName || "System",
          channel: "PORTAL",
          title: TITLE_MAP[title] || title,
          message: body,
          category,
          refType: refType || null,
          refId: refId || null,
          link: link || null,
          isRead: false,
          status: "SENT",
        },
      });

      // Frontend DTO body=message — DB column `message` ko `body` alias karo
      // taki socket payload aur list() dono consistent rahen.
      const payload = { ...notification, body: notification.message };

      emitToRoom("super_admins", "portal_notification_created", payload);
      if (schoolId) emitToRoom(`school:${schoolId}`, "portal_notification_created", payload);
      if (organizationId) emitToRoom(`org:${organizationId}`, "portal_notification_created", payload);
      return payload;
    } catch (err) {
      logger.logger.error(`[PortalNotif] Create failed: ${err.message}`);
      return null;
    }
  }

  async list(user, { schoolId, organizationId, category, unreadOnly, page = 1, pageSize = 30 }) {
    const where = { channel: "PORTAL" };

    if (user.role === "SUPER_ADMIN") {
      if (schoolId) where.schoolId = schoolId;
      else if (organizationId) where.organizationId = organizationId;
      where.senderId = { not: user.id };
    } else if (user.role === "ADMIN") {
      where.OR = [
        { recipientId: user.id },
        { recipientId: null, organizationId: user.organizationId, schoolId: null },
        { recipientId: null, schoolId: user.schoolId },
      ];
    } else {
      where.OR = [
        { recipientId: user.id },
        { recipientId: null, schoolId: user.schoolId },
        { recipientId: null, schoolId: null, organizationId: user.organizationId || null },
      ];
    }

    if (category) where.category = category;
    if (unreadOnly) where.isRead = false;

    const [items, total] = await Promise.all([
      prisma.notificationLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.notificationLog.count({ where }),
    ]);
    return { items: items.map((n) => ({ ...n, body: n.message })), total, page, pageSize };
  }

  async markRead(user, ids) {
    const where = { id: { in: ids }, channel: "PORTAL" };
    if (user.role !== "SUPER_ADMIN") where.OR = [{ recipientId: user.id }, { recipientId: null }];
    const result = await prisma.notificationLog.updateMany({ where, data: { isRead: true } });
    emitToRoom("super_admins", "portal_notifications_read", { ids });
    if (user.schoolId) emitToRoom(`school:${user.schoolId}`, "portal_notifications_read", { ids });
    if (user.organizationId) emitToRoom(`org:${user.organizationId}`, "portal_notifications_read", { ids });
    return { updated: result.count };
  }

  async markAllRead(user, schoolId) {
    const where = { isRead: false, channel: "PORTAL" };
    if (user.role !== "SUPER_ADMIN") {
      if (user.role === "ADMIN") {
        where.OR = [
          { organizationId: user.organizationId, schoolId: null },
          { schoolId: user.schoolId },
        ];
      } else {
        where.OR = [
          { recipientId: user.id },
          { recipientId: null, schoolId: user.schoolId },
          { recipientId: null, schoolId: null, organizationId: user.organizationId || null },
        ];
      }
    } else if (schoolId) {
      where.schoolId = schoolId;
    }
    const result = await prisma.notificationLog.updateMany({ where, data: { isRead: true } });
    emitToRoom("super_admins", "portal_all_read", { schoolId: user.schoolId || schoolId || null });
    if (user.schoolId) emitToRoom(`school:${user.schoolId}`, "portal_all_read", {});
    if (user.organizationId) emitToRoom(`org:${user.organizationId}`, "portal_all_read", {});
    return { updated: result.count };
  }

  async remove(user, ids) {
    const where = { id: { in: ids }, channel: "PORTAL" };
    if (user.role === "SUPER_ADMIN") {
      // super admin can delete any
    } else if (user.role === "ADMIN") {
      where.OR = [{ recipientId: user.id }, { schoolId: user.schoolId }, { organizationId: user.organizationId, schoolId: null }];
    } else {
      where.recipientId = user.id;
    }
    const result = await prisma.notificationLog.deleteMany({ where });
    emitToRoom("super_admins", "portal_notifications_deleted", { ids });
    if (user.schoolId) emitToRoom(`school:${user.schoolId}`, "portal_notifications_deleted", { ids });
    if (user.organizationId) emitToRoom(`org:${user.organizationId}`, "portal_notifications_deleted", { ids });
    return { deleted: result.count };
  }

  async unreadCount(user, { schoolId, organizationId } = {}) {
    const where = { isRead: false, channel: "PORTAL" };

    if (user.role === "SUPER_ADMIN") {
      if (schoolId) where.schoolId = schoolId;
      else if (organizationId) where.organizationId = organizationId;
      // Super admin apne khud ke actions ke notifications bhi dekh sakta hai
    } else if (user.role === "ADMIN") {
      where.OR = [
        { recipientId: user.id },
        { recipientId: null, organizationId: user.organizationId, schoolId: null },
        { recipientId: null, schoolId: user.schoolId },
      ];
    } else {
      where.OR = [
        { recipientId: user.id },
        { recipientId: null, schoolId: user.schoolId },
        { recipientId: null, schoolId: null, organizationId: user.organizationId || null },
      ];
    }

    return prisma.notificationLog.count({ where });
  }
}

export default new PortalNotificationService();