import ApiError from "../../lib/utils/ApiError.js";
import bcrypt from "bcryptjs";
import xlsx from "xlsx";
import prisma from "../../config/db.js";
import schoolRepository from "./repository.js";
import organizationRepository from "../organization/organization.repository.js";
import { assertOwnSchool } from "../../lib/scope.js";
import redis from "../../config/redis.js";
import { emitToRoom } from "../../config/websocket.js";
import { schoolImportQueue } from "../../jobs/queues/index.js";
import { createBranchAdmin } from "../organization/provision.js";
import { invalidateUserCache } from "../../middlewares/auth.middleware.js";
import smtpSettingsService from "../smtpSettings/smtpSettings.service.js";
import storageSettingsService from "../storageSettings/storageSettings.service.js";
import storageService from "../../services/storage.service.js";
import { resolveBranchLogoReplace } from "./logoSync.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";



const SCHOOL_CACHE_TTL = 300; // 5 minutes
const OVERVIEW_CACHE_KEY = "superadmin:overview";

/**
 * Best-effort Redis cache invalidation (never blocks the request on failure).
 */
async function bustSchoolCaches(keys) {
  try {
    // orgs:all holds _count.branches — must refresh when a school is
    // created/updated/deleted or the org list shows stale branch counts.
    const toDelete = ["schools:all", "orgs:all", ...keys];
    await redis.del(toDelete);
  } catch (err) {
    // Non-blocking
  }
}

class SchoolService {
  /**
   * Public tenant branding used on the login screen.
   * Accepts a school `code` (GULSHAN-01) OR an organization `slug` (gulshan).
   * Prioritizes branch logo → falls back to organization logo.
   */
  async getBranding({ code, slug, organization, school }) {
    let branch = null;
    if (code) {
      branch = await schoolRepository.findByCodeWithOrg(code.trim());
    } else if (slug) {
      branch = await schoolRepository.findByOrgSlug(slug.trim());
    } else if (organization) {
      // Org-scoped resolution: `organization` = org slug OR code, optional
      // `school` = branch code/name resolved strictly within that org.
      const org = await prisma.organization.findFirst({
        where: { OR: [{ slug: organization.trim() }, { code: organization.trim().toUpperCase() }] },
        select: { id: true },
      });
      if (org) {
        branch = school
          ? await schoolRepository.findInOrgByCodeOrName(org.id, school)
          : await schoolRepository.findByOrgId(org.id);
      }
    }

    if (!branch) {
      throw ApiError.notFoundError("School not found");
    }

    return {
      code: branch.code,
      name: branch.name,
      slug: branch.organization?.slug || null,
      orgName: branch.organization?.name || null,
      logoUrl: branch.logoUrl || branch.organization?.logoUrl || null,
      // Sirf DB wala theme — koi hardcoded fallback nahi. Theme na ho to null
      // (frontend apna default palette use karta hai, blue force nahi hota).
      themeColor: branch.themeColor || branch.organization?.themeColor || null,
    };
  }

