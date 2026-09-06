import ApiError from "../../lib/utils/ApiError.js";
import organizationRepository from "./organization.repository.js";
import { organizationImportQueue, organizationDeleteQueue } from "../../jobs/queues/index.js";
import xlsx from "xlsx";
import redis from "../../config/redis.js";
import { sendEmail } from "../../services/email.service.js";
import { adminCredentialsEmail } from "../../services/email.templates.js";
import { queueEmail } from "../../services/emailOutbox.js";
import authRepository from "../auth/repository.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emitToRoom } from "../../config/websocket.js";
import smtpSettingsService from "../smtpSettings/smtpSettings.service.js";
import storageSettingsService from "../storageSettings/storageSettings.service.js";
import storageService from "../../services/storage.service.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { encryptSecret } from "../../lib/utils/secretBox.js";
import prisma from "../../config/db.js";

const ORG_CACHE_TTL = 3600; // 1 hour
const OVERVIEW_CACHE_TTL = 120; // 120 seconds — dashboard freshness vs latency

class OrganizationService {
  /**
   * Create a new organization and auto-generate initial Super Admin account.
   * Sends credentials via Email (mocked or SMTP).
   *
   * All DB writes run inside a single Prisma interactive transaction so a
   * mid-flow failure (e.g. admin user creation) can never leave a half-created
   * org in the database.  External I/O (logo upload, SMTP/Cloudinary
   * verification) runs BEFORE the transaction to avoid holding the DB
   * connection open during slow network calls.
   */
  async createOrganization(data, requester = null, req = null) {
    // ── Phase 1: Validation + external I/O (outside transaction) ──────

    const existingCode = await organizationRepository.findByCode(data.code);
    if (existingCode) {
      throw ApiError.badRequestError("Organization with this code already exists");
    }

    const slug = data.slug
      ? data.slug.toString().toLowerCase().trim().replace(/[^a-z0-9-]/g, "")
      : (data.code ? data.code.toString().toLowerCase().trim().replace(/[^a-z0-9-]/g, "") : data.name.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));

    if (!slug) {
      throw ApiError.badRequestError("Valid organization slug or code is required");
    }

    const existingSlug = await organizationRepository.findBySlug(slug);
    if (existingSlug) {
      throw ApiError.badRequestError("Organization with this slug already exists");
    }

    // Logo upload to storage (external I/O — must happen before transaction)
    const logoUrl = (await this._persistDataUrlLogo(data.logoUrl)) || null;

    // Pre-hash admin password (CPU-bound, do outside tx for clarity)
    let generatedPassword = null;
    let adminPasswordHash = null;
    if (!data.existingAdminEmail && data.adminEmail) {
      generatedPassword = data.adminPassword || crypto.randomBytes(4).toString("hex") + "A1!";
      adminPasswordHash = await bcrypt.hash(generatedPassword, 12);
    }

