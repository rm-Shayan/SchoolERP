import circularRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

class CircularService {
  /**
   * PRD §5 — circulars are broadcast to their audience: parents, teachers,
   * or the whole school (parents + staff). Email is the primary channel.
   * "Koi bhi cheez sirf portal-exclusive na ho" — the same circular that
   * appears on the portal is delivered by email to every intended recipient.
   */
  async createCircular(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const audience = data.audience || "PARENTS";
    const circular = await circularRepository.createCircular({
      schoolId: targetSchoolId,
      title: data.title,
      content: data.content,
      mediaUrl: data.mediaUrl || null,
      audience,
    });

    const message = `${data.title}\n\n${data.content}`;
    let notifiedParents = 0;
    let notifiedStaff = 0;

    // Parents — for PARENTS and ALL.
    if (audience === "PARENTS" || audience === "ALL") {
      const students = await circularRepository.listActiveStudentsBySchool(targetSchoolId);
      const notified = new Set();
      const dispatch = [];
      for (const student of students) {
        const parentEmail = student.parent?.email;
        if (!parentEmail || notified.has(parentEmail)) continue;
        notified.add(parentEmail);
        // Fire-and-forget: broadcast response ke liye email dispatch ka wait
        // nahi karna — H2 bottleneck. Failure individually swallowed.
        dispatch.push(
          notificationService
            .notifyParent({
              schoolId: targetSchoolId,
              parentEmail,
              parentPhone: student.parent?.phone,
              message,
              title: "School Circular",
            })
            .catch(() => {})
        );
      }
      if (dispatch.length) Promise.allSettled(dispatch).catch(() => {});
      notifiedParents = notified.size;
    }

    // Staff/teachers — for TEACHERS and ALL.
    if (audience === "TEACHERS" || audience === "ALL") {
      const staff = await circularRepository.listSchoolStaff(targetSchoolId);
      const dispatch = [];
      for (const member of staff) {
        // Author (jo circular bana raha hai) ko khud ko notify na karein.
        if (user && member.id && member.id === user.id) continue;
        if (user && member.email && member.email === user.email) continue;
        dispatch.push(
          notificationService
            .notifyOrgAdmin({
              schoolId: targetSchoolId,
              adminEmail: member.email,
              adminPhone: member.phone,
              message,
              title: "School Announcement",
            })
            .catch(() => {})
        );
        notifiedStaff++;
      }
      if (dispatch.length) Promise.allSettled(dispatch).catch(() => {});
    }

    emitToRoom(`school:${targetSchoolId}`, "portal:circular_created", {
      id: circular.id,
      title: circular.title,
      content: circular.content,
      mediaUrl: circular.mediaUrl,
      audience: circular.audience,
      createdAt: circular.createdAt,
    });
    emitToRoom(`school:${targetSchoolId}`, "circular_created", {
      id: circular.id,
      audience,
      notifiedParents,
      notifiedStaff,
    });

    // Portal notification — branch feed ko pata chale circular jari hui.
    const audienceLabel = audience === "ALL" ? "whole school" : audience === "TEACHERS" ? "teachers" : "parents";
    portalNotificationService.create({
      schoolId: targetSchoolId, senderId: user?.id, senderName: user?.name,
      title: "CIRCULAR",
      body: `"${circular.title}" posted for ${audienceLabel}${notifiedParents || notifiedStaff ? ` — ${notifiedParents} parent(s), ${notifiedStaff} staff notified` : ""}.`,
      category: "CIRCULAR",
      refType: "CIRCULAR",
      refId: circular.id,
      link: "/circulars",
    }).catch(() => {});

    return { circular, notifiedParents, notifiedStaff };
  }

  async listCirculars(user, schoolId, { page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    return circularRepository.listCircularsBySchool(targetSchoolId, {
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
  }

  async getCircular(user, id) {
    const circular = await circularRepository.findCircularById(id);
    if (!circular) throw ApiError.notFoundError("Circular not found");
    assertSchoolAccess(user, circular.schoolId);
    return circular;
  }

  async deleteCircular(user, id) {
    const circular = await this.getCircular(user, id);
    assertOwnSchool(user, circular.schoolId);
    await circularRepository.deleteCircular(id);
    return true;
  }
}

export default new CircularService();
