import notificationService from "./notification.service.js";
import portalNotificationService from "./notification.portalService.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class NotificationController {
  getDeliveryStatus = asyncHandler(async (req, res) => {
    const result = await notificationService.getDeliveryStatus(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Notification delivery status fetched", result));
  });

  listLogs = asyncHandler(async (req, res) => {
    const result = await notificationService.listLogs(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Notification logs fetched", result));
  });

  listPortal = asyncHandler(async (req, res) => {
    const result = await portalNotificationService.list(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Portal notifications fetched", result));
  });

  unreadCount = asyncHandler(async (req, res) => {
    const count = await portalNotificationService.unreadCount(req.user, {
      schoolId: req.query.schoolId,
      organizationId: req.query.organizationId,
    });
    return res.status(200).json(ApiResponse.ok("Unread count", { count }));
  });

  markRead = asyncHandler(async (req, res) => {
    const result = await portalNotificationService.markRead(req.user, req.body.ids);
    return res.status(200).json(ApiResponse.ok("Marked as read", result));
  });

  markAllRead = asyncHandler(async (req, res) => {
    const result = await portalNotificationService.markAllRead(req.user, req.query.schoolId);
    return res.status(200).json(ApiResponse.ok("All marked as read", result));
  });

  remove = asyncHandler(async (req, res) => {
    const result = await portalNotificationService.remove(req.user, req.body.ids);
    return res.status(200).json(ApiResponse.ok("Notifications deleted", result));
  });

  sendFromSuperAdmin = asyncHandler(async (req, res) => {
    const { organizationId, schoolId, recipientId, title, body, category } = req.body;
    const prisma = (await import("../../config/db.js")).default;
    const { sendEmail, resolveEmailBranding } = await import("../../services/email.service.js");
    const { announcementEmail } = await import("../../services/email.templates.js");

    // 1. Find all target admins
    const where = { role: "ADMIN", isActive: true };
    if (schoolId) {
      where.OR = [{ schoolId }, { branchAccess: { array_contains: [schoolId] } }];
    } else if (organizationId) {
      where.organizationId = organizationId;
    }
    if (recipientId) where.id = recipientId;

    const admins = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, schoolId: true, organizationId: true },
    });

    if (admins.length === 0) {
      return res.status(201).json(ApiResponse.ok("Notification sent (no admins found)", null));
    }

    // 2. Create portal notification for each admin
    const created = [];
    for (const admin of admins) {
      const notif = await portalNotificationService.create({
        organizationId: admin.organizationId || organizationId || null,
        schoolId: admin.schoolId || schoolId || null,
        senderId: req.user.id,
        senderName: req.user.name,
        recipientId: admin.id,
        title: title || "GENERAL",
        body,
        category: category || "GENERAL",
      });
      if (notif) created.push(notif);
    }

    // 3. Send email to all admins — har admin KO uski APNI org/branch ke SMTP
    // se (DB OrgSecrets, tenant-first chain; platform env sirf last-resort
    // fallback). Branding bhi usi admin ke branch/org ke hisaab se: branch
    // logo pehle, nahi to org ka. Same-scope admins ke liye branding cache.
    const brandingCache = new Map();
    const brandingKey = (orgId, schId) => `${orgId || "?"}:${schId || "?"}`;
    const emailPromises = admins
      .filter((a) => a.email)
      .map(async (admin) => {
        const adminOrg = admin.organizationId || organizationId || undefined;
        const adminSchool = admin.schoolId || schoolId || undefined;
        const key = brandingKey(adminOrg, adminSchool);
        if (!brandingCache.has(key)) {
          brandingCache.set(key, resolveEmailBranding({ organizationId: adminOrg, schoolId: adminSchool }).catch(() => ({})));
        }
        const branding = await brandingCache.get(key);
        const tpl = announcementEmail({
          name: admin.name,
          title: title || "Announcement",
          message: body,
          logoUrl: branding.logoUrl,
          themeColor: branding.themeColor,
          orgName: branding.orgName,
          branchName: branding.branchName,
        });
        return sendEmail({
          to: admin.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
          organizationId: adminOrg,
          schoolId: adminSchool,
        }).catch(() => {});
      });
    await Promise.allSettled(emailPromises);

    return res.status(201).json(ApiResponse.ok(`Notification sent to ${admins.length} admin(s)`, { count: created.length, emailed: admins.filter((a) => a.email).length }));
  });
}

export default new NotificationController();
