import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { encryptSecret, decryptSecret } from "../../lib/utils/secretBox.js";
import { invalidateOrgStorageCache } from "../../lib/utils/orgStorage.cache.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("storage-settings-service");

class StorageSettingsService {
  /**
   * Media credentials are strictly per-branch (no organization-level pool), and
   * an ADMIN may only touch a branch it actually administers: home branch or any
   * extra branch granted through `branchAccess`.
   */
  async _assertAccess(requester, organizationId, schoolId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (!schoolId) {
      throw ApiError.badRequestError(
        "schoolId is required - storage credentials belong to a branch, not the organization."
      );
    }
    if (requester.role === "SUPER_ADMIN") {
      await this._assertBranchInOrg(organizationId, schoolId);
      return;
    }
    if (requester.role === "ADMIN" && requester.organizationId === organizationId) {
      const allowed = new Set(
        [requester.schoolId, ...(Array.isArray(requester.branchAccess) ? requester.branchAccess : [])].filter(Boolean)
      );
      if (!allowed.has(schoolId)) {
        throw ApiError.forbiddenError("You can only manage storage settings for a branch you administer");
      }
    } else {
      throw ApiError.forbiddenError("You cannot manage storage settings for this organization");
    }
    await this._assertBranchInOrg(organizationId, schoolId);
  }

  /** A secret row pairs org+branch, so the branch must really belong to that org. */
  async _assertBranchInOrg(organizationId, schoolId) {
    const branch = await prisma.school.findFirst({
      where: { id: schoolId, organizationId },
      select: { id: true },
    });
    if (!branch) throw ApiError.badRequestError("schoolId does not belong to this organization");
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
    await this._assertAccess(requester, organizationId, schoolId);
    const row = await prisma.orgSecrets.findFirst({
      where: { organizationId, schoolId, category: "CLOUDINARY" },
    });
    return { branch: this._mask(row), active: row ? "branch" : "platform" };
  }

  async upsert(requester, payload) {
    const { organizationId, schoolId, cloudName, apiKey, apiSecret } = payload;
    await this._assertAccess(requester, organizationId, schoolId);
    if (!cloudName || !apiKey) throw ApiError.badRequestError("'cloudName' and 'apiKey' are required");

    const existing = await prisma.orgSecrets.findFirst({ where: { organizationId, schoolId, category: "CLOUDINARY" } });
    const effectiveSecret = apiSecret && String(apiSecret).length > 0 ? String(apiSecret) : null;
    if (!effectiveSecret && !existing) throw ApiError.badRequestError("'apiSecret' is required for first-time setup");

    let plainSecret = effectiveSecret;
    if (!plainSecret) {
      plainSecret = decryptSecret(existing.data?.apiSecretEnc);
      if (!plainSecret) throw ApiError.badRequestError("Stored API secret could not be decrypted — enter a new one");
    }

    const skipVerification = process.env.SKIP_CREDENTIAL_VERIFICATION === 'true';
    const check = skipVerification
      ? { ok: true }
      : await this.verifyConnection({ cloudName, apiKey, apiSecret: plainSecret });
    if (!check.ok) {
      logger.logger.warn(`Cloudinary verify failed [branch:${schoolId}]: ${check.error}`);
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
      : await prisma.orgSecrets.create({ data: { organizationId, schoolId, category: "CLOUDINARY", data, isVerified: true, lastVerifiedAt: new Date() } });

    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage settings saved [branch:${schoolId}] -> ${data.cloudName}${skipVerification ? ' (verification skipped)' : ''}`);
    return this._mask(setting);
  }

  async remove(requester, organizationId, schoolId) {
    await this._assertAccess(requester, organizationId, schoolId);
    const existing = await prisma.orgSecrets.findFirst({ where: { organizationId, schoolId, category: "CLOUDINARY" } });
    if (!existing) throw ApiError.notFoundError("No storage settings found for this branch");
    await prisma.orgSecrets.delete({ where: { id: existing.id } });
    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage settings removed [branch:${schoolId}]`);
    return true;
  }

  async provision(organizationId, cloudinary, schoolId) {
    if (!cloudinary || !cloudinary.cloudName || !cloudinary.apiKey) return null;
    if (!schoolId) throw ApiError.badRequestError("schoolId is required to provision storage settings");
    const apiSecret = String(cloudinary.apiSecret || "");
    if (!apiSecret) throw ApiError.badRequestError("'apiSecret' is required when Cloudinary cloudName/apiKey is provided");

    const skipVerification = process.env.SKIP_CREDENTIAL_VERIFICATION === 'true';
    const check = skipVerification
      ? { ok: true }
      : await this.verifyConnection({ cloudName: cloudinary.cloudName, apiKey: cloudinary.apiKey, apiSecret });
    if (!check.ok) throw ApiError.badRequestError(`Cloudinary verification failed: ${check.error}`);

    const data = {
      provider: "CLOUDINARY",
      cloudName: String(cloudinary.cloudName).trim(),
      apiKey: String(cloudinary.apiKey).trim(),
      apiSecretEnc: encryptSecret(apiSecret),
    };
    const setting = await prisma.orgSecrets.create({
      data: { organizationId, schoolId, category: "CLOUDINARY", data, isVerified: skipVerification, lastVerifiedAt: skipVerification ? new Date() : null, lastError: skipVerification ? null : check.error },
    });
    invalidateOrgStorageCache(organizationId, schoolId);
    logger.logger.info(`Storage provisioned [branch:${schoolId}] -> ${data.cloudName}${skipVerification ? ' (verification skipped)' : ''}`);
    return this._mask(setting);
  }
}

export default new StorageSettingsService();
