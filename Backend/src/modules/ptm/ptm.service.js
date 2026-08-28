import ptmRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";

// RFC-style practical check: malformed addresses ko SMTP call tak na le kar jayein.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

class PtmService {
  /** Validate audience fields against the school DB and resolve them into stored targets. */
  async resolveScope(targetSchoolId, data) {
    const scope = data.scope || "WHOLE_SCHOOL";
    let classIds = [];
    let sectionIds = [];
    let studentId = null;

    if (scope === "CLASS_RANGE") {
      const classes = await ptmRepository.listSchoolClasses(targetSchoolId);
      const from = classes.find((c) => c.id === data.classFromId);
      const to = classes.find((c) => c.id === data.classToId);
      if (!from || !to) throw ApiError.badRequestError("Selected range classes not found in this school");
      const lo = Math.min(from.order, to.order);
      const hi = Math.max(from.order, to.order);
      classIds = classes.filter((c) => c.order >= lo && c.order <= hi).map((c) => c.id);

      const allSectionIds = await ptmRepository.sectionIdsForClasses(classIds);
      if (allSectionIds.length === 0) throw ApiError.badRequestError("No sections exist in the selected class range");

      // Optional narrowing — single-class scene: sirf chosen sections par limit karo
      if (Array.isArray(data.sectionIds) && data.sectionIds.length > 0) {
        const allowed = new Set(allSectionIds);
        const picked = [...new Set(data.sectionIds)].filter((id) => allowed.has(id));
        if (picked.length === 0) {
          throw ApiError.badRequestError("Selected sections do not belong to the chosen class range");
        }
        sectionIds = picked;
      } else {
        sectionIds = allSectionIds;
      }
    } else if (scope === "SECTIONS") {
      const requested = [...new Set(data.sectionIds)];
      const rows = await ptmRepository.sectionsWithClass(targetSchoolId, requested);
      if (rows.length !== requested.length) throw ApiError.badRequestError("One or more sections not found in this school");
      sectionIds = rows.map((r) => r.id);
      classIds = [...new Set(rows.map((r) => r.classId))];
    } else if (scope === "STUDENT") {
      const student = await ptmRepository.findStudent(targetSchoolId, data.studentId);
      if (!student) throw ApiError.badRequestError("Student not found in this school");
      studentId = student.id;
      sectionIds = [student.sectionId];
    }

    return { scope, classIds, sectionIds, studentId };
  }

  async validateTeachers(targetSchoolId, teacherIds) {
    if (!teacherIds || teacherIds.length === 0) return;
    const unique = [...new Set(teacherIds)];
    const found = await ptmRepository.teachersInSchool(targetSchoolId, unique);
    if (found.length !== unique.length) throw ApiError.badRequestError("One or more teachers not found in this school");
  }

  async notifyParents(targetSchoolId, { scope, studentId, sectionIds }, session) {
    let recipients;
    if (scope === "STUDENT") {
      const student = await ptmRepository.findStudent(targetSchoolId, studentId);
      recipients = student ? [student] : [];
    } else {
      recipients = await ptmRepository.listStudentParentsBySections(targetSchoolId, sectionIds);
    }

    const when = new Date(session.scheduledAt).toLocaleString("en-PK");
    const where = session.location ? ` at ${session.location}` : "";
    const message = `${session.title} scheduled for ${when}${where}. Please make time to meet your child's teachers.`;
    const parents = recipients.filter((s) => s.parent?.email).map((s) => ({ email: s.parent.email }));
    const result = await notificationService.sendBulkParentEmails(targetSchoolId, "Parent-Teacher Meeting", message, parents);
    return result.sent;
  }

  async createSession(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);
    await assertSchoolExists(targetSchoolId);

    await this.validateTeachers(targetSchoolId, data.teacherIds);
    const targets = await this.resolveScope(targetSchoolId, data);

    const session = await ptmRepository.createSession({
      schoolId: targetSchoolId,
      title: data.title,
      description: data.description || null,
      scheduledAt: new Date(data.scheduledAt),
      location: data.location || null,
      ...targets,
      teacherIds: [...new Set(data.teacherIds || [])],
    });

    // Fire-and-forget — response parents ki list ka wait nahi karta
    // (whole-school PTM par ye query heavy hoti hai; WS emit count ke saath baad mein).
    this.notifyParents(targetSchoolId, targets, session)
      .then((count) => {
        emitToRoom(`school:${targetSchoolId}`, "ptm_created", { id: session.id, notifiedParents: count });
      })
      .catch(() => {});

