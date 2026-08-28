import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import Logger from "../lib/utils/logger.js";
import { getTenantStorageCreds } from "../lib/utils/orgStorage.cache.js";
import { getRequestOrganizationId } from "../lib/requestContext.js";

const logger = new Logger("storage-service");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");
// Storage rule: hard-reject images above 1MB (can be raised via env if the
// 25GB Cloudinary plan is ever upgraded). ~60k students × 500KB+ unmanaged
// would blow past the plan — compressing to WebP keeps each file ~100-150KB.
const MAX_IMAGE_UPLOAD_SIZE_MB = Number.parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE_MB || "5", 10);
const MAX_IMAGE_UPLOAD_BYTES = Number.isFinite(MAX_IMAGE_UPLOAD_SIZE_MB)
  ? MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
  : 1 * 1024 * 1024;

// Only these formats are accepted (detected from file content, not client MIME).
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

// Cache the sharp import — dynamic import() on every upload is ~50-100ms wasted.
// Loaded once at module init, reused across all uploads.
let _sharp = null;
async function getSharp() {
  if (!_sharp) _sharp = (await import("sharp")).default;
  return _sharp;
}

// Images are re-encoded to WebP at max 500x500 — spec §4 (auto-compress on upload).
const IMAGE_MAX_DIMENSION = 500;
const WEBP_QUALITY = 75;

/**
 * Image Storage Service.
 *
 * Rules enforced at upload time (spec §4):
 * - Hard size limit (1MB default, `MAX_IMAGE_UPLOAD_SIZE_MB` to override).
 * - JPG / PNG / WebP only.
 * - Auto-compress + convert to WebP (max 500x500) so a 500KB-1MB upload
 *   lands in Cloudinary at ~100-150KB.
 * - Cloudinary transformation runs `quality: auto` + `fetch_format: auto`.
 *
 * Uploads go to Cloudinary when credentials exist in .env, otherwise they
 * fall back to the local `uploads/` directory (served statically by the app).
 * DB stores only the URL/path — old files are deleted on replacement via
 * `deleteImage` (rule 5: one image per entity).
 */
