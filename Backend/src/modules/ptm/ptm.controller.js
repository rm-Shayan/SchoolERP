import ptmService from "./ptm.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class PtmController {
  createSession = asyncHandler(async (req, res) => {
    const result = await ptmService.createSession(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("PTM session scheduled", result));
  });

  listSessions = asyncHandler(async (req, res) => {
    const result = await ptmService.listSessions(req.user, req.params.schoolId || req.query.schoolId, req.query);
    return res.status(200).json(ApiResponse.ok("PTM sessions fetched", result));
  });

  getSession = asyncHandler(async (req, res) => {
    const session = await ptmService.getSession(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("PTM session fetched", session));
  });

  updateSession = asyncHandler(async (req, res) => {
    const session = await ptmService.updateSession(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("PTM session updated", session));
  });

  deleteSession = asyncHandler(async (req, res) => {
    await ptmService.deleteSession(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("PTM session deleted"));
  });
}

export default new PtmController();
