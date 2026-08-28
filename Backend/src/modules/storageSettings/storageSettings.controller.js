import ApiResponse from "../../lib/utils/ApiResponse.js";
import storageSettingsService from "./storageSettings.service.js";

class StorageSettingsController {
  /** GET /storage/settings?organizationId=&schoolId= */
  getStatus = async (req, res, next) => {
    try {
      const result = await storageSettingsService.getStatus(
        req.user,
        req.query.organizationId || req.user?.organizationId,
        req.query.schoolId || req.user?.schoolId
      );
      return res.status(200).json(ApiResponse.ok("Storage settings fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** PUT /storage/settings { organizationId?, schoolId?, cloudName, apiKey, apiSecret? } */
  upsert = async (req, res, next) => {
    try {
      const result = await storageSettingsService.upsert(req.user, {
        organizationId: req.body.organizationId || req.user?.organizationId,
        schoolId: req.body.schoolId || req.user?.schoolId || null,
        cloudName: req.body.cloudName,
        apiKey: req.body.apiKey,
        apiSecret: req.body.apiSecret,
      });
      return res
        .status(200)
        .json(ApiResponse.ok("Storage settings saved and verified", result));
    } catch (error) {
      return next(error);
    }
  };

  /** DELETE /storage/settings?organizationId=&schoolId= */
  remove = async (req, res, next) => {
    try {
      await storageSettingsService.remove(
        req.user,
        req.query.organizationId || req.user?.organizationId,
        req.query.schoolId || null
      );
      return res.status(200).json(ApiResponse.ok("Storage settings removed", true));
    } catch (error) {
      return next(error);
    }
  };
}

export default new StorageSettingsController();
