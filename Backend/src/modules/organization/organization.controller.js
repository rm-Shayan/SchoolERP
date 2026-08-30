import organizationService from "./organization.service.js";
import { OrganizationResponseDTO } from "./organization.dto.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import { imageUpload, fileUpload } from "../../lib/upload.js";

class OrganizationController {
  /**
   * POST /organizations/
   * Body: { name, code }
   */
  create = async (req, res, next) => {
    try {
      const { name, code, slug, logoUrl, adminEmail, adminName, adminUsername, adminPassword, adminPhone } = req.body;

      if (!name || !code) {
        return next(ApiError.badRequestError("'name' and 'code' are required"));
      }

      const result = await organizationService.createOrganization(
        {
          name,
          code,
          slug,
          logoUrl,
          themeColor: req.body.themeColor || null,
          adminEmail,
          adminName,
          adminUsername,
          adminPassword,
          adminPhone,
          // Optional tenant SMTP creds at creation time:
          // { host, port, secure, username, password } — verified before save.
          smtp: req.body.smtp || null,
          smtpSecondary: req.body.smtpSecondary || null,
          // Optional tenant Cloudinary creds at creation time:
          // { cloudName, apiKey, apiSecret } — verified before save.
          cloudinary: req.body.cloudinary || null,
          // Bank details — fee vouchers par print hote hain.
          bankName: req.body.bankName || null,
          bankAccountTitle: req.body.bankAccountTitle || null,
          bankAccountNumber: req.body.bankAccountNumber || null,
        },
        req.user,
        req
      );

      return res.status(201).json(
        ApiResponse.created("Organization created successfully", {
          organization: OrganizationResponseDTO.toDTO(result.organization),
          defaultBranch: result.defaultBranch
            ? { id: result.defaultBranch.id, name: result.defaultBranch.name, code: result.defaultBranch.code }
            : null,
          adminCredentials: result.adminCredentials,
          emailConfigured: result.emailConfigured,
          storageSetting: result.storageSetting,
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/
   */
  list = async (req, res, next) => {
    try {
      const orgs = await organizationService.getAllOrganizations();
      return res
        .status(200)
        .json(ApiResponse.ok("Organizations fetched successfully", orgs.map(OrganizationResponseDTO.toDTO)));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/organizations/public/slugs — PUBLIC
   * All public org slugs — ISR generateStaticParams ke liye. Must be
   * registered BEFORE /public/:slug (route conflict se bachne ke liye).
   */
  publicSlugs = async (req, res, next) => {
    try {
      const slugs = await organizationService.getPublicSlugs();
      return res.status(200).json(ApiResponse.ok("Organization slugs fetched successfully", slugs));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/organizations/public/:slug — PUBLIC
   * Org landing page ka data (branding + branches) — koi auth nahi.
   */
  getPublicBySlug = async (req, res, next) => {
    try {
      const data = await organizationService.getPublicBySlug(req.params.slug);
      return res.status(200).json(ApiResponse.ok("Organization fetched successfully", data));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/overview
   * Aggregated platform stats for the Super Admin dashboard (single request).
   */
  overview = async (req, res, next) => {
    try {
      const overview = await organizationService.getOverview();
      return res.status(200).json(ApiResponse.ok("Platform overview fetched successfully", overview));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/:id
   */
  getById = async (req, res, next) => {
    try {
      const org = await organizationService.getOrganizationById(req.params.id);
      return res
        .status(200)
        .json(ApiResponse.ok("Organization fetched successfully", OrganizationResponseDTO.toDTO(org)));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PATCH /organizations/:id
   * Body: { name?, code? }
   */
  update = async (req, res, next) => {
    try {
      const { name, code, logoUrl, themeColor, adminUsername, phone, email, website, facebookUrl, instagramUrl, twitterUrl, youtubeUrl, bankName, bankAccountTitle, bankAccountNumber } = req.body;

      if (name === undefined && code === undefined && logoUrl === undefined && adminUsername === undefined
        && phone === undefined && email === undefined && website === undefined
        && facebookUrl === undefined && instagramUrl === undefined && twitterUrl === undefined && youtubeUrl === undefined
        && themeColor === undefined && bankName === undefined && bankAccountTitle === undefined && bankAccountNumber === undefined) {
        return next(
          ApiError.badRequestError("Provide at least one field to update")
        );
      }

      const updated = await organizationService.updateOrganization(
        req.params.id,
        { name, code, logoUrl, themeColor, adminUsername, phone, email, website, facebookUrl, instagramUrl, twitterUrl, youtubeUrl, bankName, bankAccountTitle, bankAccountNumber },
        req.user,
        req
      );
      return res
        .status(200)
        .json(ApiResponse.ok("Organization updated successfully", OrganizationResponseDTO.toDTO(updated)));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /organizations/:id
   * Queues a background job to cascade-delete the org and all related data.
   */
  remove = async (req, res, next) => {
    try {
      const jobId = await organizationService.deleteOrganizationInBackground(req.params.id, req.user, req);
      return res
        .status(202)
        .json(
          new ApiResponse("Organization deletion scheduled. All related data will be removed in background.", 202, {
            jobId,
            organizationId: req.params.id,
          })
        );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/export
   * Streams an Excel (.xlsx) file of all organizations.
   */
  exportExcel = async (req, res, next) => {
    try {
      const buffer = await organizationService.exportExcel();
      const filename = `organizations-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
   * POST /organizations/logo
   * Multipart form-data: file (image, max 1 MB). Uploads an organization
   * logo and returns its URL — the caller saves it on create/edit.
   * Optional form field `organizationId` lets the upload overwrite the org's
   * existing Cloudinary asset (same public_id).
   */
  uploadLogo = async (req, res, next) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequestError("Please upload an image file"));
      }
      const organizationId = req.body.organizationId || req.query.organizationId || null;
      const result = await organizationService.uploadLogo(req.file.buffer, organizationId);
      return res.status(200).json(ApiResponse.ok("Logo uploaded successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/import-template
   * Streams a blank Excel (.xlsx) template with the import columns.
   */
  downloadImportTemplate = async (req, res, next) => {
    try {
      const buffer = await organizationService.downloadImportTemplate();
      const filename = "organizations-import-template.xlsx";
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
   * POST /organizations/import-excel
   * Multipart form-data: file (xlsx/xls, max 10 MB)
   */
  importExcel = async (req, res, next) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)"));
      }

      const result = await organizationService.importExcel(req.file.buffer, req.user, req);
      return res
        .status(202)
        .json(
          new ApiResponse("Organization import job scheduled successfully", 202, {
            jobId: result.jobId,
            totalRows: result.totalRows,
          })
        );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /organizations/:id/dashboard
   * Branch-level dashboard for a single organization — staff vs students per
   * branch, monthly revenue, and the staff detail table (Super Admin drill-down).
   */
  dashboard = async (req, res, next) => {
    try {
      const result = await organizationService.getOrganizationDashboard(req.params.id, req.user);
      return res.status(200).json(ApiResponse.ok("Organization dashboard fetched successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  // Expose multer middleware for use in routes
  uploadMiddleware = fileUpload.single("file");
  logoUploadMiddleware = imageUpload.single("file");
}

export default new OrganizationController();
