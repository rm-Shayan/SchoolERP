import prisma from "../../config/db.js";
import { decryptSecret } from "./secretBox.js";
import Logger from "./logger.js";

const logger = new Logger("org-storage-cache");

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key: "orgId" or "orgId:schoolId" -> { ts, updatedAtIso, creds }

const _toCreds = (row) => {
  if (!row) return null;
  const d = row.data || {};
  const apiSecret = decryptSecret(d.apiSecretEnc);
  if (!apiSecret) {
    logger.logger.warn(`[Cache] OrgSecrets CLOUDINARY ${row.organizationId} decrypt fail — platform fallback`);
    return null;
  }
  return { cloudName: d.cloudName, apiKey: d.apiKey, apiSecret };
};

function _cacheKey(organizationId, schoolId) {
  return schoolId ? `${organizationId}:${schoolId}` : organizationId;
}

export async function warmupOrgStorageCache() {
  try {
    const rows = await prisma.orgSecrets.findMany({ where: { category: "CLOUDINARY" } });
    for (const row of rows) {
      const key = _cacheKey(row.organizationId, row.schoolId);
      cache.set(key, {
        ts: Date.now(),
        updatedAtIso: row.updatedAt?.toISOString() || "",
        creds: _toCreds(row),
      });
    }
    logger.logger.info(`[Cache] Warmed ${rows.length} tenant storage setting(s)`);
  } catch (err) {
    logger.logger.warn(`[Cache] Warmup skipped: ${err.message}`);
  }
}

/**
 * Resolve Cloudinary creds for a tenant. Branch-level override wins,
 * then org-level default, then null (platform fallback).
 */
export async function getTenantStorageCreds(organizationId, schoolId) {
  if (!organizationId) return null;

  const key = _cacheKey(organizationId, schoolId);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.creds;

  let creds = null;
  let updatedAtIso = "";
  try {
    // 1. Try branch-specific override first
    if (schoolId) {
      const branchRow = await prisma.orgSecrets.findFirst({
        where: { organizationId, schoolId, category: "CLOUDINARY" },
      });
      if (branchRow) {
        creds = _toCreds(branchRow);
        updatedAtIso = branchRow?.updatedAt?.toISOString() || "";
        cache.set(key, { ts: Date.now(), updatedAtIso, creds });
        return creds;
      }
    }
    // 2. Fall back to org-level default
    const orgRow = await prisma.orgSecrets.findFirst({
      where: { organizationId, schoolId: null, category: "CLOUDINARY" },
    });
    creds = _toCreds(orgRow);
    updatedAtIso = orgRow?.updatedAt?.toISOString() || "";
  } catch (err) {
    logger.logger.error(`[Cache] Lookup failed (${err.message}) — platform fallback`);
  }
  cache.set(key, { ts: Date.now(), updatedAtIso, creds });
  return creds;
}

export function invalidateOrgStorageCache(organizationId, schoolId, updatedAtIso = "") {
  if (!organizationId) { cache.clear(); return; }
  const key = _cacheKey(organizationId, schoolId);
  const hit = cache.get(key);
  if (!hit || !updatedAtIso || hit.updatedAtIso !== updatedAtIso) {
    cache.delete(key);
  }
}

export function clearOrgStorageCache() {
  cache.clear();
}
