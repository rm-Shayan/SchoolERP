import homeworkService from "./homework.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class HomeworkController {
  /**
   * POST /api/v1/homework
   * Post homework for a section → emails all parents of that section.
   */
  createBroadcast = asyncHandler(async (req, res) => {
    const result = await homeworkService.createBroadcast(req.user, req.body);
    return res.status(201).json(ApiResponse.created("Homework posted successfully", result));
  });

  /**
   * GET /api/v1/homework
   * List homework broadcasts (filter by section).
   */
  listBroadcasts = asyncHandler(async (req, res) => {
    const result = await homeworkService.listBroadcasts(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Homework broadcasts fetched", result));
  });

  /**
   * GET /api/v1/homework/:id
   * Single homework broadcast.
   */
  getBroadcast = asyncHandler(async (req, res) => {
    const broadcast = await homeworkService.getBroadcast(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Homework broadcast fetched", broadcast));
  });

  /**
   * PUT /api/v1/homework/:id
   * Update a homework broadcast (admin any, teacher own).
   */
  updateBroadcast = asyncHandler(async (req, res) => {
    const broadcast = await homeworkService.updateBroadcast(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Homework broadcast updated", broadcast));
  });

  /**
   * DELETE /api/v1/homework/:id
   * Delete a homework broadcast.
   */
  deleteBroadcast = asyncHandler(async (req, res) => {
    await homeworkService.deleteBroadcast(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Homework broadcast deleted"));
  });
}

export default new HomeworkController();