    // Portal notification to admin who created it
    portalNotificationService.create({
      schoolId: targetSchoolId, senderId: user.id, senderName: user.name,
      title: "PTM_CREATED", body: `"${session.title}" scheduled for ${new Date(session.scheduledAt).toLocaleDateString("en-PK")}.`,
      category: "PTM", refType: "PTM_SESSION", refId: session.id, link: "/ptm",
    }).catch(() => {});

    // Notify assigned teachers
    if (data.teacherIds?.length) {
      this._notifyTeachers(targetSchoolId, data.teacherIds, user, session, "scheduled").catch(() => {});
    }

    return { session, notifiedParents: null };
  }

  async listSessions(user, schoolId, { page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    const result = await ptmRepository.listSessionsBySchool(targetSchoolId, {
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
    return { ...result, items: await this.decorateSessions(targetSchoolId, result.items) };
  }

  async getSession(user, id) {
    const session = await ptmRepository.findSessionById(id);
    if (!session) throw ApiError.notFoundError("PTM session not found");
    assertSchoolAccess(user, session.schoolId);
    const [decorated] = await this.decorateSessions(session.schoolId, [session]);
    return decorated;
  }

  async notifyParentsOfChange(targetSchoolId, targets, session, type) {
    const when = new Date(session.scheduledAt).toLocaleString("en-PK");
    const where = session.location ? ` at ${session.location}` : "";
    let title;
    let message;
    if (type === "UPDATE") {
      title = "PTM Updated";
      message = `${session.title} has been updated — now scheduled for ${when}${where}. Please note the changed details.`;
    } else if (type === "CANCEL") {
      title = "PTM Cancelled";
      message = `${session.title} scheduled for ${when} has been cancelled. We apologize for the inconvenience.`;
    } else {
      return;
    }

    let recipients;
    if (targets.scope === "STUDENT") {
      const student = await ptmRepository.findStudent(targetSchoolId, targets.studentId);
      recipients = student ? [student] : [];
    } else {
      recipients = await ptmRepository.listStudentParentsBySections(targetSchoolId, targets.sectionIds);
    }

    const parents = recipients.filter((s) => s.parent?.email).map((s) => ({ email: s.parent.email }));
    const result = await notificationService.sendBulkParentEmails(targetSchoolId, title, message, parents);
    return result.sent;
  }

  async updateSession(user, id, data) {
    const existing = await ptmRepository.findSessionById(id);
    if (!existing) throw ApiError.notFoundError("PTM session not found");
    assertSchoolAccess(user, existing.schoolId);
    assertOwnSchool(user, existing.schoolId);

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);

    // Audience re-resolution: frontend edit form poora scope payload bhejta hai.
    let targets;
    if (data.scope !== undefined) {
      await this.validateTeachers(existing.schoolId, data.teacherIds);
      targets = await this.resolveScope(existing.schoolId, data);
      updateData.teacherIds = [...new Set(data.teacherIds || [])];
      Object.assign(updateData, targets);
    }

    const updated = await ptmRepository.updateSession(id, updateData);

    // Notify parents of the update (fire-and-forget)
    const merged = { ...existing, ...updated };
    const notifyTargets = targets || { scope: existing.scope, studentId: existing.studentId, sectionIds: existing.sectionIds };
    this.notifyParentsOfChange(existing.schoolId, notifyTargets, merged, "UPDATE")
      .then((count) => { emitToRoom(`school:${existing.schoolId}`, "ptm_updated", { id, notifiedParents: count }); })
      .catch(() => {});

    // Portal notification
    portalNotificationService.create({
      schoolId: existing.schoolId, senderId: user.id, senderName: user.name,
      title: "PTM_UPDATED", body: `"${merged.title}" has been updated — now on ${new Date(merged.scheduledAt).toLocaleDateString("en-PK")}.`,
      category: "PTM", refType: "PTM_SESSION", refId: id, link: "/ptm",
    }).catch(() => {});

    return updated;
  }

  async deleteSession(user, id) {
    const session = await this.getSession(user, id);
    assertOwnSchool(user, session.schoolId);

    const targets = { scope: session.scope, studentId: session.studentId, sectionIds: session.sectionIds };

    await ptmRepository.deleteSession(id);

    // Notify parents of cancellation (fire-and-forget)
    this.notifyParentsOfChange(session.schoolId, targets, session, "CANCEL")
      .then((count) => { emitToRoom(`school:${session.schoolId}`, "ptm_deleted", { id, notifiedParents: count }); })
      .catch(() => {});

    // Portal notification
    portalNotificationService.create({
      schoolId: session.schoolId, senderId: user.id, senderName: user.name,
      title: "PTM_DELETED", body: `"${session.title}" (scheduled for ${new Date(session.scheduledAt).toLocaleDateString("en-PK")}) has been cancelled.`,
      category: "PTM", refType: "PTM_SESSION", refId: id, link: "/ptm",
    }).catch(() => {});

    // Notify assigned teachers
    if (session.teacherIds?.length) {
      this._notifyTeachers(session.schoolId, session.teacherIds, user, session, "cancelled").catch(() => {});
    }

    return true;
  }

  /** Attach display-ready labels + attendee names so UI ko extra fetches na karni paren. */
  async decorateSessions(schoolId, sessions) {
    if (!sessions.length) return sessions;

    const teacherIds = [...new Set(sessions.flatMap((s) => s.teacherIds))];
    const classIds = [...new Set(sessions.flatMap((s) => s.classIds))];
    const sectionIds = [...new Set(sessions.flatMap((s) => s.sectionIds))];
    const studentIds = sessions.filter((s) => s.scope === "STUDENT" && s.studentId).map((s) => s.studentId);

    const [teachers, classes, sections, students] = await Promise.all([
      teacherIds.length ? ptmRepository.usersByIds(schoolId, teacherIds) : [],
      classIds.length ? ptmRepository.classesByIds(schoolId, classIds) : [],
      sectionIds.length ? ptmRepository.sectionsWithClass(schoolId, sectionIds) : [],
      studentIds.length ? ptmRepository.studentsByIds(schoolId, studentIds) : [],
    ]);

    const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
    const classNameById = new Map(classes.map((c) => [c.id, c.name]));
    const studentMap = new Map(students.filter(Boolean).map((st) => [st.id, st]));
    const sectionRowById = new Map(sections.map((sec) => [sec.id, sec]));

    return sessions.map((s) => ({
      ...s,
      teachers: s.teacherIds.map((tid) => ({ id: tid, name: teacherMap.get(tid) ?? "Unknown" })),
      scopeLabel: this.scopeLabel(s, classNameById, sectionRowById, studentMap),
    }));
  }

  scopeLabel(session, classNameById, sectionRowById, studentMap) {
    if (session.scope === "WHOLE_SCHOOL") return "Whole School";
    if (session.scope === "CLASS_RANGE") {
      const names = session.classIds.map((cid) => classNameById.get(cid)).filter(Boolean);
      if (names.length === 0) return "Classes";
      return names.length === 1 ? names[0] : `${names[0]} – ${names[names.length - 1]} (All Sections)`;
    }
    if (session.scope === "SECTIONS") {
      const grouped = new Map();
      for (const sid of session.sectionIds) {
        const row = sectionRowById.get(sid);
        if (!row) continue;
        const label = `${row.class.name} · ${row.name}`;
        grouped.set(row.classId, [...(grouped.get(row.classId) || []), label]);
      }
      const parts = [...grouped.values()].map((labels) =>
        labels.length === 1 ? labels[0] : `${labels[0].split(" · ")[0]} (${labels.map((l) => l.split(" · ")[1]).join(", ")})`
      );
      return parts.join(", ") || "Sections";
    }
    if (session.scope === "STUDENT") {
      const st = studentMap.get(session.studentId);
      if (!st) return "Single Student";
      const sec = st.section?.name && st.section?.class?.name ? ` · ${st.section.class.name}-${st.section.name}` : "";
      return `Student: ${st.firstName} ${st.lastName}${sec}`;
    }
    return "Custom";
  }

  async _notifyTeachers(schoolId, teacherIds, actor, session, action) {
    const teachers = await ptmRepository.usersByIds(schoolId, teacherIds);
    for (const t of teachers) {
      portalNotificationService.create({
        schoolId, senderId: actor.id, senderName: actor.name, recipientId: t.id,
        title: action === "cancelled" ? "PTM_DELETED" : action === "scheduled" ? "PTM_CREATED" : "PTM_UPDATED",
        body: `PTM "${session.title}" ${action} for ${new Date(session.scheduledAt).toLocaleDateString("en-PK")}${session.location ? ` at ${session.location}` : ""}.`,
        category: "PTM", refType: "PTM_SESSION", refId: session.id, link: "/ptm",
      }).catch(() => {});
    }
  }
}

export default new PtmService();
