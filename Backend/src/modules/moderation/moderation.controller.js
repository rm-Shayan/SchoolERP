import moderationService from "./moderation.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class ModerationController {
  // ── Organization ──────────────────────────────────────────────
  blockOrganization = asyncHandler(async (req, res) => {
    const org = await moderationService.blockOrganization(
      req.user,
      req.params.id,
      req.body,
      req
    );
    return res.status(200).json(ApiResponse.ok("Organization blocked", org));
  });

  unblockOrganization = asyncHandler(async (req, res) => {
    const org = await moderationService.unblockOrganization(
      req.user,
      req.params.id,
      req
    );
    return res.status(200).json(ApiResponse.ok("Organization unblocked", org));
  });

  // ── School / Branch ───────────────────────────────────────────
  blockSchool = asyncHandler(async (req, res) => {
    const school = await moderationService.blockSchool(
      req.user,
      req.params.id,
      req.body,
      req
    );
    return res.status(200).json(ApiResponse.ok("Branch blocked", school));
  });

  unblockSchool = asyncHandler(async (req, res) => {
    const school = await moderationService.unblockSchool(
      req.user,
      req.params.id,
      req
    );
    return res.status(200).json(ApiResponse.ok("Branch unblocked", school));
  });

  // ── User (staff) ──────────────────────────────────────────────
  blockUser = asyncHandler(async (req, res) => {
    const user = await moderationService.blockUser(
      req.user,
      req.params.id,
      req.body,
      req
    );
    return res.status(200).json(ApiResponse.ok("User blocked", user));
  });

  unblockUser = asyncHandler(async (req, res) => {
    const user = await moderationService.unblockUser(req.user, req.params.id, req);
    return res.status(200).json(ApiResponse.ok("User unblocked", user));
  });

  // ── Student ───────────────────────────────────────────────────
  blockStudent = asyncHandler(async (req, res) => {
    const student = await moderationService.blockStudent(
      req.user,
      req.params.id,
      req.body,
      req
    );
    return res.status(200).json(ApiResponse.ok("Student blocked", student));
  });

  unblockStudent = asyncHandler(async (req, res) => {
    const student = await moderationService.unblockStudent(
      req.user,
      req.params.id,
      req
    );
    return res.status(200).json(ApiResponse.ok("Student unblocked", student));
  });

  // ── Parent ────────────────────────────────────────────────────
  blockParent = asyncHandler(async (req, res) => {
    const parent = await moderationService.blockParent(
      req.user,
      req.params.id,
      req.body,
      req
    );
    return res.status(200).json(ApiResponse.ok("Parent blocked", parent));
  });

  unblockParent = asyncHandler(async (req, res) => {
    const parent = await moderationService.unblockParent(
      req.user,
      req.params.id,
      req
    );
    return res.status(200).json(ApiResponse.ok("Parent unblocked", parent));
  });
}

export default new ModerationController();
