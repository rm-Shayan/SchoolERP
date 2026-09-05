import auditService from "./audit.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { buildCsv, sendCsv } from "../../lib/utils/csv.js";
import { AUDIT_ACTION_LABELS } from "./actions.js";

const CSV_HEADERS = ["Date", "Time", "Actor", "Role", "Action", "Entity Type", "Entity Name", "IP Address"];

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEACHER: "Teacher",
  RECEPTIONIST: "Receptionist",
  PARENT: "Parent",
  STUDENT: "Student",
};

function getActionLabel(action, actorRole) {
  const base = AUDIT_ACTION_LABELS[action] || action;
  if ((action === "LOGIN" || action === "LOGOUT") && actorRole) {
    const prefix = ROLE_LABELS[actorRole.toUpperCase()] || actorRole;
    return `${prefix} ${action === "LOGIN" ? "login" : "logout"}`;
  }
  return base;
}

class AuditController {
  listLogs = asyncHandler(async (req, res) => {
    const result = await auditService.listLogs(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Activity log fetched", result));
  });

  exportCsv = asyncHandler(async (req, res) => {
    const rows = await auditService.exportCsv(req.user, req.query);
    const csvRows = rows.map((r) => {
      const d = new Date(r.createdAt);
      return [
        d.toLocaleDateString("en-PK"),
        d.toLocaleTimeString("en-PK"),
        r.actorName || "System",
        ROLE_LABELS[r.actorRole?.toUpperCase()] || r.actorRole || "—",
        getActionLabel(r.action, r.actorRole),
        r.entityType,
        r.entityName || "—",
        r.ipAddress || "—",
      ];
    });
    const { csv } = buildCsv(CSV_HEADERS, csvRows);
    return sendCsv(res, csv, "activity-log");
  });
}

export default new AuditController();
