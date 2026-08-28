import ApiResponse from "../../lib/utils/ApiResponse.js";
import smtpSettingsService from "./smtpSettings.service.js";

class SmtpSettingsController {
  /** GET /smtp/settings?organizationId=&schoolId= */
  getStatus = async (req, res, next) => {
    try {
      const result = await smtpSettingsService.getStatus(
        req.user,
        req.query.organizationId || null,
        req.query.schoolId || null
      );
      return res.status(200).json(ApiResponse.ok("SMTP settings fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** PUT /smtp/settings — upsert org default ya branch override */
  upsert = async (req, res, next) => {
    try {
      const payload = {
        organizationId: req.body.organizationId || req.user?.organizationId,
        schoolId: req.body.schoolId || null,
        host: req.body.host,
        port: req.body.port ?? 587,
        secure: req.body.secure === true || req.body.secure === "true",
        username: req.body.username,
        password: req.body.password,
        fromName: req.body.fromName,
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
        req.query.schoolId || null,
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
        req.body.schoolId || null
      );
      return res.status(200).json(ApiResponse.ok("Test email sent successfully", result));
    } catch (error) {
      return next(error);
    }
  };
}

export default new SmtpSettingsController();
