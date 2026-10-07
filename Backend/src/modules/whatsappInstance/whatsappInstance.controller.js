import ApiResponse from "../../lib/utils/ApiResponse.js";
import service from "./whatsappInstance.service.js";

/** Credentials/session always belong to a branch; admins default to their own. */
function branchId(req) {
  return req.body?.schoolId ?? req.query?.schoolId ?? req.user?.schoolId ?? null;
}
function orgId(req) {
  return req.body?.organizationId ?? req.query?.organizationId ?? req.user?.organizationId ?? null;
}

class WhatsAppInstanceController {
  getStatus = async (req, res, next) => {
    try {
      const result = await service.getStatus(req.user, orgId(req), branchId(req));
      return res.status(200).json(ApiResponse.ok("WhatsApp status fetched", result));
    } catch (error) { return next(error); }
  };

  listByOrg = async (req, res, next) => {
    try {
      const result = await service.listByOrg(req.user, orgId(req));
      return res.status(200).json(ApiResponse.ok("WhatsApp instances fetched", result));
    } catch (error) { return next(error); }
  };

  connect = async (req, res, next) => {
    try {
      const result = await service.connect(req.user, orgId(req), branchId(req));
      return res.status(200).json(ApiResponse.ok("WhatsApp instance created, scan QR to connect", result));
    } catch (error) { return next(error); }
  };

  refreshQr = async (req, res, next) => {
    try {
      const result = await service.refreshQr(req.user, orgId(req), branchId(req));
      return res.status(200).json(ApiResponse.ok("New QR generated", result));
    } catch (error) { return next(error); }
  };

  sync = async (req, res, next) => {
    try {
      const result = await service.sync(req.user, orgId(req), branchId(req));
      return res.status(200).json(ApiResponse.ok("WhatsApp state synced", result));
    } catch (error) { return next(error); }
  };

  setEnabled = async (req, res, next) => {
    try {
      const result = await service.setEnabled(req.user, orgId(req), branchId(req), req.body?.isEnabled);
      return res.status(200).json(ApiResponse.ok("WhatsApp enabled flag updated", result));
    } catch (error) { return next(error); }
  };

  remove = async (req, res, next) => {
    try {
      await service.remove(req.user, orgId(req), branchId(req));
      return res.status(200).json(ApiResponse.ok("WhatsApp instance removed", true));
    } catch (error) { return next(error); }
  };
}

export default new WhatsAppInstanceController();
