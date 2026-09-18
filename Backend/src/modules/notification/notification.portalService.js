import prisma from "../../config/db.js";
import { emitToRoom } from "../../config/websocket.js";
import Logger from "../../lib/utils/logger.js";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "../../lib/utils/cache.js";

const logger = new Logger("portal-notifications");

// Loop me create() baar-baar call hota hai (superadmin broadcast, assignments)
// — har baar school.findUnique na kare. In-memory short-TTL cache.
const schoolOrgCache = new Map();
const SCHOOL_ORG_TTL = 5 * 60 * 1000;
async function resolveOrganizationId(schoolId) {
  const hit = schoolOrgCache.get(schoolId);
  if (hit && Date.now() - hit.at < SCHOOL_ORG_TTL) return hit.orgId;
  const orgId = await prisma.school
    .findUnique({ where: { id: schoolId }, select: { organizationId: true } })
    .then((s) => s?.organizationId || null)
    .catch(() => null);
  schoolOrgCache.set(schoolId, { orgId, at: Date.now() });
  return orgId;
}

/**
 * Staff feed visibility — null-recipient (broadcast) notifications sirf us
 * role ki relevant categories ko dikhte hain. ADMIN (branch head) sab dekh
 * sakta hai. Receptionist ko USKE modules se related: admissions (front desk),
 * attendance/gate, exam results, PTM (read-only), circulars + general — but
 * FEE (oppose jaisi "Zainab ne fee jama nahi krwayi") aur staff/conduct
 * academic feed NAHI.
 */
const CATEGORY_MATRIX = {
  ADMIN: null, // all categories
  TEACHER: ["STUDENT", "ATTENDANCE", "ACADEMIC", "HOMEWORK", "EXAM", "PTM", "CONDUCT", "CIRCULAR", "GENERAL"],
  RECEPTIONIST: ["ADMISSION", "STUDENT", "ATTENDANCE", "EXAM", "PTM", "CIRCULAR", "GENERAL"],
};

/**
 * Role-aware visibility WHERE — list/unreadCount/markRead/markAllRead sab yehi
 * use karte hain taake har jagah same rules apply hon.
 *
 * - SUPER_ADMIN: sab kuch (apne actions ke alawa).
 * - PARENT/STUDENT (portal): SIRF apni targeted (recipientId == me) + school
 *   ke CIRCULAR announcements. Parsing kisi aur ka school/org feed NAHI hoti.
 * - Staff: apni targeted + school/org feed sirf role-relevant category me.
 */
function visibilityWhere(user, filters = {}) {
  const where = { channel: "PORTAL" };

  if (user.role === "SUPER_ADMIN") {
    if (filters.schoolId) where.schoolId = filters.schoolId;
    else if (filters.organizationId) where.organizationId = filters.organizationId;
    where.senderId = { not: user.id };
    return where;
  }

  if (user.role === "PARENT" || user.role === "STUDENT") {
    const or = [{ recipientId: user.id }];
    // School-wide announcement (circular) har portal user ko dikhta hai —
    // baki school feed targeted nahi hone par portal users ko NAHI.
    if (user.schoolId) {
      or.push({ recipientId: null, category: "CIRCULAR", schoolId: user.schoolId });
    }
    where.OR = or;
    return where;
  }

  const relevant = CATEGORY_MATRIX[user.role];
  const categoryClause = relevant ? { category: { in: relevant } } : {};
  const or = [{ recipientId: user.id }];
  if (user.schoolId) {
    or.push({ recipientId: null, schoolId: user.schoolId, ...categoryClause });
  }
  or.push({ recipientId: null, schoolId: null, organizationId: user.organizationId || null, ...categoryClause });
  where.OR = or;
  return where;
}

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
        organizationId = await resolveOrganizationId(schoolId);
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

      await cacheInvalidatePrefix("notif:portal:");
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
    const key = `notif:portal:list:${user.id}:${schoolId || ""}:${organizationId || ""}:${category || ""}:${unreadOnly ? 1 : 0}:${page}:${pageSize}`;
    const cached = await cacheGet(key);
    if (cached) return cached;

    const where = visibilityWhere(user, { schoolId, organizationId });

    if (category) where.category = category;
    if (unreadOnly) where.isRead = false;

    const [items, total] = await Promise.all([
      prisma.notificationLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.notificationLog.count({ where }),
    ]);
    const result = { items: items.map((n) => ({ ...n, body: n.message })), total, page, pageSize };
    await cacheSet(key, result, 20);
    return result;
  }

  async markRead(user, ids) {
    const where = visibilityWhere(user);
    where.id = { in: ids };
    const result = await prisma.notificationLog.updateMany({ where, data: { isRead: true } });
    if (result.count === 0) return { updated: 0 };
    await cacheInvalidatePrefix("notif:portal:");
    emitToRoom("super_admins", "portal_notifications_read", { ids });
    if (user.schoolId) emitToRoom(`school:${user.schoolId}`, "portal_notifications_read", { ids });
    if (user.organizationId) emitToRoom(`org:${user.organizationId}`, "portal_notifications_read", { ids });
    return { updated: result.count };
  }

  async markAllRead(user, schoolId) {
    const where = visibilityWhere(user, { schoolId });
    where.isRead = false;
    const result = await prisma.notificationLog.updateMany({ where, data: { isRead: true } });
    await cacheInvalidatePrefix("notif:portal:");
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
    await cacheInvalidatePrefix("notif:portal:");
    emitToRoom("super_admins", "portal_notifications_deleted", { ids });
    if (user.schoolId) emitToRoom(`school:${user.schoolId}`, "portal_notifications_deleted", { ids });
    if (user.organizationId) emitToRoom(`org:${user.organizationId}`, "portal_notifications_deleted", { ids });
    return { deleted: result.count };
  }

  async unreadCount(user, { schoolId, organizationId } = {}) {
    const key = `notif:portal:count:${user.id}:${schoolId || ""}:${organizationId || ""}`;
    const cached = await cacheGet(key);
    if (cached !== undefined) return cached;

    const where = visibilityWhere(user, { schoolId, organizationId });
    where.isRead = false;

    const count = await prisma.notificationLog.count({ where });
    await cacheSet(key, count, 20);
    return count;
  }
}

export default new PortalNotificationService();