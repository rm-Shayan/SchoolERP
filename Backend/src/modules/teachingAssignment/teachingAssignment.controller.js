import teachingAssignmentService from "./teachingAssignment.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class TeachingAssignmentController {
  assign = asyncHandler(async (req, res) => {
    const assignment = await teachingAssignmentService.assign(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Teacher assignment saved", assignment));
  });

  list = asyncHandler(async (req, res) => {
    const result = await teachingAssignmentService.list(req.user, req.params.schoolId, req.query);
    return res.status(200).json(ApiResponse.ok("Teaching assignments fetched", result));
  });

  listMe = asyncHandler(async (req, res) => {
    const result = await teachingAssignmentService.listMe(req.user, req.params.schoolId);
    return res.status(200).json(ApiResponse.ok("My teaching assignments fetched", result));
  });

  remove = asyncHandler(async (req, res) => {
    await teachingAssignmentService.remove(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Assignment removed"));
  });
}

export default new TeachingAssignmentController();