import auditService from "./audit.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class AuditController {
  /**
   * GET /api/v1/audit-logs
   * Activity log entries (logins, block/unblock, org/branch/staff lifecycle).
   */
  listLogs = asyncHandler(async (req, res) => {
    const result = await auditService.listLogs(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Activity log fetched", result));
  });
}

export default new AuditController();