    // SMTP verification (network I/O — must NOT be inside transaction)
    const skipVerification = process.env.SKIP_CREDENTIAL_VERIFICATION === "true";
    let smtpPayload = null;
    let smtpSecondaryPayload = null;
    if (data.smtp?.host && data.smtp?.username) {
      const smtp = data.smtp;
      const plainPwd = String(smtp.password || "");
      if (!plainPwd) throw ApiError.badRequestError("SMTP password is required when SMTP host/username is provided");
      const smtpCheck = skipVerification
        ? { ok: true }
        : await smtpSettingsService.verifyConnection({
            host: smtp.host, port: Number(smtp.port || 587), secure: Boolean(smtp.secure),
            username: String(smtp.username).trim().toLowerCase(), password: plainPwd,
          });
      const _clamp = (v) => Math.min(5000, Math.max(100, parseInt(v, 10) || 500));
      smtpPayload = {
        host: smtp.host, port: Number(smtp.port || 587), secure: Boolean(smtp.secure),
        username: String(smtp.username).trim().toLowerCase(),
        passwordEnc: encryptSecret(plainPwd),
        fromName: smtp.fromName ? String(smtp.fromName).trim() : null,
        dailyLimit: _clamp(smtp.dailyLimit),
        isVerified: smtpCheck.ok,
        lastVerifiedAt: smtpCheck.ok ? new Date() : null,
        lastError: smtpCheck.ok ? null : smtpCheck.error,
      };
    }
    if (data.smtpSecondary?.host && data.smtpSecondary?.username) {
      const smtp = data.smtpSecondary;
      const plainPwd = String(smtp.password || "");
      if (!plainPwd) throw ApiError.badRequestError("SMTP secondary password is required when host/username is provided");
      const smtpCheck = skipVerification
        ? { ok: true }
        : await smtpSettingsService.verifyConnection({
            host: smtp.host, port: Number(smtp.port || 587), secure: Boolean(smtp.secure),
            username: String(smtp.username).trim().toLowerCase(), password: plainPwd,
          });
      const _clamp = (v) => Math.min(5000, Math.max(100, parseInt(v, 10) || 500));
      smtpSecondaryPayload = {
        host: smtp.host, port: Number(smtp.port || 587), secure: Boolean(smtp.secure),
        username: String(smtp.username).trim().toLowerCase(),
        passwordEnc: encryptSecret(plainPwd),
        fromName: smtp.fromName ? String(smtp.fromName).trim() : null,
        dailyLimit: _clamp(smtp.dailyLimit),
        isVerified: smtpCheck.ok,
        lastVerifiedAt: smtpCheck.ok ? new Date() : null,
        lastError: smtpCheck.ok ? null : smtpCheck.error,
      };
    }

    // Cloudinary verification (network I/O — must NOT be inside transaction)
    let storagePayload = null;
    if (data.cloudinary?.cloudName && data.cloudinary?.apiKey) {
      const c = data.cloudinary;
      const apiSecret = String(c.apiSecret || "");
      if (!apiSecret) throw ApiError.badRequestError("'apiSecret' is required when Cloudinary cloudName/apiKey is provided");
      const cCheck = skipVerification
        ? { ok: true }
        : await storageSettingsService.verifyConnection({
            cloudName: String(c.cloudName).trim(), apiKey: String(c.apiKey).trim(), apiSecret,
          });
      if (!cCheck.ok) throw ApiError.badRequestError(`Cloudinary verification failed: ${cCheck.error}`);
      storagePayload = {
        provider: "CLOUDINARY",
        cloudName: String(c.cloudName).trim(),
        apiKey: String(c.apiKey).trim(),
        apiSecretEnc: encryptSecret(apiSecret),
        isVerified: skipVerification,
        lastVerifiedAt: skipVerification ? new Date() : null,
        lastError: skipVerification ? null : cCheck.error,
      };
    }

    // ── Phase 2: All DB writes atomically ─────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create organization
      const org = await tx.organization.create({
        data: {
          name: data.name, slug, code: data.code, logoUrl,
          themeColor: data.themeColor || null,
          bankName: data.bankName || null,
          bankAccountTitle: data.bankAccountTitle || null,
          bankAccountNumber: data.bankAccountNumber || null,
        },
      });