class StorageService {
  constructor() {
    this._cloudinary = null;
    // Platform (Super Admin env) creds — fallback jab tenant ke apne na hon.
    // .env me dono spellings ho sakti hain — CLOUDINARY_CLOUDNAME (code
    // convention) ya CLOUDINARY_CLOUD_NAME (.env ke comment ne use kiya tha).
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUDNAME || process.env.CLOUDINARY_CLOUD_NAME;
    this._useCloudinary = Boolean(
      CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
    try {
      // SDK hamesha load karo — tenant uploads bhi isi singleton se hoti
      // hain (per-call creds options global config ko override karti hain).
      import("cloudinary").then(({ v2 }) => {
        if (this._useCloudinary) {
          v2.config({
            cloud_name: CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });
          logger.logger.info("Storage: Cloudinary configured (platform)");
        }
        this._cloudinary = v2;
      }).catch((err) => {
        logger.logger.warn(`Storage: Cloudinary init failed (${err.message}) — falling back to local disk`);
      });
    } catch (err) {
      // SDK unavailable — disk fallback
    }
    mkdirSync(UPLOAD_ROOT, { recursive: true });
  }

  /**
   * Tenant-specific per-call credential options (cloud_name/api_key/api_secret).
   * Resolution: branch override > org default > platform env.
   * @param {string} [organizationId] tenant context (default: request context se)
   * @param {string} [schoolId] branch context for branch-level override
   */
  async _tenantCallOptions(organizationId, schoolId) {
    const orgId = organizationId || getRequestOrganizationId();
    if (!orgId) return null;
    const creds = await getTenantStorageCreds(orgId, schoolId);
    if (!creds) return null;
    return {
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
    };
  }

  /**
   * Upload an image (org logo / branch logo / avatar / student photo).
   *
   * Enforces the spec §4 rules at upload time:
   * 1. Hard size limit (reject above `MAX_IMAGE_UPLOAD_SIZE_MB`).
   * 2. JPG / PNG / WebP only (content sniffed via sharp, not client MIME).
   * 3. Auto-compress to WebP at max 500x500 before persisting.
   *
   * Overwrite strategy (spec §4 optional): pass `existingUrl` — the entity's
   * current image URL — to reuse its Cloudinary public_id. The replacement is
   * written over the same asset instead of creating a second file, and no
   * old file needs deleting. When the existing image isn't a Cloudinary URL
   * (local-disk fallback, different folder) a fresh file is uploaded and the
   * caller is expected to delete the old one (`overwritten` is false).
   *
   * @param {Buffer} buffer        original file buffer
   * @param {string} folder        logical folder e.g. "org-logos" | "school-logos" | "active-students"
   * @param {number} [width]       max width (default 500)
   * @param {number} [height]      max height (default 500)
   * @param {string} [existingUrl] current image URL of the entity (for overwrite)
   * @param {string} [organizationId] tenant context (default: request context se)
   * @returns {Promise<{ url: string, publicId?: string, overwritten: boolean }>}
   */
  async uploadImage({ buffer, folder = "active-students", width = IMAGE_MAX_DIMENSION, height = IMAGE_MAX_DIMENSION, existingUrl, organizationId, schoolId }) {
    if (!buffer || buffer.length === 0) {
      throw new Error("Empty image buffer");
    }

    if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error(`Image exceeds the ${MAX_IMAGE_UPLOAD_SIZE_MB}MB upload limit`);
    }

    // Detect format from file content (client MIME is untrusted) and enforce
    // the JPG / PNG / WebP allowlist BEFORE any processing.
    const sharp = await getSharp();
    let sourceFormat;
    try {
      const meta = await sharp(buffer).metadata();
      sourceFormat = meta.format;
    } catch (err) {
      throw new Error("Invalid or corrupt image file");
    }
    // iPhone photos HEIC/HEIF me aati hain — sharp HEIF support ho to pehle
    // JPEG me convert karo, phir normal flow (WebP compression). Ye "backend
    // issue" tha jo logon ko upload par aata tha.
    if (sourceFormat === "heif" || sourceFormat === "heic") {
      try {
        buffer = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
        sourceFormat = "jpeg";
      } catch (err) {
        throw new Error("HEIC photo convert nahi ho saki — JPG/PNG/WebP chuno");
      }
    }
    if (!sourceFormat || !ALLOWED_FORMATS.has(sourceFormat)) {
      throw new Error("Only JPG, PNG and WebP images are allowed");
    }

    // Auto-compress + convert to WebP (max 500x500). Keeps storage ~100-150KB
    // per image so the 25GB Cloudinary plan holds up at 50-60k students.
    let processed = buffer;
    let outputFormat = sourceFormat;
    try {
      processed = await sharp(buffer)
        .rotate()
        .resize(width, height, { fit: "cover", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      outputFormat = "webp";
    } catch (err) {
      logger.logger.warn(`[Storage] sharp resize skipped: ${err.message}`);
    }

    // Tenant ke apne creds hon to usi ke account par jaye.
    // Agar organizationId hai (school operation) lekin tenant creds nahi
    // → local disk, platform env kabhi school operations ke liye use nahi.
    // Platform Cloudinary sirf super admin (no org context) ke liye.
    const tenantOpts = await this._tenantCallOptions(organizationId, schoolId);
    if (this._cloudinary && tenantOpts) {
      return this._uploadToCloudinary(processed, folder, outputFormat, width, height, existingUrl, tenantOpts);
    }
    if (this._cloudinary && this._useCloudinary && !organizationId) {
      // Super admin operation — no org context → platform Cloudinary
      return this._uploadToCloudinary(processed, folder, outputFormat, width, height, existingUrl, null);
    }
    return this._uploadToDisk(processed, folder, outputFormat);
  }

  /**
   * Retry a Cloudinary network call on TRANSIENT failures only (DNS lookup
   * failures, socket resets, timeouts). Intermittent DNS flakiness on the
   * host (e.g. `getaddrinfo ENOTFOUND api.cloudinary.com`) used to fail
   * uploads outright; a short backoff lets the next attempt resolve and
   * succeed. Cloudinary API rejections (HTTP errors with `http_code`) are
   * NOT retried — those are real errors and retrying would mask them.
   */
  async _retryTransient(fn, attempts = 3) {
    const TRANSIENT_CODES = new Set([
      "ENOTFOUND",
      "EAI_AGAIN",
      "ECONNRESET",
      "ECONNREFUSED",
      "ECONNABORTED",
      "ETIMEDOUT",
      "EPIPE",
    ]);
    let lastErr;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = `${err?.message || ""} ${typeof err?.error === "string" ? err.error : (err?.error?.message || "")}`;
        const code = err?.code || err?.cause?.code;
        const isTransient =
          TRANSIENT_CODES.has(code) ||
          (!err?.http_code && /getaddrinfo|ENOTFOUND|EAI_AGAIN|socket|ECONN|ETIMEDOUT|network|timeout/i.test(msg));
        if (!isTransient || attempt === attempts) break;
        logger.logger.warn(`[Storage] Cloudinary transient error (attempt ${attempt}/${attempts}): ${msg || code}`);
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    throw lastErr;
  }

  async _uploadToCloudinary(buffer, folder, format = "jpeg", width = IMAGE_MAX_DIMENSION, height = IMAGE_MAX_DIMENSION, existingUrl, tenantOpts = null) {
    const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[format] || "image/jpeg";
    const options = {
      // Per-call creds — tenant account par upload (null = platform config).
      ...(tenantOpts || {}),
      resource_type: "image",
      // quality:auto + fetch_format:auto — spec §4: reduces stored size significantly
      transformation: [
        { width, height, crop: "fill", quality: "auto:good", fetch_format: "auto" },
      ],
    };

    // Overwrite strategy: if the entity already has a Cloudinary image in the
    // same folder, reuse its public_id so replacement overwrites the existing
    // file (no second file on the 25GB plan, stable URL). Only when the
    // folders differ (e.g. active-students -> archive) do we upload fresh.
    const existingPublicId = existingUrl ? this.extractPublicId(existingUrl) : null;
    const targetFolder = `school-erp/${folder}`;
    const existingFolder = existingPublicId ? existingPublicId.slice(0, existingPublicId.lastIndexOf("/")) : null;
    if (existingPublicId && existingFolder === targetFolder) {
      options.public_id = existingPublicId;
      options.overwrite = true;
      // Purge the CDN copy so the same URL immediately serves the new image.
      options.invalidate = true;
    } else {
      options.folder = targetFolder;
    }

    const result = await this._retryTransient(() =>
      this._cloudinary.uploader.upload(
        `data:${mime};base64,${buffer.toString("base64")}`,
        options
      )
    );
    return { url: result.secure_url, publicId: result.public_id, overwritten: Boolean(options.public_id) };
  }

  async _uploadToDisk(buffer, folder, format = "jpeg") {
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
    const dir = path.join(UPLOAD_ROOT, safeFolder);
    await fs.mkdir(dir, { recursive: true });

    const ext = format === "jpeg" ? "jpg" : format;
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    return { url: `/uploads/${safeFolder}/${filename}` };
  }

  /**
   * Derive the Cloudinary public_id from a stored URL (or null when the URL
   * isn't a Cloudinary URL). URL format:
   *   https://res.cloudinary.com/<cloud>/image/upload/<transform>/v<ver>/<public_id>.<ext>
   */
  extractPublicId(url) {
    if (!url || !url.includes("res.cloudinary.com/")) return null;
    try {
      const segs = new URL(url).pathname.split("/").filter(Boolean);
      const vIdx = segs.findIndex((s) => /^v\d+$/.test(s));
      if (vIdx !== -1 && vIdx < segs.length - 1) {
        return segs
          .slice(vIdx + 1)
          .join("/")
          .replace(/\.[a-z0-9]+$/i, "");
      }
    } catch (err) {
      // ignore — not a parseable URL
    }
    return null;
  }

  /**
   * True when two URLs point at the same Cloudinary asset (same public_id).
   * Used to avoid deleting an image that was just overwritten via the
   * overwrite strategy — destroying it would also destroy the replacement.
   */
  hasSamePublicId(urlA, urlB) {
    const idA = this.extractPublicId(urlA);
    const idB = this.extractPublicId(urlB);
    return Boolean(idA && idB && idA === idB);
  }

  /**
   * Resolve once the Cloudinary client is ready (or confirm local-disk mode).
   * The client is bootstrapped asynchronously in the constructor (dynamic
   * import + config), so scripts/workers that need the API immediately must
   * await this first. Returns true when Cloudinary is usable.
   */
  async waitForCloudinary(timeoutMs = 15_000) {
    if (!this._useCloudinary) return false;
    if (this._cloudinary) return true;
    const started = Date.now();
    while (!this._cloudinary) {
      if (Date.now() - started > timeoutMs) return false;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return true;
  }

  /**
   * List every image the app manages in Cloudinary (prefix `school-erp/`),
   * paginated via next_cursor (500 per page). Returns
   * `[{ publicId, url, bytes }]` — used by the orphan-cleanup script.
   */
  async listCloudinaryImages() {
    const ready = await this.waitForCloudinary();
    if (!ready || !this._cloudinary) {
      throw new Error("Cloudinary is not configured or initialized");
    }
    const all = [];
    let nextCursor = null;
    do {
      const options = {
        type: "upload",
        resource_type: "image",
        prefix: "school-erp/",
        max_results: 500,
      };
      if (nextCursor) options.next_cursor = nextCursor;
      const res = await this._retryTransient(() => this._cloudinary.api.resources(options));
      all.push(...(res.resources || []));
      nextCursor = res.next_cursor || null;
    } while (nextCursor);
    return all.map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      bytes: r.bytes || 0,
    }));
  }

