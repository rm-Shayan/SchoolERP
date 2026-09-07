import studyMaterialRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import { emitToRoom } from "../../config/websocket.js";
import portalNotificationService from "../notification/notification.portalService.js";
import prisma from "../../config/db.js";

class StudyMaterialService {
  /**
   * Targeted notification — material kis scope ke liye hai is hisaab se recipients decide karte hain.
   * - sectionId null → whole school ki staff ko notification jani chahiye
   * - sectionId specific → us section ke teachers/staff ko notification jani chahiye
   */
  async sendStudyMaterialNotification({ schoolId, sectionId, title, action, user }) {
    const bodyMap = {
      CREATED: `"${title}" uploaded by ${user.name}.`,
      UPDATED: `"${title}" updated by ${user.name}.`,
      DELETED: `"${title}" deleted by ${user.name}.`,
    };
    const titleMap = {
      CREATED: "STUDY_MATERIAL_CREATED",
      UPDATED: "STUDY_MATERIAL_UPDATED",
      DELETED: "STUDY_MATERIAL_DELETED",
    };

    try {
      // Target recipients fetch karo
      const recipients = await this._getStudyMaterialRecipients(schoolId, sectionId);
      const promises = recipients.map((recipient) =>
        portalNotificationService.create({
          schoolId,
          senderId: user.id,
          senderName: user.name,
          recipientId: recipient.id,
          title: titleMap[action] || "STUDY_MATERIAL_CREATED",
          body: bodyMap[action] || bodyMap.CREATED,
          category: "ACADEMIC",
          refType: "STUDY_MATERIAL",
          refId: null,
          link: "/study-material",
        }).catch(() => {})
      );
      await Promise.allSettled(promises);

      // School-wide feed notification bhi jaye (recipientId null)
      portalNotificationService.create({
        schoolId,
        senderId: user.id,
        senderName: user.name,
        title: titleMap[action] || "STUDY_MATERIAL_CREATED",
        body: bodyMap[action] || bodyMap.CREATED,
        category: "ACADEMIC",
        refType: "STUDY_MATERIAL",
        refId: null,
        link: "/study-material",
      }).catch(() => {});
    } catch (err) {
      console.warn(`[study-material] Notification dispatch failed: ${err.message}`);
    }
  }

  /**
   * Section ke teachers + school ke saare active staff
   */
  async _getStudyMaterialRecipients(schoolId, sectionId) {
    if (!sectionId) {
      // Whole school — saare active staff
      return prisma.user.findMany({
        where: { schoolId, isActive: true, role: { in: ["ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARY"] } },
        select: { id: true, name: true },
      });
    }
    // Specific section — us section ke teachers, plus school ke saare active staff
    const sectionTeachers = await prisma.teacherSection.findMany({
      where: { sectionId, teacher: { isActive: true } },
      select: { teacher: { select: { id: true, name: true } } },
    });
    const teacherIds = sectionTeachers.map((ts) => ts.teacher.id);

    // Section ke teachers + school ke saare staff
    return prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        role: { in: ["ADMIN", "TEACHER", "ACCOUNTANT", "LIBRARY"] },
        ...(teacherIds.length ? { id: { in: teacherIds } } : { id: null }),
      },
      select: { id: true, name: true },
    });
  }

  /**
   * Admin and teachers can create study material.
   * Teachers can only upload for their assigned sections.
   */
  async create(user, data) {
    const schoolId = data.schoolId || user.schoolId;
    assertOwnSchool(user, schoolId);

    const material = await studyMaterialRepository.create({
      schoolId,
      title: data.title,
      description: data.description || null,
      type: data.type || "DOCUMENT",
      fileUrl: data.fileUrl || null,
      linkUrl: data.linkUrl || null,
      sectionId: data.sectionId || null,
      subjectId: data.subjectId || null,
      createdById: user.id,
    });

    emitToRoom(`school:${schoolId}`, "study_material_created", {
      id: material.id,
      title: material.title,
      createdBy: user.name,
    });

    // Portal notification — section ke hisaab se targeted
    await this.sendStudyMaterialNotification({
      schoolId,
      sectionId: material.sectionId,
      title: material.title,
      action: "CREATED",
      user,
    });

    return material;
  }

  async list(user, query) {
    const schoolId = query.schoolId || user.schoolId;
    if (!schoolId) {
      if (user.role === "SUPER_ADMIN") throw ApiError.badRequestError("schoolId is required");
      throw ApiError.forbiddenError("Your account is not associated with any school branch.");
    }
    assertSchoolAccess(user, schoolId);

    // All staff in the branch see every material (general + section-specific).
    // `createdById` remains an optional explicit filter for the caller.
    const filterUserId = query.createdById || undefined;

    return studyMaterialRepository.listBySchool(schoolId, {
      sectionId: query.sectionId,
      subjectId: query.subjectId,
      type: query.type,
      createdById: filterUserId,
      page: Math.max(1, parseInt(query.page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 50)),
    });
  }

  async getOne(user, id) {
    const material = await studyMaterialRepository.findById(id);
    if (!material) throw ApiError.notFoundError("Study material not found");
    assertSchoolAccess(user, material.schoolId);
    return material;
  }

  async update(user, id, data) {
    const material = await studyMaterialRepository.findById(id);
    if (!material) throw ApiError.notFoundError("Study material not found");
    assertOwnSchool(user, material.schoolId);

    // Teachers can only edit their own
    if (user.role === "TEACHER" && material.createdById !== user.id) {
      throw ApiError.forbiddenError("You can only edit study material you uploaded");
    }

    const patch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.type !== undefined) patch.type = data.type;
    if (data.fileUrl !== undefined) patch.fileUrl = data.fileUrl;
    if (data.linkUrl !== undefined) patch.linkUrl = data.linkUrl;
    if (data.sectionId !== undefined) patch.sectionId = data.sectionId;
    if (data.subjectId !== undefined) patch.subjectId = data.subjectId;

    const updated = await studyMaterialRepository.update(id, patch);

    // Notification — section ke hisaab se targeted
    const effectiveSectionId = data.sectionId !== undefined ? data.sectionId : material.sectionId;
    await this.sendStudyMaterialNotification({
      schoolId: material.schoolId,
      sectionId: effectiveSectionId,
      title: patch.title || material.title,
      action: "UPDATED",
      user,
    });

    return updated;
  }

  async delete(user, id) {
    const material = await studyMaterialRepository.findById(id);
    if (!material) throw ApiError.notFoundError("Study material not found");
    assertOwnSchool(user, material.schoolId);

    // Teachers can only delete their own
    if (user.role === "TEACHER" && material.createdById !== user.id) {
      throw ApiError.forbiddenError("You can only delete study material you uploaded");
    }

    emitToRoom(`school:${material.schoolId}`, "study_material_deleted", { id });

    // Notification — section ke hisaab se targeted
    await this.sendStudyMaterialNotification({
      schoolId: material.schoolId,
      sectionId: material.sectionId,
      title: material.title,
      action: "DELETED",
      user,
    });

    await studyMaterialRepository.delete(id);
    return true;
  }

  /**
   * Portal endpoint — parents and students view study material for their sections.
   */
  async listForPortal(portal) {
    return studyMaterialRepository.listForPortal(portal.sectionIds);
  }
}

export default new StudyMaterialService();
