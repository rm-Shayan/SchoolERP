import homeworkRepository from "./repository.js";
import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

class HomeworkService {
  /**
   * PRD §6 — Homework: jaisa abhi WhatsApp pe hoti hai, system structured
   * tareeke se forward kare — roz ki majboor entry nahi.
   * Teacher posts homework per section → parents get an email automatically.
   */
  async createBroadcast(user, data) {
    const section = await homeworkRepository.sectionExists(data.sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);

    const broadcast = await homeworkRepository.createBroadcast({
      schoolId: section.class.schoolId,
      sectionId: data.sectionId,
      createdById: user.id,
      title: data.title,
      content: data.content,
      mediaUrl: data.mediaUrl || null,
    });

    // Notify every active student's parent in that section (email — PRD §5/§6)
    const students = await homeworkRepository.listActiveStudentsBySection(data.sectionId);
    const className = `${section.class.name} ${section.name}`;
    const message = `Homework posted for ${className}:\n\n${data.title}\n\n${data.content}`;
    const parents = students.filter((s) => s.parent?.email).map((s) => ({ email: s.parent.email }));

    // Bulk dispatch — ONE summary log in admin panel, individual emails to parents
    notificationService.sendBulkParentEmails(section.class.schoolId, "Homework Update", message, parents)
      .then((r) => { emitToRoom(`school:${section.class.schoolId}`, "homework_broadcast", { id: broadcast.id, emailsSent: r.sent }); })
      .catch(() => {});

    const hwPayload = {
      id: broadcast.id,
      title: broadcast.title,
      content: broadcast.content,
      mediaUrl: broadcast.mediaUrl,
      sentAt: broadcast.sentAt,
      sectionId: data.sectionId,
      section: { id: section.id, name: section.name, class: { name: section.class.name } },
      createdBy: { id: user.id, name: user.name },
      notifiedParents: students.length,
    };
    emitToRoom(`section:${data.sectionId}`, "portal:homework_broadcast", hwPayload);
    emitToRoom(`school:${section.class.schoolId}`, "homework_broadcast", {
      id: broadcast.id,
      sectionId: data.sectionId,
      notifiedParents: students.length,
    });

    // Portal notification to admin/teacher
    portalNotificationService.create({
      schoolId: section.class.schoolId, senderId: user.id, senderName: user.name,
      title: "HOMEWORK_CREATED", body: `"${data.title}" posted for ${className}.`,
      category: "HOMEWORK", refType: "HOMEWORK_BROADCAST", refId: broadcast.id, link: "/homework",
    }).catch(() => {});

    return { broadcast, notifiedParents: students.length };
  }

  async listBroadcasts(user, { schoolId, sectionId, createdById, page = 1, pageSize = 50 }) {
    const targetSchoolId = schoolId || user.schoolId;
    if (!targetSchoolId) {
      if (user.role === "SUPER_ADMIN") throw ApiError.badRequestError("schoolId is required");
      throw ApiError.forbiddenError("Your account is not associated with any school branch.");
    }
    assertSchoolAccess(user, targetSchoolId);

    // Teachers sirf apne posts dekhein unless explicitly overridden
    const filterUserId = createdById || (user.role === "TEACHER" ? user.id : undefined);

    return homeworkRepository.listBroadcastsBySchool(targetSchoolId, {
      sectionId,
      createdById: filterUserId,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  async getBroadcast(user, id) {
    const broadcast = await homeworkRepository.findBroadcastById(id);
    if (!broadcast) throw ApiError.notFoundError("Homework broadcast not found");
    assertSchoolAccess(user, broadcast.schoolId);
    return broadcast;
  }

  async updateBroadcast(user, id, data) {
    const broadcast = await homeworkRepository.findBroadcastById(id);
    if (!broadcast) throw ApiError.notFoundError("Homework broadcast not found");
    assertOwnSchool(user, broadcast.schoolId);

    // Teacher sirf apni post edit kar sakta hai; Admin/Super Admin koi bhi
    if (user.role === "TEACHER" && broadcast.createdById !== user.id) {
      throw ApiError.forbiddenError("You can only edit homework you posted yourself");
    }

    const patch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.mediaUrl !== undefined) patch.mediaUrl = data.mediaUrl || null;

    const updated = await prisma.homeworkBroadcast.update({
      where: { id },
      data: patch,
      include: {
        section: { include: { class: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    portalNotificationService.create({
      schoolId: updated.schoolId, senderId: user.id, senderName: user.name,
      title: "HOMEWORK_UPDATED", body: `"${data.title || updated.title}" updated for ${updated.section.class.name} ${updated.section.name}.`,
      category: "HOMEWORK", refType: "HOMEWORK_BROADCAST", refId: id, link: "/homework",
    }).catch(() => {});

    return updated;
  }

  async deleteBroadcast(user, id) {
    const broadcast = await homeworkRepository.findBroadcastById(id);
    if (!broadcast) throw ApiError.notFoundError("Homework broadcast not found");
    assertOwnSchool(user, broadcast.schoolId);

    // Teacher sirf apni post delete kar sakta hai; Admin/Super Admin koi bhi
    if (user.role === "TEACHER" && broadcast.createdById !== user.id) {
      throw ApiError.forbiddenError("You can only delete homework you posted yourself");
    }

    const sectionLabel = `${broadcast.section.class.name} ${broadcast.section.name}`;
    await prisma.homeworkBroadcast.delete({ where: { id } });

    // Portal notification to admin/teacher
    portalNotificationService.create({
      schoolId: broadcast.schoolId, senderId: user.id, senderName: user.name,
      title: "HOMEWORK_DELETED", body: `"${broadcast.title}" removed from ${sectionLabel}.`,
      category: "HOMEWORK", refType: "HOMEWORK_BROADCAST", refId: id, link: "/homework",
    }).catch(() => {});

    // Notify class parents that homework was removed
    const students = await homeworkRepository.listActiveStudentsBySection(broadcast.sectionId);
    const parents = students.filter((s) => s.parent?.email).map((s) => ({ email: s.parent.email }));
    if (parents.length) {
      notificationService.sendBulkParentEmails(
        broadcast.schoolId, "Homework Removed",
        `"${broadcast.title}" for ${sectionLabel} has been removed by ${user.name}.`,
        parents,
      ).catch(() => {});
    }

    emitToRoom(`school:${broadcast.schoolId}`, "homework_broadcast_deleted", { id, sectionId: broadcast.sectionId });
    return true;
  }
}

export default new HomeworkService();
