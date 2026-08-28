import moderationRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import redis from "../../config/redis.js";
import { invalidateUserCache, invalidateEntityCache } from "../../middlewares/auth.middleware.js";
import { emitToRoom } from "../../config/websocket.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import { BLOCKED_MESSAGE } from "../../constants.js";
import { sendEmail, resolveEmailBranding } from "../../services/email.service.js";
import { moderationNoticeEmail } from "../../services/email.templates.js";
import portalNotificationService from "../notification/notification.portalService.js";

const BLOCK_META = (requester, reason) => ({
  blockedAt: new Date(),
  blockedReason: reason || null,
  blockedById: requester.id,
  blockedByName: requester.name,
});

/** Unblock ke waqt block fields clear karne ka literal (6 jagah repeat tha). */
const UNBLOCK_META = {
  blockedAt: null,
  blockedReason: null,
  blockedById: null,
  blockedByName: null,
};

/**
 * Block/unblock par affected org/branch ke ADMIN ko email bhejo. Platform
 * transport (SUPER_ADMIN ki SMTP) use hota hai — lekin From `noreply` hai aur
 * `sendEmail` guard `to === holder` (super admin) skip karta hai, to SUPER_ADMIN
 * ko kabhi copy na aaye.
 *
 * Branding rule: ye SUPER_ADMIN (platform) mail hai → public primary image
 * (CLIENT_URL/screen.png) + "School ERP" name. Org/Branch admin ki mail apni
 * taraf se org/branch logo + "Org - Branch" name leti hai (resolveEmailBranding).
 */
async function notifyAdminsOfModeration(admins, { entityName, entityType, action, reason }) {
  if (!admins || !admins.length) return;
  const branding = await resolveEmailBranding({}); // super admin context → public primary
  await Promise.allSettled(
    admins.map((admin) => {
      const tpl = moderationNoticeEmail({
        name: admin.name,
        entityName,
        entityType,
        action,
        reason,
        logoUrl: branding.logoUrl,
        themeColor: branding.themeColor,
      });
      return sendEmail({ to: admin.email, subject: tpl.subject, text: tpl.text, html: tpl.html });
    })
  );
}

async function bustOrgCaches(organizationId) {
  try {
    await redis.del([
      "orgs:all",
      `org:${organizationId}`,
      "superadmin:overview",
      `schools:org:${organizationId}`,
      "schools:all",
    ]);
  } catch (err) {
    // Non-blocking
  }
}

/** Org/school block/unblock par affected staff ka auth snapshot invalidate. */
async function bustAuthCachesByOrg(organizationId) {
  try {
    const users = await moderationRepository.findUserIdsByOrganization(organizationId);
    await Promise.all(users.map((u) => invalidateUserCache(u.id)));
  } catch (err) {
    // Non-blocking
  }
}

