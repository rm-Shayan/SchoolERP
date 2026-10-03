import ApiResponse from "../../lib/utils/ApiResponse.js";
import smtpSettingsService from "./smtpSettings.service.js";

class SmtpSettingsController {
  /** Credentials always belong to a branch; admins default to their own. */
  _branchId(req) {
    return req.body?.schoolId ?? req.query?.schoolId ?? req.user?.schoolId ?? null;
  }

  /** GET /smtp/settings?organizationId=&schoolId= */
  getStatus = async (req, res, next) => {
    try {
      const result = await smtpSettingsService.getStatus(
        req.user,
        req.query.organizationId || req.user?.organizationId || null,
        this._branchId(req)
      );
      return res.status(200).json(ApiResponse.ok("SMTP settings fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** PUT /smtp/settings — upsert this branch's SMTP (primary + secondary failover) */
  upsert = async (req, res, next) => {
    try {
      const payload = {
        organizationId: req.body.organizationId || req.user?.organizationId,
        schoolId: this._branchId(req),
        host: req.body.host,
        port: req.body.port ?? 587,
        secure: req.body.secure === true || req.body.secure === "true",
        username: req.body.username,
        password: req.body.password,
        fromName: req.body.fromName,
        dailyLimit: req.body.dailyLimit,
        tier: req.body.tier,
      };
      const result = await smtpSettingsService.upsert(req.user, payload);
      return res
        .status(result ? 200 : 201)
        .json(ApiResponse.ok("SMTP settings saved and verified", result));
    } catch (error) {
      return next(error);
    }
  };

  /** DELETE /smtp/settings?organizationId=&schoolId= */
  remove = async (req, res, next) => {
    try {
      await smtpSettingsService.remove(
        req.user,
        req.query.organizationId || req.user?.organizationId || null,
        this._branchId(req),
        req.query.tier
      );
      return res.status(200).json(ApiResponse.ok("SMTP settings removed", true));
    } catch (error) {
      return next(error);
    }
  };

  /** POST /smtp/settings/test-send { organizationId?, schoolId? } */
  testSend = async (req, res, next) => {
    try {
      const result = await smtpSettingsService.sendTestEmail(
        req.user,
        req.body.organizationId || req.user?.organizationId || null,
        this._branchId(req)
      );
      return res.status(200).json(ApiResponse.ok("Test email sent successfully", result));
    } catch (error) {
      return next(error);
    }
  };
}

export default new SmtpSettingsController();
