import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { encryptSecret, decryptSecret } from "../../lib/utils/secretBox.js";
import { invalidateOrgStorageCache } from "../../lib/utils/orgStorage.cache.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("storage-settings-service");

class StorageSettingsService {
  _assertAccess(requester, organizationId, schoolId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (requester.role === "SUPER_ADMIN") return;
    if (requester.role === "ADMIN" && requester.organizationId === organizationId) {
      if (schoolId && requester.schoolId && requester.schoolId !== schoolId) {
        throw ApiError.forbiddenError("You can only manage your own branch's storage settings");
      }
      return;
    }
    throw ApiError.forbiddenError("You cannot manage storage settings for this organization");
  }

  _mask(setting) {
    if (!setting) return null;
    const d = setting.data || {};
    return {
      id: setting.id,
      organizationId: setting.organizationId,
      schoolId: setting.schoolId,
      provider: d.provider,
      cloudName: d.cloudName,
      apiKey: d.apiKey,
      isVerified: setting.isVerified,
      lastVerifiedAt: setting.lastVerifiedAt,
      lastError: setting.lastError,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  async verifyConnection({ cloudName, apiKey, apiSecret }) {
    try {
      const { v2 } = await import("cloudinary");
      const res = await v2.api.ping({
        cloud_name: String(cloudName).trim(),
        api_key: String(apiKey).trim(),
        api_secret: String(apiSecret).trim(),
      });
      return { ok: res?.status === "ok", error: res?.status ? null : "Unexpected ping response" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async getStatus(requester, organizationId, schoolId) {
    this._assertAccess(requester, organizationId, schoolId);
    const rows = await prisma.orgSecrets.findMany({ where: { organizationId, category: "CLOUDINARY" } });
    const branch = rows.find((r) => r.schoolId === schoolId) || null;
    const orgDefault = rows.find((r) => !r.schoolId) || null;
    return {
      branch: this._mask(branch),
      organization: this._mask(orgDefault),
      active: branch ? "branch" : "organization",
    };
  }

  async upsert(requester, payload) {
    const { organizationId, schoolId = null, cloudName, apiKey, apiSecret } = payload;
    this._assertAccess(requester, organizationId, schoolId);
    if (!cloudName || !apiKey) throw ApiError.badRequestError("'cloudName' and 'apiKey' are required");

    const existing = await prisma.orgSecrets.findFirst({ where: { organizationId, schoolId: schoolId || null, category: "CLOUDINARY" } });
    const effectiveSecret = apiSecret && String(apiSecret).length > 0 ? String(apiSecret) : null;
    if (!effectiveSecret && !existing) throw ApiError.badRequestError("'apiSecret' is required for first-time setup");

    let plainSecret = effectiveSecret;
    if (!plainSecret) {
      plainSecret = decryptSecret(existing.data?.apiSecretEnc);
      if (!plainSecret) throw ApiError.badRequestError("Stored API secret could not be decrypted — enter a new one");
    }

    const check = await this.verifyConnection({ cloudName, apiKey, apiSecret: plainSecret });
    if (!check.ok) {
      logger.logger.warn(`Cloudinary verify failed [${schoolId ? "branch" : "org"}:${organizationId}]: ${check.error}`);
      throw ApiError.badRequestError(`Cloudinary verification failed: ${check.error}`);
    }

    const data = {
      provider: "CLOUDINARY",
      cloudName: String(cloudName).trim(),
      apiKey: String(apiKey).trim(),
      apiSecretEnc: encryptSecret(plainSecret),
    };

    const setting = existing
      ? await prisma.orgSecrets.update({ where: { id: existing.id }, data: { data, isVerified: true, lastVerifiedAt: new Date(), lastError: null } })
      : await prisma.orgSecrets.create({ data: { organizationId, schoolId: schoolId || null, category: "CLOUDINARY", data, isVerified: true, lastVerifiedAt: new Date() } });

    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage settings saved [${schoolId ? "branch" : "org"}:${organizationId}] -> ${data.cloudName}`);
    return this._mask(setting);
  }

  async remove(requester, organizationId, schoolId) {
    this._assertAccess(requester, organizationId, schoolId);
    const existing = await prisma.orgSecrets.findFirst({ where: { organizationId, schoolId: schoolId || null, category: "CLOUDINARY" } });
    if (!existing) throw ApiError.notFoundError("No storage settings found for this scope");
    await prisma.orgSecrets.delete({ where: { id: existing.id } });
    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage settings removed [${schoolId ? "branch" : "org"}:${organizationId}]`);
    return true;
  }

  async provision(organizationId, cloudinary, schoolId) {
    if (!cloudinary || !cloudinary.cloudName || !cloudinary.apiKey) return null;
    const apiSecret = String(cloudinary.apiSecret || "");
    if (!apiSecret) throw ApiError.badRequestError("'apiSecret' is required when Cloudinary cloudName/apiKey is provided");
    const check = await this.verifyConnection({ cloudName: cloudinary.cloudName, apiKey: cloudinary.apiKey, apiSecret });
    if (!check.ok) throw ApiError.badRequestError(`Cloudinary verification failed: ${check.error}`);

    const data = {
      provider: "CLOUDINARY",
      cloudName: String(cloudinary.cloudName).trim(),
      apiKey: String(cloudinary.apiKey).trim(),
      apiSecretEnc: encryptSecret(apiSecret),
    };
    const setting = await prisma.orgSecrets.create({
      data: { organizationId, schoolId: schoolId || null, category: "CLOUDINARY", data, isVerified: true, lastVerifiedAt: new Date() },
    });
    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage provisioned [${schoolId ? "branch" : "org"}:${organizationId}] -> ${data.cloudName}`);
    return this._mask(setting);
  }
}

export default new StorageSettingsService();
