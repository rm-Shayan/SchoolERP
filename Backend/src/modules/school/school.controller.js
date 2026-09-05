import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import schoolService from "./school.service.js";
import { imageUpload, fileUpload } from "../../lib/upload.js";

class SchoolController {
  branding = async (req, res, next) => {
    try {
      const { code, slug, organization, school } = req.query;
      const result = await schoolService.getBranding({ code, slug, organization, school });
      return res.status(200).json(ApiResponse.ok("School branding fetched successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  // ── Shared parent/student portal password ──────────────────────

  portalPasswordStatus = async (req, res, next) => {
    try {
      const result = await schoolService.getPortalPasswordStatus(req.params.id);
      return res.status(200).json(ApiResponse.ok("Portal password status fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  setPortalPassword = async (req, res, next) => {
    try {
      const password = String(req.body?.password || "");
      if (password.trim().length < 6) {
        throw ApiError.badRequestError("Portal password must be at least 6 characters");
      }
      await schoolService.setPortalPassword(req.user, req.params.id, password);
      return res.status(200).json(ApiResponse.ok("Portal password updated — parents/students will use the new password", true));
    } catch (error) {
      return next(error);
    }
  };

  resetPortalPassword = async (req, res, next) => {
    try {
      await schoolService.resetPortalPassword(req.user, req.params.id);
      return res.status(200).json(ApiResponse.ok("Portal password reset to default (school code)", true));
    } catch (error) {
      return next(error);
    }
  };


  create = async (req, res, next) => {
    try {
      const payload = {
        ...req.body,
        organizationId: req.body.organizationId || req.user?.organizationId,
      };
      const result = await schoolService.create(payload, req.user, req);
      return res.status(201).json(ApiResponse.created("School created successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /schools/export?organizationId=...
   * Streams an Excel (.xlsx) file of branches (all or one organization's).
   */
  exportExcel = async (req, res, next) => {
    try {
      const buffer = await schoolService.exportExcel(req.query.organizationId || null);
      const filename = `branches-${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /schools/import-template
   * Streams a blank Excel (.xlsx) template with the import columns.
   */
  downloadImportTemplate = async (req, res, next) => {
    try {
      const buffer = await schoolService.downloadImportTemplate();
      const filename = "branches-import-template.xlsx";
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /schools/import-excel
   * Multipart form-data: file (xlsx/xls, max 10 MB) + optional organizationId.
   */
  importExcel = async (req, res, next) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)"));
      }

      const result = await schoolService.importExcel(
        req.file.buffer,
        req.body.organizationId || null,
        req.user,
        req
      );
      return res
        .status(202)
        .json(
          new ApiResponse("Branch import job scheduled successfully", 202, {
            jobId: result.jobId,
            totalRows: result.totalRows,
          })
        );
    } catch (error) {
      return next(error);
    }
  };

  // Expose multer middleware for use in routes
  uploadMiddleware = fileUpload.single("file");

  logoUploadMiddleware = imageUpload.single("file");

  list = async (req, res, next) => {
    try {
      const orgId = req.query.organizationId || req.user?.organizationId;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 100));
      const schools = await schoolService.list(orgId, { page, pageSize });
      return res.status(200).json(ApiResponse.ok("Schools fetched successfully", schools));
    } catch (error) {
      return next(error);
    }
  };


  getById = async (req, res, next) => {
    try {
      const school = await schoolService.getById(req.params.id);
      return res.status(200).json(ApiResponse.ok("School fetched successfully", school));
    } catch (error) {
      return next(error);
    }
  };

  analytics = async (req, res, next) => {
    try {
      const data = await schoolService.getAnalytics(req.params.id);
      return res.status(200).json(ApiResponse.ok("Branch analytics fetched", data));
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { name, code, address, phone, logoUrl, themeColor, attendanceStartTime, attendanceCutoffTime, attendanceAbsentTime, attendanceAlertTime, bankName, bankAccountTitle, bankAccountNumber } = req.body;
      const updated = await schoolService.update(req.params.id, { name, code, address, phone, logoUrl, themeColor, attendanceStartTime, attendanceCutoffTime, attendanceAbsentTime, attendanceAlertTime, bankName, bankAccountTitle, bankAccountNumber }, req.user, req);
      return res.status(200).json(ApiResponse.ok("School updated successfully", updated));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /schools/logo
   * Upload a logo for a school branch. Optional form field `schoolId` lets the
   * upload overwrite the branch's existing Cloudinary asset (same public_id).
   */
  uploadLogo = async (req, res, next) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequestError("Please upload an image file"));
      }
      const schoolId = req.body.schoolId || req.query.schoolId || null;
      const organizationId = req.user?.organizationId || null;
      const result = await schoolService.uploadLogo(req.file.buffer, schoolId, organizationId);
      return res.status(200).json(ApiResponse.ok("Logo uploaded successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /schools/:id/admin
   * Re-assign the branch admin — switch to the organization admin or create
   * a new Principal account (credentials emailed).
   */
  assignAdmin = async (req, res, next) => {
    try {
      const result = await schoolService.assignAdmin(req.params.id, req.body, req.user, req);
      return res.status(200).json(ApiResponse.ok("Branch admin updated successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await schoolService.remove(req.params.id, req.user, req);
      return res.status(200).json(ApiResponse.ok("School deleted successfully"));
    } catch (error) {
      return next(error);
    }
  };
}

export default new SchoolController();