  /**
   * Upload a document (B-form / birth certificate / scanned file).
   *
   * Unlike images, documents are stored AS-IS — no WebP re-encoding (a PDF
   * must stay a PDF). Allowed: PDF, JPG, PNG, WebP. Size cap is the file
   * upload cap (`MAX_FILE_UPLOAD_SIZE_MB`, default 5) — NOT the strict 1MB
   * image limit.
   *
   * @param {Buffer} buffer
   * @param {string} folder   e.g. "applicant-docs"
   * @param {string} filename original file name (kept for downloads)
   * @param {string} [organizationId] tenant context (default: request context se)
   * @returns {Promise<{ url: string }>}
   */
  async uploadDocument({ buffer, folder = "applicant-docs", filename = "document", organizationId, schoolId }) {
    if (!buffer || buffer.length === 0) throw new Error("Empty document buffer");

    const maxMb = Number.parseInt(process.env.MAX_FILE_UPLOAD_SIZE_MB || "5", 10);
    const maxBytes = Number.isFinite(maxMb) ? maxMb * 1024 * 1024 : 5 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      throw new Error(`File exceeds the ${maxMb}MB upload limit`);
    }

    // Content sniff: PDF magic bytes, else require a valid image
    const isPdf = buffer.length > 4 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    if (!isPdf) {
      const sharp = await getSharp();
      let format;
      try {
        format = (await sharp(buffer).metadata()).format;
      } catch (err) {
        throw new Error("Invalid or corrupt file — only PDF, JPG, PNG and WebP are allowed");
      }
      if (!ALLOWED_FORMATS.has(format)) {
        throw new Error("Only PDF, JPG, PNG and WebP documents are allowed");
      }
    }

