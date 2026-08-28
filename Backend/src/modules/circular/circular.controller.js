import circularService from "./circular.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class CircularController {
  /**
   * POST /api/v1/circulars/schools/:schoolId
   * Publish a circular → email to all parents.
   */
  createCircular = asyncHandler(async (req, res) => {
    const result = await circularService.createCircular(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Circular published", result));
  });

  /**
   * GET /api/v1/circulars/schools/:schoolId
   * List circulars.
   */
  listCirculars = asyncHandler(async (req, res) => {
    const result = await circularService.listCirculars(req.user, req.params.schoolId || req.query.schoolId, req.query);
    return res.status(200).json(ApiResponse.ok("Circulars fetched", result));
  });

  /**
   * GET /api/v1/circulars/:id
   */
  getCircular = asyncHandler(async (req, res) => {
    const circular = await circularService.getCircular(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Circular fetched", circular));
  });

  /**
   * DELETE /api/v1/circulars/:id
   */
  deleteCircular = asyncHandler(async (req, res) => {
    await circularService.deleteCircular(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Circular deleted"));
  });
}

export default new CircularController();