      // 2. Create default branch (inline from provision.js — uses tx)
      let branchCode = `${org.code}-01`;
      let suffix = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const exists = await tx.school.findUnique({ where: { code: branchCode } });
        if (!exists) break;
        suffix += 1;
        branchCode = `${org.code}-${String(suffix).padStart(2, "0")}`;
      }
      const defaultBranch = await tx.school.create({
        data: { organizationId: org.id, name: `${org.name} Main Campus`, code: branchCode },
      });

      // 3. SMTP settings (primary)
      let smtpSetting = null;
      if (smtpPayload) {
        smtpSetting = await tx.orgSecrets.create({
          data: { organizationId: org.id, schoolId: null, category: "SMTP", tier: "PRIMARY", data: smtpPayload },
        });
      }
      // 4. SMTP settings (secondary)
      let smtpSecondary = null;
      if (smtpSecondaryPayload) {
        smtpSecondary = await tx.orgSecrets.create({
          data: { organizationId: org.id, schoolId: null, category: "SMTP", tier: "SECONDARY", data: smtpSecondaryPayload },
        });
      }
      // 5. Cloudinary / storage settings
      let storageSetting = null;
      if (storagePayload) {
        storageSetting = await tx.orgSecrets.create({
          data: { organizationId: org.id, schoolId: null, category: "CLOUDINARY", data: storagePayload },
        });
      }

      // 6. Admin user — two modes
      let adminCredentials = null;
      if (data.existingAdminEmail) {
        const cleanEmail = String(data.existingAdminEmail).trim().toLowerCase();
        const existingAdmin = await tx.user.findFirst({
          where: { email: cleanEmail, role: "ADMIN", isActive: true },
          select: { id: true, name: true, email: true },
        });
        if (existingAdmin) {
          const branchAdmin = await tx.user.findFirst({
            where: { role: "ADMIN", schoolId: defaultBranch.id, isActive: true, id: { not: existingAdmin.id } },
            select: { id: true },
          });
          if (!branchAdmin) {
            await tx.user.update({
              where: { id: existingAdmin.id },
              data: { schoolId: defaultBranch.id, organizationId: org.id },
            });
          }
        }
      } else if (data.adminEmail) {
        const branchAdminUser = await tx.user.create({
          data: {
            name: data.adminName || `${data.name} Principal`,
            email: data.adminEmail,
            username: data.adminUsername || null,
            password: adminPasswordHash,
            phone: data.adminPhone || null,
            role: "ADMIN",
            organizationId: org.id,
            schoolId: defaultBranch.id,
          },
        });
        adminCredentials = { email: branchAdminUser.email, password: generatedPassword };
      }

      // 7. Find unassigned admins for this org (for UI)
      let unassignedAdmins = [];
      try {
        unassignedAdmins = await tx.user.findMany({
          where: { role: "ADMIN", organizationId: org.id, isActive: true, schoolId: null },
          select: { id: true, name: true, email: true },
        });
      } catch (_) {}

      return { org, defaultBranch, adminCredentials, smtpSetting, smtpSecondary, storageSetting, unassignedAdmins };
    });

    // ── Phase 3: Side effects (post-transaction, best-effort) ─────────
    const { org, defaultBranch, adminCredentials, smtpSetting, smtpSecondary, storageSetting, unassignedAdmins } = result;

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.CREATE_ORG,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: org.id,
        entityName: org.name,
        organizationId: org.id,
        details: JSON.stringify({ code: org.code, adminEmail: data.adminEmail || null, themeColor: org.themeColor || null }),
      })
    );

    try {
      await redis.del(["orgs:all", "superadmin:overview", "schools:all", `schools:org:${org.id}`]);
    } catch (_) {}

    portalNotificationService.create({
      organizationId: org.id,
      senderId: requester?.id, senderName: requester?.name || "Super Admin",
      title: "ORG_CREATED",
      body: `Organization "${org.name}" (${org.code}) has been created successfully.`,
      category: "GENERAL",
    });

    // Queue admin credentials email (outside tx — email sending is async)
    if (adminCredentials) {
      const mail = adminCredentialsEmail({
        orgName: data.name, orgSlug: org.slug, schoolName: defaultBranch.name,
        name: data.adminName || `${data.name} Principal`,
        email: adminCredentials.email,
        username: data.adminUsername || null,
        password: adminCredentials.password,
        schoolCode: defaultBranch.code,
        logoUrl: org.logoUrl || null, themeColor: org.themeColor || null,
      });
      await queueEmail({
        to: adminCredentials.email, ...mail,
        priority: "CRITICAL",
        organizationId: org.id, schoolId: defaultBranch.id,
        allowHolderAsRecipient: true,
      }).catch(() => {});
    }

    emitToRoom("super_admins", "organization_created", { orgId: org.id, name: org.name });
    emitToRoom("super_admins", "overview_updated", {});

    return {
      organization: org,
      defaultBranch,
      adminCredentials,
      smtpSetting,
      smtpSecondary,
      storageSetting,
      unassignedAdmins,
      emailConfigured: Boolean(
        process.env.SMTP_USER &&
          process.env.SMTP_PASS &&
          process.env.SMTP_HOST &&
          process.env.SMTP_HOST.includes(".")
      ),
    };
  }

  /**
   * Logo persistence rule: DB me hamesha managed URL store karo (cloudinary ya
   * local upload) — emails/PDFs me raw external URLs depend karwa sakte hain.
   * Handle 3 inputs:
   *  - `data:` base64  → decode → upload.
   *  - external http(s) URL (frontend se sirf URL pasted) → bytes fetch karke
   *    upload karo, phir storage URL store (user spec: "URL hi diya ho to
   *    tu woh upload kar de").
   *  - already-managed URL (cloudinary / /uploads) → wahi wapas, re-upload nahi.
   * Failure par best-effort: purani value hi store (redirected render).
   */
  async _persistDataUrlLogo(logoUrl, organizationId) {
    if (!logoUrl || typeof logoUrl !== "string") return logoUrl;
    if (logoUrl.startsWith("data:")) {
      try {
        const comma = logoUrl.indexOf(",");
        if (comma === -1) return logoUrl;
        const buffer = Buffer.from(logoUrl.slice(comma + 1), "base64");
        const { url } = await storageService.uploadImage({ buffer, folder: "org-logos", organizationId });
        return url || logoUrl;
      } catch (err) {
        return logoUrl; // best-effort — upload fail ho to purani value store
      }
    }
    // Pehle se managed ho (cloudinary ya local disk upload) → wahi rakh lo.
    if (logoUrl.startsWith("/uploads/") || logoUrl.includes("res.cloudinary.com/")) {
      return logoUrl;
    }
    // External binding URL → download + upload (SSRF wary: sirf SUPER_ADMIN
    // route se aata hai; size/time capped downloads).
    if (/^https?:\/\//i.test(logoUrl)) {
      try {
        const buffer = await this._downloadImage(logoUrl);
        const { url } = await storageService.uploadImage({ buffer, folder: "org-logos", organizationId });
        return url || logoUrl;
      } catch (err) {
        return logoUrl; // best-effort — upload fail ho to purani value store
      }
    }
    return logoUrl;
  }

  /**
   * Download an external image with a hard 5MB cap + 10s timeout. `uploadImage`
   * apna format/size enforcement phir bhi laga-ta hai (mischief-proof).
   */
  async _downloadImage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
      if (!res.ok) throw new Error(`Remote image fetch failed: HTTP ${res.status}`);
      const contentLen = Number(res.headers.get("content-length") || 0);
      if (contentLen > 5 * 1024 * 1024) throw new Error("Remote image exceeds 5MB limit");
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) throw new Error("Remote image is empty");
      return buffer;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Upload an organization logo image (stored by storage service; local
   * disk or Cloudinary). Returns the URL to save on the organization.
   *
   * When `organizationId` is provided, the upload overwrites the org's
   * existing logo (same Cloudinary public_id) instead of creating a new file.
   */
  async uploadLogo(buffer, organizationId) {
    if (!buffer || buffer.length === 0) {
      throw ApiError.badRequestError("Please upload an image file");
    }
    let existingUrl = null;
    if (organizationId) {
      const org = await this.getOrganizationById(organizationId);
      existingUrl = org.logoUrl || null;
    }
    const { url } = await storageService.uploadImage({ buffer, folder: "org-logos", existingUrl, organizationId });
    return { url };
  }

  /**
   * Fetch all organizations with Redis Caching for ultra-low latency.
   */
  async getAllOrganizations() {
    const cacheKey = "orgs:all";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Ignore cache fetch error, fallback to DB
    }

    const orgs = await organizationRepository.findAll();

    // Fold branch statuses + admin existence into the effective org status
    // so the list DTO carries the real badge (spec §5).
    const shaped = orgs.map((org) => ({
      ...org,
      status: this._effectiveOrgStatus(org),
      blockedBranchCount: org.blockedBranchCount || 0,
    }));

    try {
      await redis.setEx(cacheKey, ORG_CACHE_TTL, JSON.stringify(shaped));
    } catch (err) {
      // Non-blocking
    }

    return shaped;
  }

  /**
   * Fetch single organization by ID with Redis cache.
   */
  async getOrganizationById(id) {
    const cacheKey = `org:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Fallback
    }

    const org = await organizationRepository.findById(id);
    if (!org) {
      throw ApiError.notFoundError("Organization not found");
    }

    // Attach the effective status (SETUP_PENDING → ACTIVE once an admin exists,
    // PARTIALLY_BLOCKED when a branch is blocked) so the UI always sees the
    // real badge without extra round trips.
    org.status = this._effectiveOrgStatus(org);
    delete org.branches; // branch statuses already folded into org.status

    // Rich KPI data for the org detail page (spec §3): branch/user/student
    // counts + collected revenue, all in one response.
    const [branchCount, userCount, activeStudentCount, revenue] = await Promise.all([
      organizationRepository.countBranches(id),
      prisma.user.count({ where: { organizationId: id } }),
      prisma.student.count({ where: { school: { organizationId: id }, status: "ACTIVE" } }),
      organizationRepository.revenueForOrganization(id),
    ]);
    org._count = { branches: branchCount, users: userCount, students: activeStudentCount };
    org.revenue = revenue;

    try {
      await redis.setEx(cacheKey, ORG_CACHE_TTL, JSON.stringify(org));
    } catch (err) {
      // Non-blocking
    }

    return org;
  }

  /**
   * Update an existing organization and clear cache.
   * Accepts adminUsername to update the organization's Super Admin login
   * username (falls back to a null-safe org update when not provided).
   */
  async updateOrganization(id, data, requester = null, req = null) {
    const existing = await this.getOrganizationById(id);

    if (data.code) {
      const codeConflict = await organizationRepository.findByCode(data.code);
      if (codeConflict && codeConflict.id !== id) {
        throw ApiError.badRequestError("Another organization with this code already exists");
      }
    }

    // adminUsername lives on the SUPER_ADMIN user, not the organization row.
    // Update it separately (with a uniqueness guard) and keep it out of the
    // organization update payload.
    let updatedAdminUsername;
    if (data.adminUsername !== undefined) {
      const username = data.adminUsername.toString().trim();
      if (username) {
        const existingUser = await authRepository.findByUsername(username);
        if (existingUser && existingUser.organizationId !== id) {
          throw ApiError.badRequestError("This username is already taken");
        }
        const { items: orgUsers } = await authRepository.findUsersByOrganization(id, { pageSize: 10000 });
        // Org ka admin ab hamesha ADMIN (branch principal) hai — SUPER_ADMIN
        // sirf platform owner hai (organizationId null).
        const adminUser = orgUsers.find((u) => u.role === "ADMIN");
        if (adminUser) {
          await authRepository.updateUser(adminUser.id, { username });
          updatedAdminUsername = username;
        }
      }
    }

    const { adminUsername, ...orgData } = data;

    // data: URL logo → storage upload (email-safe URL), phir store.
    if (orgData.logoUrl !== undefined) {
      orgData.logoUrl = await this._persistDataUrlLogo(orgData.logoUrl, id);
    }

    // Rule 5: when the org image is replaced (or cleared), delete the old file
    // from storage so old versions don't pile up on the 25GB Cloudinary plan.
    // Guard: skip when the new URL points at the SAME Cloudinary asset — the
    // upload already overwrote it, so deleting would destroy the replacement.
    if (
      orgData.logoUrl !== undefined &&
      existing.logoUrl &&
      orgData.logoUrl !== existing.logoUrl &&
      !storageService.hasSamePublicId(existing.logoUrl, orgData.logoUrl)
    ) {
      await storageService.deleteImage({ url: existing.logoUrl }).catch(() => {});
    }

    const updated = await organizationRepository.update(id, orgData);

    if (updatedAdminUsername) {
      updated.adminUsername = updatedAdminUsername;
    }

    try {
      await redis.del("orgs:all");
      await redis.del(`org:${id}`);
      await redis.del("superadmin:overview");
    } catch (err) {
      // Ignore
    }

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UPDATE_ORG,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: id,
        entityName: existing.name,
        organizationId: id,
        details: JSON.stringify({ changed: Object.keys(orgData) }),
      })
    );

    emitToRoom(`org:${id}`, "organization_updated", updated);
    emitToRoom("super_admins", "overview_updated", {});

    return updated;
  }

  /**
   * Queue a background job to delete the organization and clear cache.
   * The background worker removes the organization together with every
   * branch and all related data (students, staff, fees, attendance, etc.).
   */
  async deleteOrganizationInBackground(id, requester = null, req = null) {
    let org;
    try {
      org = await this.getOrganizationById(id);
    } catch (err) {
      // Idempotent: if org doesn't exist, consider it already deleted
      if (err.statusCode === 404) {
        return null;
      }
      throw err;
    }

    const job = await organizationDeleteQueue.add("delete-organization", {
      id,
      actor: {
        id: requester?.id || null,
        name: requester?.name || "System",
        role: requester?.role || "SUPER_ADMIN",
        ipAddress: req?.ip || null,
      },
    });

    // Comprehensive Redis cache clearing - remove all org-related caches
    try {
      await redis.del([
        "orgs:all",
        `org:${id}`,
        "superadmin:overview",
        `schools:org:${id}`,
        "schools:all",
      ]);
    } catch (err) {
      // Non-blocking cache clearing
    }

    emitToRoom("super_admins", "overview_updated", {});

    return job.id;
  }

  /**
   * Resolve the effective status of an org for the UI (spec §5 badges):
   * - BLOCKED when the org was explicitly blocked (stored)
   * - PARTIALLY_BLOCKED when active but at least one branch is blocked
   * - ACTIVE when an admin account exists (lazy upgrade out of SETUP_PENDING)
   * - SETUP_PENDING otherwise
   */
  _effectiveOrgStatus(org) {
    const { status, branches = [] } = org;
    const anyBlocked = branches.some((b) => b.status === "BLOCKED");

    if (status === "BLOCKED") return "BLOCKED";
    if (status === "PARTIALLY_BLOCKED") return anyBlocked ? "PARTIALLY_BLOCKED" : "ACTIVE";
    if (status === "ACTIVE") return anyBlocked ? "PARTIALLY_BLOCKED" : "ACTIVE";
    // SETUP_PENDING — only a first login (markDeliveredOnLogin) flips it to ACTIVE.
    return "SETUP_PENDING";
  }

  /**
   * Platform overview for the Super Admin dashboard.
   * One cached request replaces the old N+1 org→school fetch pattern and now
   * includes status counts, revenue totals, and the org growth trend.
   */
  async getOverview() {
    const cacheKey = "superadmin:overview";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // Fall back to DB on cache failure
    }

    const [
      { orgs, schools, studentsByOrg },
      { byOrg: revenueByOrg, total: totalRevenue },
      growth,
    ] = await Promise.all([
      organizationRepository.findOverview(),
      organizationRepository.revenueOverview(),
      organizationRepository.orgGrowth(12),
    ]);

    // Sum per-org totals once each — iterating schools would double-count
    // orgs that own multiple branches.
    const totalStudents = Object.values(studentsByOrg).reduce((sum, n) => sum + n, 0);

    const statusCounts = { active: 0, blocked: 0, partiallyBlocked: 0, setupPending: 0 };
    const orgsWithStatus = orgs.map((org) => {
      const status = this._effectiveOrgStatus(org);
      statusCounts[status === "PARTIALLY_BLOCKED" ? "partiallyBlocked" : status === "SETUP_PENDING" ? "setupPending" : status.toLowerCase()] += 1;
      const blockedBranchCount = (org.branches ?? []).filter((b) => b.status === "BLOCKED").length;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        code: org.code,
        logoUrl: org.logoUrl || null,
        status,
        blockedBranchCount,
        createdAt: org.createdAt,
        schoolCount: org._count?.branches || 0,
        userCount: org._count?.users || 0,
        studentCount: studentsByOrg[org.id] || 0,
        revenue: Math.round(revenueByOrg[org.id] || 0),
      };
    });

    const overview = {
      stats: {
        totalOrganizations: orgs.length,
        totalSchools: schools.length,
        totalStudents,
        totalStaffUsers: orgs.reduce((sum, o) => sum + (o._count?.users || 0), 0),
        activeStudents: totalStudents,
        totalRevenue: Math.round(totalRevenue),
        ...statusCounts,
      },
      growth,
      organizations: orgsWithStatus,
    };

    try {
      await redis.setEx(cacheKey, OVERVIEW_CACHE_TTL, JSON.stringify(overview));
    } catch (err) {
      // Non-blocking
    }

    return overview;
  }

  /**
   * Delivery cycle (user spec): the org is "delivered" (SETUP_PENDING → ACTIVE)
   * the first time anyone logs in successfully. Called from the auth service
   * after a valid staff login. Never throws — delivery is best-effort.
   */
  async markDeliveredOnLogin(user) {
    if (!user?.organizationId) return;
    try {
      const org = await organizationRepository.findById(user.organizationId);
      if (!org || org.status !== "SETUP_PENDING") return;

      await organizationRepository.update(user.organizationId, { status: "ACTIVE" });

      try {
        await redis.del(["orgs:all", `org:${user.organizationId}`, "superadmin:overview", `schools:org:${user.organizationId}`]);
      } catch (err) {
        // Non-blocking
      }
      emitToRoom("super_admins", "overview_updated", {});

      auditService.record({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: AUDIT_ACTIONS.UPDATE_ORG,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: user.organizationId,
        entityName: org.name,
        organizationId: user.organizationId,
        details: JSON.stringify({ trigger: "first-login", transition: "SETUP_PENDING -> ACTIVE" }),
      });
    } catch (err) {
      // Non-blocking — never break a login because delivery failed
    }
  }

  /**
   * Branch-level dashboard for one organization (spec §4): staff vs students
   * per branch, monthly revenue series, and the staff detail table.
   */
  async getOrganizationDashboard(orgId, requester) {
    // Org-level admin apni hi org ka combined dashboard dekh sakta hai (todo #12) —
    // platform admin (organizationId null) kisi bhi org ka.
    if (requester?.organizationId && requester.organizationId !== orgId) {
      throw ApiError.forbiddenError("You can only view your own organization's dashboard");
    }

    const org = await this.getOrganizationById(orgId);
    if (!org) throw ApiError.notFoundError("Organization not found");

    const data = await organizationRepository.orgDashboard(orgId, 12);

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        code: org.code,
        logoUrl: org.logoUrl || null,
        themeColor: org.themeColor || null,
        status: this._effectiveOrgStatus({
          status: org.status,
          branches: data.branches.map((b) => ({ status: b.status })),
          users: org.users,
        }),
      },
      branches: data.branches,
      revenue: data.revenue,
      staff: data.staff,
    };
  }

  /**
   * Build an Excel (.xlsx) workbook of all organizations for download.
   */
  async exportExcel() {
    const orgs = await this.getAllOrganizations();
    const rows = orgs.map((org) => ({
      Name: org.name,
      Code: org.code,
      Slug: org.slug,
      "Branches": org._count?.branches ?? 0,
      "Staff Accounts": org._count?.users ?? 0,
      "Created": org.createdAt ? new Date(org.createdAt).toISOString().slice(0, 10) : "",
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Organizations");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Build a blank Excel (.xlsx) template for bulk organization import.
   * Headers only — users fill in their own rows, so no sample data is
   * ever accidentally imported.
   */
  async downloadImportTemplate() {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
      ["Name", "Code", "Slug", "LogoUrl", "AdminName", "AdminUsername", "AdminEmail", "AdminPassword", "AdminPhone"],
      ["Falcon Academy Systems", "FALCON-01", "falcon-academy", "https://example.com/logo.png", "Mr. Ali Khan", "falcon_admin", "admin@falcon.edu", "Welcome@123", "03001234567"],
    ]);
    xlsx.utils.book_append_sheet(wb, ws, "Organizations");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Parse an uploaded Excel file and queue a bulk import job.
   */
  async importExcel(fileBuffer, requester) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError(
        "The Excel file has no data rows. Download the template, add at least one organization row, and upload the filled file again."
      );
    }

    const organizations = rawRows
      .map((row) => ({
        name: row.Name || row.name || row["Organization Name"],
        code: row.Code || row.code || row["Organization Code"],
        slug: row.Slug || row.slug,
        logoUrl: row.LogoUrl || row.logoUrl || row["Logo URL"],
        adminEmail: row.AdminEmail || row.adminEmail || row["Admin Email"],
        adminName: row.AdminName || row.adminName || row["Admin Name"],
        adminUsername: row.AdminUsername || row.adminUsername || row["Admin Username"],
        adminPassword: row.AdminPassword || row.adminPassword || row["Admin Password"],
        adminPhone: row.AdminPhone || row.adminPhone || row["Admin Phone"],
      }))
      .filter((o) => o.name && o.code);

    if (organizations.length === 0) {
      throw ApiError.badRequestError(
        "No valid rows found. Ensure columns 'Name' and 'Code' exist in the sheet"
      );
    }

    const job = await organizationImportQueue.add("import-organizations", {
      organizations,
      // Lets the worker skip emailing the platform super admin when an Excel
      // row designates their OWN email as the org admin (they created it).
      requesterEmail: requester?.email || null,
    });
    return { jobId: job.id, totalRows: organizations.length };
  }
  async getPublicSlugs() {
    return await organizationRepository.findAllPublicSlugs();
  }

  /**
   * Public org landing data — /o/:slug ke liye (koi auth nahi).
   * Org branding (logo, themeColor) + saari branches, taaki public page
   * DB se dynamic bane (ORG_ADMIN_FLOW.md §2).
   */
  async getPublicBySlug(slug) {
    const org = await organizationRepository.findBySlugWithBranches(slug);
    if (!org) throw ApiError.notFoundError("Organization not found");

    return {
      id: org.id,
      name: org.name,
      code: org.code,
      slug: org.slug,
      logoUrl: org.logoUrl || null,
      themeColor: org.themeColor || null,
      phone: org.phone || null,
      email: org.email || null,
      website: org.website || null,
      facebookUrl: org.facebookUrl || null,
      instagramUrl: org.instagramUrl || null,
      twitterUrl: org.twitterUrl || null,
      youtubeUrl: org.youtubeUrl || null,
      branches: org.branches ?? [],
    };
  }

  /**
   * School health audit — blocked branches, missing admins, zero-staff, empty orgs.
   */
  async getSchoolHealth() {
    return organizationRepository.schoolHealth();
  }
}

export default new OrganizationService();