async function bustAuthCachesBySchool(schoolId) {
  try {
    const users = await moderationRepository.findUserIdsBySchool(schoolId);
    await Promise.all(users.map((u) => invalidateUserCache(u.id)));
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Broadcast a moderation event to every branch admin room of the org so the
 * portal status pill updates in realtime (spec §5 — status change wala scene).
 */
async function emitStatusToSchoolRooms(organizationId, event, payload) {
  try {
    const schools = await moderationRepository.findSchoolIdsByOrg(organizationId);
    for (const school of schools) {
      emitToRoom(`school:${school.id}`, event, payload);
    }
  } catch (err) {
    // Non-blocking — realtime is best-effort
  }
}

class ModerationService {
  // ════════════════════════════════════════════════════════════
  // ORGANIZATION — Super Admin only (spec §2.B)
  // ════════════════════════════════════════════════════════════
  async blockOrganization(requester, organizationId, { reason } = {}, req) {
    const org = await moderationRepository.findOrgById(organizationId);
    if (!org) throw ApiError.notFoundError("Organization not found");

    if (org.status === "BLOCKED") return org; // idempotent

    const meta = BLOCK_META(requester, reason);
    const updated = await moderationRepository.updateOrg(organizationId, {
      status: "BLOCKED",
      ...meta,
    });

    // Cascade: every branch is blocked (spec §2.B)
    await moderationRepository.updateSchoolsByOrg(organizationId, {
      status: "BLOCKED",
      ...meta,
    });

    // Kill active sessions across the whole org
    await moderationRepository.revokeTokensByOrganization(organizationId);

    await bustOrgCaches(organizationId);
    await bustAuthCachesByOrg(organizationId);
    emitToRoom("super_admins", "overview_updated", {});
    emitToRoom(`org:${organizationId}`, "organization_blocked", {
      organizationId,
      name: org.name,
    });
    emitStatusToSchoolRooms(organizationId, "organization_blocked", {
      organizationId,
      name: org.name,
    });

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.BLOCK_ORG,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: organizationId,
        entityName: org.name,
        organizationId,
        details: JSON.stringify({ reason: reason || null }),
      })
    );

    const admins = await moderationRepository.findAdminEmailsByOrganization(organizationId);
    notifyAdminsOfModeration(admins, {
      entityName: org.name,
      entityType: "ORGANIZATION",
      action: "blocked",
      reason,
    });

    // Portal notification — affected org feed ko block ka pata chale.
    portalNotificationService.create({
      organizationId, senderId: requester.id, senderName: requester.name,
      title: "ORG_MODERATION",
      body: `Organization "${org.name}" has been blocked${reason ? ` — reason: ${reason}` : ""}.`,
      category: "GENERAL",
      refType: "ORG_MODERATION",
      refId: organizationId,
    }).catch(() => {});

    return updated;
  }

  async unblockOrganization(requester, organizationId, req) {
    const org = await moderationRepository.findOrgById(organizationId);
    if (!org) throw ApiError.notFoundError("Organization not found");

    if (org.status !== "BLOCKED") return org; // idempotent

    const updated = await moderationRepository.updateOrg(organizationId, {
      status: "ACTIVE",
      ...UNBLOCK_META,
    });

    // Restore all branches (spec §2.D — reversible)
    await moderationRepository.updateSchoolsByOrg(organizationId, {
      status: "ACTIVE",
      ...UNBLOCK_META,
    });

    await bustOrgCaches(organizationId);
    await bustAuthCachesByOrg(organizationId);
    emitToRoom("super_admins", "overview_updated", {});
    emitToRoom(`org:${organizationId}`, "organization_unblocked", {
      organizationId,
      name: org.name,
    });
    emitStatusToSchoolRooms(organizationId, "organization_unblocked", {
      organizationId,
      name: org.name,
    });

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UNBLOCK_ORG,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: organizationId,
        entityName: org.name,
        organizationId,
      })
    );

    const admins = await moderationRepository.findAdminEmailsByOrganization(organizationId);
    notifyAdminsOfModeration(admins, {
      entityName: org.name,
      entityType: "ORGANIZATION",
      action: "unblocked",
    });

    portalNotificationService.create({
      organizationId, senderId: requester.id, senderName: requester.name,
      title: "ORG_MODERATION",
      body: `Organization "${org.name}" has been unblocked.`,
      category: "GENERAL",
      refType: "ORG_MODERATION",
      refId: organizationId,
    }).catch(() => {});

    return updated;
  }

  // ════════════════════════════════════════════════════════════
  // SCHOOL / BRANCH — Super Admin only (spec §2.A)
  // ════════════════════════════════════════════════════════════
  async blockSchool(requester, schoolId, { reason } = {}, req) {
    const school = await moderationRepository.findSchoolById(schoolId);
    if (!school) throw ApiError.notFoundError("Branch not found");

    if (school.status === "BLOCKED") return school; // idempotent
    if (school.organization.status === "BLOCKED") {
      throw ApiError.badRequestError(
        "This branch belongs to a blocked organization. Unblock the organization first."
      );
    }

    const meta = BLOCK_META(requester, reason);
    const updated = await moderationRepository.updateSchool(schoolId, {
      status: "BLOCKED",
      ...meta,
    });

    // Orgs with at least one blocked branch read as PARTIALLY_BLOCKED
    if (school.organization.status === "ACTIVE") {
      await moderationRepository.updateOrg(school.organizationId, {
        status: "PARTIALLY_BLOCKED",
      });
    }

    // Kill active sessions of branch staff
    await moderationRepository.revokeTokensBySchool(schoolId);

    await bustOrgCaches(school.organizationId);
    await bustAuthCachesBySchool(schoolId);
    try {
      await redis.del(`school:${schoolId}`);
    } catch (err) {
      // Non-blocking
    }
    emitToRoom("super_admins", "overview_updated", {});
    emitToRoom(`org:${school.organizationId}`, "school_blocked", {
      schoolId,
      organizationId: school.organizationId,
    });
    emitToRoom(`school:${schoolId}`, "school_blocked", {
      schoolId,
      organizationId: school.organizationId,
    });

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.BLOCK_SCHOOL,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: schoolId,
        entityName: school.name,
        organizationId: school.organizationId,
        schoolId,
        details: JSON.stringify({ reason: reason || null }),
      })
    );

    const admins = await moderationRepository.findAdminEmailsBySchool(schoolId);
    notifyAdminsOfModeration(admins, {
      entityName: school.name,
      entityType: "SCHOOL",
      action: "blocked",
      reason,
    });

    portalNotificationService.create({
      organizationId: school.organizationId, schoolId, senderId: requester.id, senderName: requester.name,
      title: "SCHOOL_MODERATION",
      body: `Branch "${school.name}" has been blocked${reason ? ` — reason: ${reason}` : ""}.`,
      category: "GENERAL",
      refType: "SCHOOL_MODERATION",
      refId: schoolId,
      link: "/branch",
    }).catch(() => {});

    return updated;
  }

  async unblockSchool(requester, schoolId, req) {
    const school = await moderationRepository.findSchoolById(schoolId);
    if (!school) throw ApiError.notFoundError("Branch not found");

    if (school.status !== "BLOCKED") return school; // idempotent

    const updated = await moderationRepository.updateSchool(schoolId, {
      status: "ACTIVE",
      ...UNBLOCK_META,
    });

    // Revert the org to ACTIVE when no branch stays blocked
    if (school.organization.status === "PARTIALLY_BLOCKED") {
      const remaining = await moderationRepository.countBlockedSchools(
        school.organizationId
      );
      if (remaining === 0) {
        await moderationRepository.updateOrg(school.organizationId, {
          status: "ACTIVE",
          ...UNBLOCK_META,
        });
      }
    }

    await bustOrgCaches(school.organizationId);
    await bustAuthCachesBySchool(schoolId);
    try {
      await redis.del(`school:${schoolId}`);
    } catch (err) {
      // Non-blocking
    }
    emitToRoom("super_admins", "overview_updated", {});
    emitToRoom(`org:${school.organizationId}`, "school_unblocked", {
      schoolId,
      organizationId: school.organizationId,
    });
    emitToRoom(`school:${schoolId}`, "school_unblocked", {
      schoolId,
      organizationId: school.organizationId,
    });

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UNBLOCK_SCHOOL,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: schoolId,
        entityName: school.name,
        organizationId: school.organizationId,
        schoolId,
      })
    );

    const admins = await moderationRepository.findAdminEmailsBySchool(schoolId);
    notifyAdminsOfModeration(admins, {
      entityName: school.name,
      entityType: "SCHOOL",
      action: "unblocked",
    });

    portalNotificationService.create({
      organizationId: school.organizationId, schoolId, senderId: requester.id, senderName: requester.name,
      title: "SCHOOL_MODERATION",
      body: `Branch "${school.name}" has been unblocked.`,
      category: "GENERAL",
      refType: "SCHOOL_MODERATION",
      refId: schoolId,
      link: "/branch",
    }).catch(() => {});

    return updated;
  }

  // ════════════════════════════════════════════════════════════
  // USER (staff) — Super Admin any branch, Branch Admin own branch (spec §2.C)
  // ════════════════════════════════════════════════════════════
  async blockUser(requester, userId, { reason } = {}, req) {
    const target = await moderationRepository.findUserById(userId);
    if (!target) throw ApiError.notFoundError("User not found");

    this._assertCanModerateStaff(requester, target, "block");
    if (target.id === requester.id) {
      throw ApiError.badRequestError("You cannot block your own account.");
    }
    if (!target.isActive) return target; // idempotent

    const updated = await moderationRepository.updateUser(userId, {
      isActive: false,
      ...BLOCK_META(requester, reason),
    });

    await moderationRepository.revokeTokensByUser(userId);
    await invalidateUserCache(userId);

    this._emitStaffModeration(requester, target);
    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.BLOCK_USER,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: userId,
        entityName: target.name,
        organizationId: target.organizationId,
        schoolId: target.schoolId,
        details: JSON.stringify({ reason: reason || null, role: target.role }),
      })
    );

    // Email the blocked staff member
    if (target.email) {
      const branding = await resolveEmailBranding({ organizationId: target.organizationId, schoolId: target.schoolId }).catch(() => ({}));
      const tpl = moderationNoticeEmail({
        name: target.name,
        entityName: target.name,
        entityType: "STAFF",
        action: "blocked",
        reason,
        logoUrl: branding.logoUrl,
        themeColor: branding.themeColor,
      });
      sendEmail({ to: target.email, subject: tpl.subject, text: tpl.text, html: tpl.html, schoolId: target.schoolId, organizationId: target.organizationId }).catch(() => {});
    }

    // Portal notification — branch feed me staff block dikhe.
    if (target.schoolId || target.organizationId) {
      portalNotificationService.create({
        schoolId: target.schoolId || undefined,
        organizationId: target.organizationId || undefined,
        senderId: requester.id,
        senderName: requester.name,
        title: "STAFF_BLOCKED",
        body: `${target.name} (${target.role}) has been blocked${reason ? ` — reason: ${reason}` : ""}.`,
        category: "STAFF",
        refType: "STAFF_MODERATION",
        refId: userId,
        link: "/staff",
      }).catch(() => {});
    }

    return updated;
  }

  async unblockUser(requester, userId, req) {
    const target = await moderationRepository.findUserById(userId);
    if (!target) throw ApiError.notFoundError("User not found");

    this._assertCanModerateStaff(requester, target, "unblock");
    if (target.isActive) return target; // idempotent

    const updated = await moderationRepository.updateUser(userId, {
      isActive: true,
      ...UNBLOCK_META,
    });

    await invalidateUserCache(userId);
    this._emitStaffModeration(requester, target);
    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UNBLOCK_USER,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: userId,
        entityName: target.name,
        organizationId: target.organizationId,
        schoolId: target.schoolId,
      })
    );

    // Email the unblocked staff member
    if (target.email) {
      const branding = await resolveEmailBranding({ organizationId: target.organizationId, schoolId: target.schoolId }).catch(() => ({}));
      const tpl = moderationNoticeEmail({
        name: target.name,
        entityName: target.name,
        entityType: "STAFF",
        action: "unblocked",
        reason: null,
        logoUrl: branding.logoUrl,
        themeColor: branding.themeColor,
      });
      sendEmail({ to: target.email, subject: tpl.subject, text: tpl.text, html: tpl.html, schoolId: target.schoolId, organizationId: target.organizationId }).catch(() => {});
    }

    // Portal notification — branch feed me staff unblock dikhe.
    if (target.schoolId || target.organizationId) {
      portalNotificationService.create({
        schoolId: target.schoolId || undefined,
        organizationId: target.organizationId || undefined,
        senderId: requester.id,
        senderName: requester.name,
        title: "STAFF_UNBLOCKED",
        body: `${target.name} (${target.role}) has been unblocked and can log in again.`,
        category: "STAFF",
        refType: "STAFF_MODERATION",
        refId: userId,
        link: "/staff",
      }).catch(() => {});
    }

    return updated;
  }

  // ════════════════════════════════════════════════════════════
  // STUDENT — Management (Super Admin any branch, Admin own branch)
  // ════════════════════════════════════════════════════════════
  async blockStudent(requester, studentId, { reason } = {}, req) {
    const student = await moderationRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");

    if (requester.role === "ADMIN" && student.schoolId !== requester.schoolId) {
      throw ApiError.forbiddenError(
        "You can only block students within your own branch."
      );
    }
    if (student.isBlocked) return student; // idempotent

    const updated = await moderationRepository.updateStudent(studentId, {
      isBlocked: true,
      ...BLOCK_META(requester, reason),
    });

    await invalidateEntityCache("auth:student", studentId);

    this._emitStudentModeration(requester, student);
    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.BLOCK_STUDENT,
        entityType: AUDIT_ENTITY_TYPES.STUDENT,
        entityId: studentId,
        entityName: `${student.firstName} ${student.lastName}`.trim(),
        organizationId: student.school.organizationId,
        schoolId: student.schoolId,
        details: JSON.stringify({ reason: reason || null }),
      })
    );

    return updated;
  }

  async unblockStudent(requester, studentId, req) {
    const student = await moderationRepository.findStudentById(studentId);
    if (!student) throw ApiError.notFoundError("Student not found");

    if (requester.role === "ADMIN" && student.schoolId !== requester.schoolId) {
      throw ApiError.forbiddenError(
        "You can only unblock students within your own branch."
      );
    }
    if (!student.isBlocked) return student; // idempotent

    const updated = await moderationRepository.updateStudent(studentId, {
      isBlocked: false,
      ...UNBLOCK_META,
    });

    await invalidateEntityCache("auth:student", studentId);

    this._emitStudentModeration(requester, student);
    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UNBLOCK_STUDENT,
        entityType: AUDIT_ENTITY_TYPES.STUDENT,
        entityId: studentId,
        entityName: `${student.firstName} ${student.lastName}`.trim(),
        organizationId: student.school.organizationId,
        schoolId: student.schoolId,
      })
    );

    return updated;
  }

  // ════════════════════════════════════════════════════════════
  // PARENT — Management (Super Admin any, Admin must be linked via student)
  // ════════════════════════════════════════════════════════════
  async blockParent(requester, parentId, { reason } = {}, req) {
    const parent = await moderationRepository.findParentById(parentId);
    if (!parent) throw ApiError.notFoundError("Parent not found");

    const linkedSchoolIds = parent.students.map((s) => s.schoolId);
    if (requester.role === "ADMIN" && !linkedSchoolIds.includes(requester.schoolId)) {
      throw ApiError.forbiddenError(
        "You can only block parents linked to students in your own branch."
      );
    }
    if (parent.isBlocked) return parent; // idempotent

    const updated = await moderationRepository.updateParent(parentId, {
      isBlocked: true,
      ...BLOCK_META(requester, reason),
    });

    await invalidateEntityCache("auth:parent", parentId);

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.BLOCK_PARENT,
        entityType: AUDIT_ENTITY_TYPES.PARENT,
        entityId: parentId,
        entityName: parent.name,
        schoolId: linkedSchoolIds[0] || null,
        details: JSON.stringify({ reason: reason || null }),
      })
    );

    return updated;
  }

  async unblockParent(requester, parentId, req) {
    const parent = await moderationRepository.findParentById(parentId);
    if (!parent) throw ApiError.notFoundError("Parent not found");

    const linkedSchoolIds = parent.students.map((s) => s.schoolId);
    if (requester.role === "ADMIN" && !linkedSchoolIds.includes(requester.schoolId)) {
      throw ApiError.forbiddenError(
        "You can only unblock parents linked to students in your own branch."
      );
    }
    if (!parent.isBlocked) return parent; // idempotent

    const updated = await moderationRepository.updateParent(parentId, {
      isBlocked: false,
      ...UNBLOCK_META,
    });

    await invalidateEntityCache("auth:parent", parentId);

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UNBLOCK_PARENT,
        entityType: AUDIT_ENTITY_TYPES.PARENT,
        entityId: parentId,
        entityName: parent.name,
        schoolId: linkedSchoolIds[0] || null,
      })
    );

    return updated;
  }

  // ════════════════════════════════════════════════════════════
  // GUARDRAILS (spec §2.D)
  // ════════════════════════════════════════════════════════════
  /**
   * Hierarchy rules for staff blocking:
   * - SUPER_ADMIN (platform owner) can block/unblock any staff account in any org.
   * - ADMIN (branch principal) can only block/unblock staff in their OWN branch
   *   AND only below ADMIN rank.
   */
  _assertCanModerateStaff(requester, target, verb) {
    if (requester.role === "SUPER_ADMIN") return;

    if (requester.role !== "ADMIN") {
      throw ApiError.forbiddenError(
        "You do not have permission to manage user accounts."
      );
    }

    if (target.role === "SUPER_ADMIN") {
      throw ApiError.forbiddenError(
        "You cannot block a Super Admin. Only the platform Super Admin can do that."
      );
    }
    if (target.role === "ADMIN") {
      throw ApiError.forbiddenError(
        "Branch Admins cannot be blocked by another Branch Admin — only the Super Admin."
      );
    }
    if (target.schoolId !== requester.schoolId) {
      throw ApiError.forbiddenError(
        `You can only ${verb} users within your own branch.`
      );
    }
  }

  _emitStaffModeration(requester, target) {
    try {
      redis.del(["orgs:all", "superadmin:overview"]).catch(() => {});
    } catch (err) {
      // Non-blocking
    }
    emitToRoom("super_admins", "overview_updated", {});
    if (target.schoolId) {
      emitToRoom(`school:${target.schoolId}`, "staff_status_updated", {
        userId: target.id,
      });
    }
  }

  _emitStudentModeration(requester, student) {
    emitToRoom(`school:${student.schoolId}`, "student_status_updated", {
      studentId: student.id,
    });
    emitToRoom("super_admins", "overview_updated", {});
  }
}

export default new ModerationService();