    const tenantOpts = await this._tenantCallOptions(organizationId, schoolId);
    if (this._cloudinary && tenantOpts) {
      return this._uploadDocumentToCloudinary(buffer, folder, filename, tenantOpts);
    }
    if (this._cloudinary && this._useCloudinary && !organizationId) {
      return this._uploadDocumentToCloudinary(buffer, folder, filename, null);
    }
    return this._uploadDocumentToDisk(buffer, folder, filename);
  }

  async _uploadDocumentToCloudinary(buffer, folder, filename, tenantOpts = null) {
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
    const result = await this._retryTransient(() =>
      this._cloudinary.uploader.upload(`data:application/octet-stream;base64,${buffer.toString("base64")}`, {
        ...(tenantOpts || {}),
        folder: `school-erp/${safeFolder}`,
        resource_type: "auto", // PDFs + images dono
        use_filename: true,
        unique_filename: true,
      })
    );
    return { url: result.secure_url, publicId: result.public_id };
  }

  async _uploadDocumentToDisk(buffer, folder, filename) {
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
    const dir = path.join(UPLOAD_ROOT, safeFolder);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(filename || "").toLowerCase() || ".pdf";
    const safeBase = path.basename(filename || "document", path.extname(filename || "")).replace(/[^a-z0-9-_ ]/gi, "").slice(0, 40);
    const stored = `${safeBase}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    await fs.writeFile(path.join(dir, stored), buffer);
    return { url: `/uploads/${safeFolder}/${stored}` };
  }

  /**
   * Delete an image. For Cloudinary, pass publicId; for local, pass /uploads/... path.
   * Tenant creds mojood hon to tenant account se delete hota hai (wahi
   * account jahan upload hua tha), warna platform.
   */
  async deleteImage({ publicId, url, organizationId, schoolId }) {
    const tenantOpts = await this._tenantCallOptions(organizationId, schoolId);
    if (publicId && this._cloudinary) {
      try {
        await this._retryTransient(() => this._cloudinary.uploader.destroy(publicId, tenantOpts || undefined));
        return true;
      } catch (err) {
        logger.logger.warn(`[Storage] Cloudinary delete failed: ${err.message || err.error}`);
        return false;
      }
    }
    // Best-effort: derive publicId from a Cloudinary URL when only url is given
    if (url && this._cloudinary) {
      const derived = this.extractPublicId(url);
      if (derived) {
        try {
          await this._retryTransient(() => this._cloudinary.uploader.destroy(derived, tenantOpts || undefined));
          return true;
        } catch (err) {
          logger.logger.warn(`[Storage] Cloudinary delete from URL failed: ${err.message || err.error}`);
          return false;
        }
      }
    }
    if (url && url.startsWith("/uploads/")) {
      try {
        const filePath = path.join(UPLOAD_ROOT, url.replace("/uploads/", ""));
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
          return true;
        }
      } catch (err) {
        logger.logger.warn(`[Storage] Local delete failed: ${err.message}`);
      }
    }
    return false;
  }

  /**
   * Move an image between logical folders (active-students -> archive) per PRD.
   * Returns the new URL (or keeps the old URL if the move is not supported).
   */
  async moveToArchive({ publicId, url, organizationId, schoolId }) {
    const tenantOpts = await this._tenantCallOptions(organizationId, schoolId);
    if (publicId && this._cloudinary) {
      const folder = path.dirname(publicId) + "/archive";
      try {
        const result = await this._cloudinary.uploader.rename(publicId, `${folder}/${path.basename(publicId)}`, tenantOpts || undefined);
        return { url: result.secure_url, publicId: result.public_id };
      } catch (err) {
        logger.logger.warn(`[Storage] Cloudinary archive move failed: ${err.message}`);
        return { url, publicId };
      }
    }
    if (url && url.startsWith("/uploads/active-students/")) {
      const filename = path.basename(url);
      const from = path.join(UPLOAD_ROOT, "active-students", filename);
      const toDir = path.join(UPLOAD_ROOT, "archive");
      await fs.mkdir(toDir, { recursive: true });
      const to = path.join(toDir, filename);
      try {
        await fs.rename(from, to);
        return { url: `/uploads/archive/${filename}` };
      } catch (err) {
        logger.logger.warn(`[Storage] Local archive move failed: ${err.message}`);
      }
    }
    return { url, publicId };
  }

  getUploadRoot() {
    return UPLOAD_ROOT;
  }
}

export default new StorageService();