  /**
   * Create a branch (School) with an admin.
   * `adminEmail`   → creates a NEW Principal account (credentials emailed).
   * `existingAdminEmail` → SAME account (an org ADMIN) manages this branch
   *   too — no new credentials; the admin's home branch stays untouched.
   */
  async create({ name, code, organizationId, address, phone, adminEmail, adminName, adminPassword, existingAdminEmail, smtp, cloudinary }, requester = null, req = null) {
    if (!name || !code || !organizationId) {
      throw ApiError.badRequestError("'name', 'code' and 'organizationId' are required");
    }

    const org = await schoolRepository.organizationExists(organizationId);
    if (!org) {
      throw ApiError.notFoundError("Organization not found");
    }

    const existing = await schoolRepository.findByCode(code);
    if (existing) {
      throw ApiError.badRequestError("School with this code already exists");
    }

    // Existing-admin mode: must resolve to an ACTIVE ADMIN of THIS org —
    // validated BEFORE creating the school so a bad email can't leave a
    // half-created branch behind.
    let existingAdmin = null;
    if (existingAdminEmail) {
      existingAdmin = await schoolRepository.findOrgAdminByEmail(existingAdminEmail, organizationId);
      if (!existingAdmin) {
        throw ApiError.badRequestError(
          "No active admin found with this email in this organization. Use a new admin instead."
        );
      }
    } else {
      // New-admin mode: the email must be free (duplicate email validation
      // happens before school creation too).
      if (!adminEmail) {
        throw ApiError.badRequestError(
          "An email is required for the new branch admin"
        );
      }
      const newAdminEmail = adminEmail.toString().trim().toLowerCase();
      const emailTaken = await schoolRepository.userEmailExists(newAdminEmail);
      if (emailTaken) {
        throw ApiError.badRequestError(
          "A user with this email already exists. Choose another email."
        );
      }
    }

    // Naya admin → SMTP + Cloudinary zaroori (koi previous account nahi jisse
    // inherit karein). Existing admin → optional; agar diye to wohi isi branch
    // ke liye use honge, warna org/platform wale fallback ho jaate hain.
    const hasSmtp = !!(smtp?.host && smtp?.username);
    const hasCloud = !!(cloudinary?.cloudName && cloudinary?.apiKey);
    if (!existingAdminEmail && (!hasSmtp || !hasCloud)) {
      throw ApiError.badRequestError(
        "SMTP and Cloudinary credentials are required when creating a new branch admin."
      );
    }

    const school = await schoolRepository.create({
      name,
      code,
      organizationId,
      address,
      phone,
    });

    await bustSchoolCaches([`schools:org:${organizationId}`]);
    try {
      await redis.del(OVERVIEW_CACHE_KEY);
    } catch (err) {
      // Non-blocking
    }

    // Optional branch-level SMTP override intake (primary + secondary
    // failover). Invalid creds fail fast — school create se pehle hi.
    let smtpSetting = null;
    if (smtp?.host && smtp?.username) {
      smtpSetting = await smtpSettingsService.provision(organizationId, school.id, smtp);
    }
    if (smtp?.secondary?.host && smtp?.secondary?.username) {
      await smtpSettingsService.provision(organizationId, school.id, {
        ...smtp.secondary,
        tier: "SECONDARY",
      });
    }

    // Branch-level Cloudinary override (org default/platform env fallback).
    let cloudinarySetting = null;
    if (hasCloud) {
      cloudinarySetting = await storageSettingsService.provision(organizationId, cloudinary, school.id);
    }

    emitToRoom("super_admins", "school_created", { schoolId: school.id, name: school.name, organizationId });
    emitToRoom(`org:${organizationId}`, "school_created", { schoolId: school.id, name: school.name });
    emitToRoom("super_admins", "overview_updated", {});

    // ── Existing-admin mode: same credentials, extra branch access ───────
    if (existingAdmin) {
      const admin = await schoolRepository.addBranchAccess(existingAdmin.id, school.id);
      await invalidateUserCache(existingAdmin.id);
      auditService.record(
        auditService.fromRequest(requester, req, {
          action: AUDIT_ACTIONS.CREATE_SCHOOL,
          entityType: AUDIT_ENTITY_TYPES.SCHOOL,
          entityId: school.id,
          entityName: school.name,
          organizationId,
          details: JSON.stringify({ code: school.code, adminMode: "existing", adminEmail: existingAdmin.email }),
        })
      );
      return { school, admin, adminCredentials: null, smtpSetting, cloudinarySetting };
    }

    // Don't email the super admin when they designate their OWN email as
    // the new branch principal (they created the branch themselves).
    const selfDesignation =
      requester?.email &&
      String(requester.email).trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const created = await createBranchAdmin({
      organizationId,
      schoolId: school.id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      orgName: org.name,
      orgSlug: org.slug,
      schoolName: school.name,
      schoolCode: school.code,
      skipEmail: selfDesignation,
    });

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.CREATE_SCHOOL,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: school.id,
        entityName: school.name,
        organizationId,
        details: JSON.stringify({ code: school.code, adminMode: "new" }),
      })
    );

    return { school, admin: created.user, adminCredentials: created.credentials, smtpSetting, cloudinarySetting };
  }

  async getById(id) {
    const cacheKey = `school:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // Fall back to DB
    }

    const school = await schoolRepository.findById(id);
    if (!school) {
      throw ApiError.notFoundError("School not found");
    }

    // Rename the repository's `users` (branch ADMINs) to `admins` for the API.
    const { users, ...rest } = school;
    const shaped = { ...rest, admins: users ?? [] };

    try {
      await redis.setEx(cacheKey, SCHOOL_CACHE_TTL, JSON.stringify(shaped));
    } catch (err) {
      // Non-blocking
    }

    return shaped;
  }

  async getAnalytics(schoolId) {
    return schoolRepository.branchAnalytics(schoolId, 12);
  }

  /**
   * Re-assign a branch's admin.
   * `adminEmail`   → create a fresh ADMIN (Principal) + email credentials; the
   *                  previous dedicated Principal is deactivated.
   * `existingAdminEmail` → the SAME account (an org ADMIN) also manages this
   *                  branch — no new credentials, nobody is deactivated.
   */
  async assignAdmin(schoolId, { adminEmail, adminName, adminPassword, existingAdminEmail }, requester = null, req = null) {
    const school = await this.getById(schoolId);
    const orgName = school.organization?.name || "Organization";

    // ── Existing-admin mode: attach access, never deactivate/create ─────────
    if (existingAdminEmail) {
      const existingAdmin = await schoolRepository.findOrgAdminByEmail(existingAdminEmail, school.organizationId);
      if (!existingAdmin) {
        throw ApiError.badRequestError(
          "No active admin found with this email in this organization. Use a new admin instead."
        );
      }
      const admin = await schoolRepository.addBranchAccess(existingAdmin.id, schoolId);
      await invalidateUserCache(existingAdmin.id);
      await this._bustAdminCaches(schoolId, school.organizationId);

      auditService.record(
        auditService.fromRequest(requester, req, {
          action: AUDIT_ACTIONS.ASSIGN_SCHOOL_ADMIN,
          entityType: AUDIT_ENTITY_TYPES.SCHOOL,
          entityId: schoolId,
          entityName: school.name,
          organizationId: school.organizationId,
          schoolId,
          details: JSON.stringify({ mode: "existing", adminEmail: existingAdmin.email }),
        })
      );
      return { mode: "existing", admin, adminCredentials: null };
    }

    if (!adminEmail) {
      throw ApiError.badRequestError("An email is required for the new branch admin");
    }
    const email = adminEmail.toString().trim().toLowerCase();
    const emailTaken = await schoolRepository.userEmailExists(email);
    if (emailTaken) {
      throw ApiError.badRequestError(
        "A user with this email already exists. Choose another email."
      );
    }

    // Old principal loses access before the new one takes over
    await schoolRepository.deactivateBranchAdmins(schoolId);
    const selfDesignation =
      requester?.email &&
      String(requester.email).trim().toLowerCase() ===
        String(email).trim().toLowerCase();
    const created = await createBranchAdmin({
      organizationId: school.organizationId,
      schoolId,
      name: adminName,
      email,
      password: adminPassword,
      orgName,
      orgSlug: school.organization?.slug,
      schoolName: school.name,
      schoolCode: school.code,
      skipEmail: selfDesignation,
    });

    await this._bustAdminCaches(schoolId, school.organizationId);

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.ASSIGN_SCHOOL_ADMIN,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: schoolId,
        entityName: school.name,
        organizationId: school.organizationId,
        schoolId,
        details: JSON.stringify({ mode: "new", adminEmail: email }),
      })
    );

    return { mode: "new", admin: created.user, adminCredentials: created.credentials };
  }

  /**
   * Invalidate caches that reflect a branch's admin assignment.
   */
  async _bustAdminCaches(schoolId, organizationId) {
    await bustSchoolCaches([`school:${schoolId}`, `schools:org:${organizationId}`]);
    try {
      await redis.del(OVERVIEW_CACHE_KEY);
    } catch (err) {
      // Non-blocking
    }
    emitToRoom(`school:${schoolId}`, "school_admin_updated", { schoolId });
    emitToRoom("super_admins", "overview_updated", {});
  }

  async list(organizationId, { page = 1, pageSize = 100 } = {}) {
    const cacheKey = organizationId ? `schools:org:${organizationId}:p${page}` : `schools:all:p${page}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // Fall back to DB
    }

    const result = organizationId
      ? await schoolRepository.listByOrganization(organizationId, { page, pageSize })
      : await schoolRepository.listAll({ page, pageSize });

    try {
      await redis.setEx(cacheKey, SCHOOL_CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      // Non-blocking
    }

    return result;
  }

  async update(id, data, requester = null, req = null) {
    // Branch principal sirf APNI branch ka profile update kar sakta hai —
    // pehle koi scope check nahi tha → koi bhi ADMIN kisi bhi branch ko
    // update kar sakta tha (overreach). SUPER_ADMIN (org-wide) sab kar sakta hai.
    if (requester) assertOwnSchool(requester, id);
    const existing = await this.getById(id);

    if (data.code) {
      const conflict = await schoolRepository.findByCode(data.code);
      if (conflict && conflict.id !== id) {
        throw ApiError.badRequestError("Another school with this code already exists");
      }
    }

    const updatable = {};
    for (const key of ["name", "code", "address", "phone", "logoUrl", "themeColor", "attendanceStartTime", "attendanceCutoffTime", "attendanceAbsentTime", "attendanceAlertTime", "bankName", "bankAccountTitle", "bankAccountNumber"]) {
      if (data[key] !== undefined) updatable[key] = data[key];
    }

    // Branch logo bhi managed URL ban jaye (data:/external URL → storage).
    if (updatable.logoUrl !== undefined) {
      updatable.logoUrl = await this._persistLogo(updatable.logoUrl, requester?.organizationId, id);
    }

    // Validate attendance times format (HH:MM, 24hr) + logical ordering.
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
    const timeToMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    for (const key of ["attendanceStartTime", "attendanceCutoffTime", "attendanceAbsentTime", "attendanceAlertTime"]) {
      if (updatable[key] !== undefined && !timeRegex.test(updatable[key])) {
        throw ApiError.badRequestError(
          `Invalid ${key} format. Use HH:MM (24hr), e.g. 08:30, 09:00`
        );
      }
    }
    if (updatable.attendanceStartTime !== undefined) {
      updatable.attendanceStartTime = updatable.attendanceStartTime || "07:45";
    }
    if (updatable.attendanceCutoffTime !== undefined) {
      updatable.attendanceCutoffTime = updatable.attendanceCutoffTime || "08:30";
    }
    if (updatable.attendanceAbsentTime !== undefined) {
      updatable.attendanceAbsentTime = updatable.attendanceAbsentTime || "10:00";
    }
    if (updatable.attendanceAlertTime !== undefined) {
      updatable.attendanceAlertTime = updatable.attendanceAlertTime || "09:30";
    }
    const start = timeToMin(updatable.attendanceStartTime ?? existing.attendanceStartTime ?? "07:45");
    const cutoff = timeToMin(updatable.attendanceCutoffTime ?? existing.attendanceCutoffTime ?? "08:30");
    const absent = timeToMin(updatable.attendanceAbsentTime ?? existing.attendanceAbsentTime ?? "10:00");
    const alert = timeToMin(updatable.attendanceAlertTime ?? existing.attendanceAlertTime ?? "09:30");
    // Logical order: start < cutoff ≤ alert ≤ absent
    // Alert fires BETWEEN late-cutoff and absent-cutoff so parents get
    // notified before the final absent mark.
    if (!(start < cutoff && cutoff <= alert && alert <= absent)) {
      throw ApiError.badRequestError(
        "Attendance times must be ordered: start < late cutoff ≤ alert ≤ absent time"
      );
    }

    // ── Branch image replacement rules (spec §3 + §5) ─────────────────────
    // Rule lives in ./logoSync.js (dependency-injected for unit testing):
    // Rule 5 deletes the replaced image; Case A syncs the org image when the
    // org has exactly ONE branch; Case B leaves it untouched (2+ branches).
    let orgImageSync = null;
    if (data.logoUrl !== undefined && data.logoUrl !== existing.logoUrl) {
      const result = await resolveBranchLogoReplace({
        school: existing,
        newLogoUrl: data.logoUrl,
        countBranches: () => schoolRepository.countByOrganization(existing.organizationId),
        deleteImage: async (url) => {
          await storageService.deleteImage({ url, organizationId: existing.organizationId, schoolId: id }).catch(() => {});
        },
        hasSamePublicId: (a, b) => storageService.hasSamePublicId(a, b),
      });
      orgImageSync = result.orgImageSync;
    }

    const updated = await schoolRepository.update(id, updatable);

    if (orgImageSync) {
      await organizationRepository.update(existing.organizationId, { logoUrl: orgImageSync });
    }

    await bustSchoolCaches([
      `school:${id}`,
      `schools:org:${existing.organizationId}`,
      // `school:${id}` embeds the org's logoUrl — refresh it when synced
      ...(orgImageSync ? [`org:${existing.organizationId}`] : []),
    ]);
    try {
      await redis.del(OVERVIEW_CACHE_KEY);
    } catch (err) {
      // Non-blocking
    }

    emitToRoom(`school:${id}`, "school_updated", updated);
    if (orgImageSync) {
      emitToRoom(`org:${existing.organizationId}`, "organization_updated", {
        id: existing.organizationId,
        logoUrl: orgImageSync,
      });
    }
    emitToRoom("super_admins", "overview_updated", {});

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.UPDATE_SCHOOL,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: id,
        entityName: existing.name,
        organizationId: existing.organizationId,
        schoolId: id,
        details: JSON.stringify({ changed: Object.keys(updatable) }),
      })
    );

    return updated;
  }

  /**
   * Upload a branch logo image (stored by storage service; local disk or
   * Cloudinary). Returns the URL to save on the school.
   *
   * When `schoolId` is provided, the upload overwrites the branch's existing
   * logo (same Cloudinary public_id) instead of creating a new file.
   */
  async uploadLogo(buffer, schoolId, organizationId) {
    if (!buffer || buffer.length === 0) {
      throw ApiError.badRequestError("Please upload an image file");
    }
    let existingUrl = null;
    if (schoolId) {
      const school = await this.getById(schoolId);
      existingUrl = school.logoUrl || null;
    }
    const { url } = await storageService.uploadImage({ buffer, folder: "school-logos", existingUrl, organizationId, schoolId });
    return { url };
  }

  /**
   * Branch logo persistence rule (org jaisa): data: URL ya external URL ko
   * storage par upload karke managed URL banao (email/branding safe).
   */
  async _persistLogo(logoUrl, organizationId, schoolId) {
    if (!logoUrl || typeof logoUrl !== "string") return logoUrl;
    if (logoUrl.startsWith("data:")) {
      try {
        const comma = logoUrl.indexOf(",");
        if (comma === -1) return logoUrl;
        const buffer = Buffer.from(logoUrl.slice(comma + 1), "base64");
        const { url } = await storageService.uploadImage({ buffer, folder: "school-logos", organizationId, schoolId });
        return url || logoUrl;
      } catch (err) {
        return logoUrl;
      }
    }
    if (logoUrl.startsWith("/uploads/") || logoUrl.includes("res.cloudinary.com/")) {
      return logoUrl;
    }
    if (/^https?:\/\//i.test(logoUrl)) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        try {
          const res = await fetch(logoUrl, { signal: controller.signal, redirect: "follow" });
          if (!res.ok) throw new Error(`Remote image fetch failed: HTTP ${res.status}`);
          const contentLen = Number(res.headers.get("content-length") || 0);
          if (contentLen > 5 * 1024 * 1024) throw new Error("Remote image exceeds 5MB limit");
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length === 0) throw new Error("Remote image is empty");
          const { url } = await storageService.uploadImage({ buffer, folder: "school-logos", organizationId, schoolId });
          return url || logoUrl;
        } finally {
          clearTimeout(timer);
        }
      } catch (err) {
        return logoUrl;
      }
    }
    return logoUrl;
  }

  async remove(id, requester = null, req = null) {
    let existing;
    try {
      existing = await this.getById(id);
    } catch (err) {
      // Idempotent: if school doesn't exist, consider it already deleted
      if (err.statusCode === 404) {
        return;
      }
      throw err;
    }

    // Check if already deleted (double-click protection)
    const schoolExists = await prisma.school.findUnique({ where: { id } });
    if (!schoolExists) return;

    // Deterministic delete of the branch AND everything related to it
    // (students, staff, fees, attendance, timetables, exams, activities,
    // applicants, etc.) inside one transaction. Children are removed before
    // parents so the schema's RESTRICT foreign keys never block the delete.
    // 30s timeout — default 5s is too short for schools with many records.
    await prisma.$transaction(
      async (tx) => {
        const f = { schoolId: id };

        // 1. Children of Student (RESTRICT FKs)
        await tx.timetableSlot.deleteMany({ where: { section: { class: f } } });
        await tx.examResult.deleteMany({ where: { student: f } });
        await tx.conductRemark.deleteMany({ where: { student: f } });
        await tx.feePayment.deleteMany({ where: { feeRecord: { student: f } } });
        await tx.feeRecord.deleteMany({ where: { student: f } });
        await tx.attendanceRecord.deleteMany({ where: { student: f } });
        await tx.promotionRecord.deleteMany({ where: { student: f } });

        // 2. Direct school-level records (no student FK)
        await tx.feeLineItem.deleteMany({ where: { feeStructure: f } });
        await tx.feeStructure.deleteMany({ where: f });
        await tx.homeworkBroadcast.deleteMany({ where: f });
        await tx.applicant.deleteMany({ where: f });
        await tx.activity.deleteMany({ where: f });
        await tx.circular.deleteMany({ where: f });
        await tx.pTMSession.deleteMany({ where: f });
        await tx.notificationLog.deleteMany({ where: f });
        await tx.exam.deleteMany({ where: f });
        await tx.term.deleteMany({ where: { academicYear: f } });
        await tx.academicYear.deleteMany({ where: f });
        await tx.subject.deleteMany({ where: { class: f } });

        // 3. Students (depend on Section FK) — must go BEFORE Section
        await tx.student.deleteMany({ where: f });

        // 4. Sections (depend on Class FK) — must go BEFORE Class
        await tx.section.deleteMany({ where: { class: f } });

        // 5. Classes
        await tx.class.deleteMany({ where: f });

        // 6. Branch staff — RefreshToken rows cascade with each user.
        await tx.user.deleteMany({ where: f });

        // 7. Parents no longer referenced by any remaining student.
        await tx.parent.deleteMany({ where: { students: { none: {} } } });

        // 8. School itself
        await tx.school.delete({ where: { id } });
      },
      { timeout: 30000, maxWait: 10000 }
    );

    // Rule 5 — delete the branch logo from storage once the branch is gone.
    // Guard: in a single-branch org the branch logo is synced to the org
    // image (the SAME Cloudinary asset), and the org still exists — never
    // destroy that shared asset, it becomes the org's own logo.
    if (existing.logoUrl) {
      const orgLogoUrl = existing.organization?.logoUrl;
      if (!orgLogoUrl || !storageService.hasSamePublicId(existing.logoUrl, orgLogoUrl)) {
        await storageService.deleteImage({ url: existing.logoUrl, organizationId: existing.organizationId, schoolId: id }).catch(() => {});
      }
    }

    // Comprehensive cache clearing
    await bustSchoolCaches([`school:${id}`, `schools:org:${existing.organizationId}`]);
    try {
      await redis.del(OVERVIEW_CACHE_KEY);
      await redis.del(`org:${existing.organizationId}`);
    } catch (err) {
      // Non-blocking
    }

    emitToRoom("super_admins", "school_deleted", { schoolId: id });
    emitToRoom("super_admins", "overview_updated", {});

    auditService.record(
      auditService.fromRequest(requester, req, {
        action: AUDIT_ACTIONS.DELETE_SCHOOL,
        entityType: AUDIT_ENTITY_TYPES.SCHOOL,
        entityId: id,
        entityName: existing.name,
        organizationId: existing.organizationId,
        schoolId: id,
      })
    );
  }

  /**
   * Build an Excel (.xlsx) workbook of branches for download.
   * With organizationId → only that organization's branches; otherwise all.
   */
  async exportExcel(organizationId) {
    let org = null;
    if (organizationId) {
      org = await schoolRepository.organizationExists(organizationId);
      if (!org) {
        throw ApiError.notFoundError("Organization not found");
      }
    }

    const schools = organizationId
      ? await schoolRepository.listByOrganization(organizationId)
      : await schoolRepository.listAll();

    const rows = schools.map((school) => ({
      "Organization": organizationId ? (org?.name ?? "") : (school.organization?.name ?? ""),
      "Org Code": organizationId ? (org?.code ?? "") : (school.organization?.code ?? ""),
      "Branch Name": school.name,
      "Branch Code": school.code,
      "Address": school.address ?? "",
      "Phone": school.phone ?? "",
      "Students": school._count?.students ?? 0,
      "Classes": school._count?.classes ?? 0,
      "Created": school.createdAt ? new Date(school.createdAt).toISOString().slice(0, 10) : "",
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Branches");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Parse an uploaded Excel file and queue a bulk branch import job.
   *
   * When organizationId is provided → every row belongs to that organization
   * (columns: Name, Code + optional Address/Phone/AdminEmail/AdminName).
   * Otherwise → rows must include an OrganizationCode column so branches can
   * be matched to their organizations across the whole platform.
   */
  /**
   * Build a blank Excel (.xlsx) template for bulk branch import.
   * OrganizationCode is optional when importing into one organization,
   * required when importing across all organizations.
   */
  async downloadImportTemplate() {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
      ["OrganizationCode", "Name", "Code", "Address", "Phone", "AdminName", "AdminEmail"],
      ["FALCON-01", "Main Campus", "MAIN-01", "Gulshan, Karachi", "03001234567", "Mr. Ali Khan", "admin@falcon.edu"],
    ]);
    xlsx.utils.book_append_sheet(wb, ws, "Branches");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async importExcel(fileBuffer, organizationId, requester = null, req = null) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError("Excel sheet is empty");
    }

    const branches = rawRows
      .map((row) => ({
        organizationCode: row.OrganizationCode || row.organizationCode || row["Org Code"],
        name: row.Name || row.name || row["Branch Name"],
        code: row.Code || row.code || row["Branch Code"],
        address: row.Address || row.address,
        phone: row.Phone || row.phone || row["Phone Number"],
        adminEmail: row.AdminEmail || row.adminEmail || row["Admin Email"],
        adminName: row.AdminName || row.adminName || row["Admin Name"],
      }))
      .filter((b) => b.name && b.code);

    if (branches.length === 0) {
      throw ApiError.badRequestError(
        "No valid rows found. Ensure columns 'Name' and 'Code' exist in the sheet"
      );
    }

    if (organizationId) {
      const org = await schoolRepository.organizationExists(organizationId);
      if (!org) {
        throw ApiError.notFoundError("Organization not found");
      }
    } else if (branches.some((b) => !b.organizationCode)) {
      throw ApiError.badRequestError(
        "Provide 'OrganizationCode' for every row when importing branches across all organizations"
      );
    }

    const job = await schoolImportQueue.add("import-schools", {
      branches,
      organizationId: organizationId || null,
      actor: {
        id: requester?.id || null,
        name: requester?.name || "Bulk Import",
        role: requester?.role || "SUPER_ADMIN",
        ipAddress: req?.ip || null,
      },
    });

    return { jobId: job.id, totalRows: branches.length };
  }

  // ──────────────────────────────────────────
  // Shared parent/student portal password
  // ──────────────────────────────────────────

  /**
   * Branch admin ek shared portal password set karta hai jo parents/students
   * login ke liye use karte hain (pehle ye school code hota tha, settable nahi).
   */
  async setPortalPassword(requester, schoolId, password) {
    assertOwnSchool(requester, schoolId);
    if (!password || String(password).trim().length < 6) {
      throw ApiError.badRequestError("Portal password must be at least 6 characters");
    }
    const hashed = await bcrypt.hash(String(password).trim(), 12);
    await prisma.school.update({ where: { id: schoolId }, data: { portalPassword: hashed } });
    return true;
  }

  /** Reset → wapas default behaviour (school code hi password hai). */
  async resetPortalPassword(requester, schoolId) {
    assertOwnSchool(requester, schoolId);
    await prisma.school.update({ where: { id: schoolId }, data: { portalPassword: null } });
    return true;
  }

  /** Settings UI ko batata hai ke custom password active hai ya default. */
  async getPortalPasswordStatus(schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, code: true, portalPassword: true },
    });
    if (!school) throw ApiError.notFoundError("School not found");
    return { hasCustomPassword: Boolean(school.portalPassword), schoolCode: school.code };
  }
}

export default new SchoolService();
