import studyMaterialService from "./studyMaterial.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import storageService from "../../services/storage.service.js";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function uploadToStorage(file, type, user) {
  if (!file) return null;
  const schoolId = user.schoolId;
  const orgId = user.organizationId || null;
  const isImage = IMAGE_MIMES.has(file.mimetype) || type === "IMAGE";
  const result = isImage
    ? await storageService.uploadImage({ buffer: file.buffer, folder: "study-materials", organizationId: orgId, schoolId })
    : await storageService.uploadDocument({ buffer: file.buffer, folder: "study-materials", filename: file.originalname, organizationId: orgId, schoolId });
  return result.url;
}

class StudyMaterialController {
  create = asyncHandler(async (req, res) => {
    const { title, description, type, linkUrl, sectionId, subjectId } = req.body;
    if (!title || !title.trim()) throw ApiError.badRequestError("Title is required");

    // File OR URL — at least one required
    let fileUrl = null;
    if (req.file) {
      fileUrl = await uploadToStorage(req.file, type, req.user);
    }
    if (!fileUrl && !linkUrl) {
      throw ApiError.badRequestError("Please upload a file or provide a URL");
    }

    const result = await studyMaterialService.create(req.user, {
      title: title.trim(),
      description: description || null,
      type: type || "DOCUMENT",
      fileUrl: fileUrl || null,
      linkUrl: linkUrl || null,
      sectionId: sectionId || null,
      subjectId: subjectId || null,
      schoolId: req.user.schoolId,
    });
    return res.status(201).json(ApiResponse.created("Study material created", result));
  });

  list = asyncHandler(async (req, res) => {
    const result = await studyMaterialService.list(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Study materials fetched", result));
  });

  getOne = asyncHandler(async (req, res) => {
    const material = await studyMaterialService.getOne(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Study material fetched", material));
  });

  update = asyncHandler(async (req, res) => {
    const patch = {};
    const { title, description, type, linkUrl, sectionId, subjectId } = req.body;
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (type !== undefined) patch.type = type;
    if (linkUrl !== undefined) patch.linkUrl = linkUrl;
    if (sectionId !== undefined) patch.sectionId = sectionId;
    if (subjectId !== undefined) patch.subjectId = subjectId;

    // Optional file replacement on update
    if (req.file) {
      patch.fileUrl = await uploadToStorage(req.file, type || patch.type, req.user);
    }

    const material = await studyMaterialService.update(req.user, req.params.id, patch);
    return res.status(200).json(ApiResponse.ok("Study material updated", material));
  });

  delete = asyncHandler(async (req, res) => {
    await studyMaterialService.delete(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Study material deleted"));
  });

  listPortal = asyncHandler(async (req, res) => {
    const result = await studyMaterialService.listForPortal(req.portal);
    return res.status(200).json(ApiResponse.ok("Study materials fetched", result));
  });
}

export default new StudyMaterialController();
