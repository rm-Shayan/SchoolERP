import ApiResponse from "../../lib/utils/ApiResponse.js";
import emailTemplatesService from "./emailTemplates.service.js";

class EmailTemplatesController {
  _orgId(req) {
    return req.query.organizationId || req.body?.organizationId || req.user?.organizationId || null;
  }

  /** GET /email-templates?organizationId= */
  list = async (req, res, next) => {
    try {
      const result = await emailTemplatesService.list(req.user, this._orgId(req));
      return res.status(200).json(ApiResponse.ok("Email templates fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** GET /email-templates/:key — editor state for one template */
  getOne = async (req, res, next) => {
    try {
      const result = await emailTemplatesService.preview(req.user, this._orgId(req), req.params.key, {
        vars: req.query.vars ? JSON.parse(req.query.vars) : undefined,
      });
      return res.status(200).json(ApiResponse.ok("Email template fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** PUT /email-templates/:key — save subject/body override */
  upsert = async (req, res, next) => {
    try {
      const result = await emailTemplatesService.upsert(req.user, this._orgId(req), req.params.key, {
        subject: req.body.subject,
        bodyHtml: req.body.bodyHtml,
      });
      return res.status(200).json(ApiResponse.ok("Email template saved", result));
    } catch (error) {
      return next(error);
    }
  };

  /** DELETE /email-templates/:key — discard the override */
  reset = async (req, res, next) => {
    try {
      const result = await emailTemplatesService.reset(req.user, this._orgId(req), req.params.key);
      return res.status(200).json(ApiResponse.ok("Email template reset to default", result));
    } catch (error) {
      return next(error);
    }
  };

  /** POST /email-templates/:key/preview — rendered default + override */
  preview = async (req, res, next) => {
    try {
      const result = await emailTemplatesService.preview(req.user, this._orgId(req), req.params.key, {
        vars: req.body.vars,
      });
      return res.status(200).json(ApiResponse.ok("Preview rendered", result));
    } catch (error) {
      return next(error);
    }
  };
}

export default new EmailTemplatesController();
