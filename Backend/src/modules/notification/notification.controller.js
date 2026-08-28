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
    const notif = await portalNotificationService.create({
      organizationId: organizationId || null,
      schoolId: schoolId || null,
      senderId: req.user.id,
      senderName: req.user.name,
      recipientId: recipientId || null,
      title: title || "GENERAL",
      body,
      category: category || "GENERAL",
    });
    return res.status(201).json(ApiResponse.ok("Notification sent", notif));
  });
}

export default new NotificationController();
