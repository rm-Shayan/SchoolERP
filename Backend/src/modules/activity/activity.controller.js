import activityService from "./activity.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class ActivityController {
  /**
   * POST /api/v1/activities/schools/:schoolId
   */
  createActivity = asyncHandler(async (req, res) => {
    const activity = await activityService.createActivity(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Activity created", activity));
  });

  /**
   * GET /api/v1/activities/schools/:schoolId
   */
  listActivities = asyncHandler(async (req, res) => {
    const result = await activityService.listActivities(req.user, req.params.schoolId || req.query.schoolId, req.query);
    return res.status(200).json(ApiResponse.ok("Activities fetched", result));
  });

  /**
   * GET /api/v1/activities/:id
   */
  getActivity = asyncHandler(async (req, res) => {
    const activity = await activityService.getActivity(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Activity fetched", activity));
  });

  /**
   * PATCH /api/v1/activities/:id
   */
  updateActivity = asyncHandler(async (req, res) => {
    const activity = await activityService.updateActivity(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Activity updated", activity));
  });

  /**
   * DELETE /api/v1/activities/:id
   */
  deleteActivity = asyncHandler(async (req, res) => {
    await activityService.deleteActivity(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Activity deleted"));
  });
}

export default new ActivityController();
