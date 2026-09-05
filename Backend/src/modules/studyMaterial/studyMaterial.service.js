import studyMaterialRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import { emitToRoom } from "../../config/websocket.js";
import portalNotificationService from "../notification/notification.portalService.js";

class StudyMaterialService {
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

    portalNotificationService.create({
      schoolId,
      senderId: user.id,
      senderName: user.name,
      title: "STUDY_MATERIAL_CREATED",
      body: `"${data.title}" uploaded by ${user.name}.`,
      category: "ACADEMIC",
      refType: "STUDY_MATERIAL",
      refId: material.id,
      link: "/study-material",
    }).catch(() => {});

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

    return studyMaterialRepository.update(id, patch);
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
