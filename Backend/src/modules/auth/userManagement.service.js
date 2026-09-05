import bcrypt from "bcryptjs";
import xlsx from "xlsx";
import prisma from "../../config/db.js";
import authRepository from "../auth/repository.js";
import { UserResponseDTO } from "../auth/auth.dto.js";
import ApiError from "../../lib/utils/ApiError.js";
import { ROLES } from "../../constants.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { staffCredentialsEmail } from "../../services/email.templates.js";
import { queueEmail } from "../../services/emailOutbox.js";
import { buildCsv } from "../../lib/utils/csv.js";
import { staffImportQueue } from "../../jobs/queues/staffImport.queue.js";
import Logger from "../../lib/utils/logger.js";
import smtpSettingsService from "../smtpSettings/smtpSettings.service.js";
import storageSettingsService from "../storageSettings/storageSettings.service.js";

const logger = new Logger("user-management-service");

const CREATABLE_ROLES_BY = {
  SUPER_ADMIN: [ROLES.ADMIN, ROLES.TEACHER, ROLES.RECEPTIONIST],
  ADMIN: [ROLES.TEACHER, ROLES.RECEPTIONIST],
};

class UserManagementService {
  async importStaffExcel(fileBuffer, requester) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) throw ApiError.badRequestError("Excel sheet is empty");

    const staffMembers = rawRows
      .map((row) => ({
        name: row.Name || row.name || row["Staff Name"],
        email: row.Email || row.email || row["Email Address"],
        phone: row.Phone || row.phone || row["Phone Number"],
        role: row.Role || row.role || row["Staff Role"],
        schoolId: row.SchoolId || row.schoolId || row["School ID"],
      }))
      .filter((s) => s.name && s.email && s.role);

    if (staffMembers.length === 0) {
      throw ApiError.badRequestError("No valid staff rows found. Ensure columns 'Name', 'Email', and 'Role' exist.");
    }

    const job = await staffImportQueue.add("import-staff", {
      staffMembers,
      organizationId: requester.organizationId,
      requesterSchoolId: requester.schoolId,
      requesterRole: requester.role,
    });
    return { jobId: job.id, totalRows: staffMembers.length };
  }

  buildImportTemplate() {
    const rows = [
      { Name: "Mr. Ahmed Khan", Email: "ahmed@school.edu", Phone: "03001234567", Role: "TEACHER" },
      { Name: "Miss Sana Malik", Email: "sana.malik@school.edu", Phone: "03011223344", Role: "RECEPTIONIST" },
    ];
    const sheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "Staff");
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  async createUser(requester, data) {
    const allowedRoles = CREATABLE_ROLES_BY[requester.role];
    if (!allowedRoles) throw ApiError.forbiddenError("You do not have permission to create user accounts.");
    if (!allowedRoles.includes(data.role)) throw ApiError.forbiddenError(`You cannot create a user with role '${data.role}'.`);

    const existing = await authRepository.findByEmailRaw(data.email);
    if (existing) throw ApiError.badRequestError("A user with this email already exists.");

    let organizationId = null;
    let schoolId = null;

    if (requester.role === ROLES.SUPER_ADMIN) {
      schoolId = data.schoolId || null;
      // SUPER_ADMIN can provide organizationId directly (org-level admin)
      // or schoolId (branch-level staff) — org is derived from school.
      if (data.organizationId) {
        organizationId = data.organizationId;
      }
      if (schoolId) {
        const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } });
        if (!school) throw ApiError.notFoundError("School not found.");
        organizationId = school.organizationId;
      }
      // ADMIN: organization is optional (org-level principal without branch)
      // TEACHER / RECEPTIONIST: branch is required
      if ([ROLES.TEACHER, ROLES.RECEPTIONIST].includes(data.role) && !schoolId) {
        throw ApiError.badRequestError("A branch must be specified for teachers and receptionists.");
      }
      // If branch already has an active admin, deactivate the old one (replace flow)
      if (data.role === ROLES.ADMIN && schoolId) {
        const existingAdmin = await prisma.user.findFirst({
          where: { role: ROLES.ADMIN, schoolId, isActive: true },
          select: { id: true, name: true, email: true },
        });
        if (existingAdmin) {
          // Deactivate old admin automatically
          await prisma.refreshToken.deleteMany({ where: { userId: existingAdmin.id } });
          await prisma.user.update({ where: { id: existingAdmin.id }, data: { isActive: false, schoolId: null } });
        }
      }
    } else if (requester.role === ROLES.ADMIN) {
      organizationId = requester.organizationId;
      schoolId = requester.schoolId;
    }

    let schoolCode = null;
    let schoolLogoUrl = null;
    let orgLogoUrl = null;
    let emailOrgName = null;
    let emailOrgSlug = null;
    let emailThemeColor = null;
    if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { code: true, logoUrl: true, themeColor: true, organizationId: true },
      });
      schoolCode = school?.code || null;
      schoolLogoUrl = school?.logoUrl || null;
      emailThemeColor = school?.themeColor || null;
      if (school?.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: school.organizationId },
          select: { logoUrl: true, slug: true, name: true, themeColor: true },
        });
        orgLogoUrl = org?.logoUrl || null;
        emailOrgName = org?.name || null;
        emailOrgSlug = org?.slug || null;
      }
    } else if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { logoUrl: true, slug: true, name: true, themeColor: true },
      });
      orgLogoUrl = org?.logoUrl || null;
      emailOrgName = org?.name || null;
      emailOrgSlug = org?.slug || null;
      emailThemeColor = org?.themeColor || null;
    }

    const sharedPassword = data.password || schoolCode || "School@123";
    const hashed = await bcrypt.hash(sharedPassword, 12);
    const generatedUsername = data.username || `STF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = await authRepository.createUser({
      name: data.name,
      username: generatedUsername,
      email: data.email,
      password: hashed,
      phone: data.phone || null,
      role: data.role,
      organizationId,
      schoolId,
    });

    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.CREATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: newUser.id, entityName: newUser.name, organizationId, schoolId,
      details: JSON.stringify({ role: newUser.role, username: generatedUsername }),
    });

    portalNotificationService.create({
      schoolId: schoolId || undefined, organizationId: organizationId || undefined,
      senderId: requester.id, senderName: requester.name,
      title: "STAFF_CREATED",
      body: `New ${newUser.role} account created: ${newUser.name} (${generatedUsername}).`,
      category: "STAFF", refType: "STAFF_CREATED", refId: newUser.id, link: "/staff",
    }).catch(() => {});

    const mail = staffCredentialsEmail({
      name: newUser.name, role: newUser.role, username: generatedUsername,
      email: data.email, password: sharedPassword, schoolCode,
      orgName: emailOrgName, orgSlug: emailOrgSlug,
      logoUrl: schoolLogoUrl || orgLogoUrl, themeColor: emailThemeColor,
    });
    await queueEmail({ to: data.email, ...mail, priority: "CRITICAL", organizationId, schoolId: schoolId || undefined });

    // ── Teacher assignment (inline during creation) ──
    if (data.role === ROLES.TEACHER && data.teacherClassId && schoolId) {
      try {
        const classExists = await prisma.class.findFirst({ where: { id: data.teacherClassId, schoolId } });
        if (classExists) {
          await prisma.teacherAssignment.upsert({
            where: {
              teacherId_classId_subjectId_sectionId: {
                teacherId: newUser.id,
                classId: data.teacherClassId,
                subjectId: data.teacherSubjectId || null,
                sectionId: data.teacherSectionId || null,
              },
            },
            update: {},
            create: {
              teacherId: newUser.id,
              classId: data.teacherClassId,
              subjectId: data.teacherSubjectId || null,
              sectionId: data.teacherSectionId || null,
            },
          });
        }
      } catch (err) {
        logger.warn(`Teacher assignment failed for ${newUser.id}: ${err.message}`);
      }
    }

    // ── SMTP settings provision for ADMIN ──
    if (data.role === ROLES.ADMIN && data.smtp?.host && data.smtp?.username) {
      try {
        await smtpSettingsService.provision(organizationId, schoolId || null, data.smtp);
      } catch (err) {
        logger.warn(`SMTP provision failed for org ${organizationId}: ${err.message}`);
      }
    }

    // ── Cloudinary settings provision for ADMIN ──
    if (data.role === ROLES.ADMIN && data.cloudinary?.cloudName && data.cloudinary?.apiKey) {
      try {
        await storageSettingsService.provision(organizationId, data.cloudinary);
      } catch (err) {
        logger.warn(`Cloudinary provision failed for org ${organizationId}: ${err.message}`);
      }
    }

    return UserResponseDTO.toDTO(newUser);
  }

  /**
   * Find admin users in an organization that are NOT assigned to any branch.
   * These are org-level principals created without a schoolId.
   */
  async listUnassignedAdmins(requester, { page = 1, pageSize = 50 } = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbiddenError("Only Super Admins can list unassigned admins.");
    }
    const where = { role: ROLES.ADMIN, isActive: true, schoolId: null };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, organizationId: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Assign an existing admin to a branch. Validates no duplicate admin.
   */
  async assignAdminToBranch(requester, adminId, schoolId) {
    if (requester.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbiddenError("Only Super Admins can assign admins to branches.");
    }
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) throw ApiError.notFoundError("Admin not found");
    if (admin.role !== ROLES.ADMIN) throw ApiError.badRequestError("User is not an admin");

    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true, name: true } });
    if (!school) throw ApiError.notFoundError("Branch not found");

    // If branch already has an active admin, deactivate the old one first
    const oldAdmin = await prisma.user.findFirst({
      where: { role: ROLES.ADMIN, schoolId, isActive: true, id: { not: adminId } },
      select: { id: true, name: true, email: true },
    });
    if (oldAdmin) {
      // Deactivate old admin — revoke tokens + mark inactive
      await prisma.refreshToken.deleteMany({ where: { userId: oldAdmin.id } });
      await prisma.user.update({ where: { id: oldAdmin.id }, data: { isActive: false, schoolId: null } });
      auditService.record({
        actorId: requester.id, actorName: requester.name, actorRole: requester.role,
        action: AUDIT_ACTIONS.DEACTIVATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: oldAdmin.id, entityName: oldAdmin.name,
        organizationId: school.organizationId, schoolId,
        details: JSON.stringify({ action: "replaced-by-assign", newAdminId: adminId }),
      });
    }

    await prisma.user.update({
      where: { id: adminId },
      data: { schoolId, organizationId: school.organizationId },
    });

    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.UPDATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: adminId, entityName: admin.name,
      organizationId: school.organizationId, schoolId,
      details: JSON.stringify({ action: "assign-to-branch", replacedAdminId: oldAdmin?.id || null }),
    });

    return {
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email },
      replacedAdmin: oldAdmin ? { id: oldAdmin.id, name: oldAdmin.name, email: oldAdmin.email } : null,
    };
  }

  async createSampleStaff(requester) {
    const schoolId = requester.schoolId;
    if (!schoolId) throw ApiError.badRequestError("Sample staff are created per branch.");
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, code: true, name: true } });
    if (!school) throw ApiError.notFoundError("School not found");

    const sharedPassword = school.code || "School@123";
    const hashed = await bcrypt.hash(sharedPassword, 12);

    const sample = [
      { name: "Miss Ayesha Khan", email: "ayesha.khan@school.edu", role: ROLES.TEACHER },
      { name: "Mr. Bilal Ahmed", email: "bilal.ahmed@school.edu", role: ROLES.TEACHER },
      { name: "Mrs. Sana Malik", email: "sana.malik@school.edu", role: ROLES.TEACHER },
      { name: "Mr. Farhan Ali", email: "farhan.ali@school.edu", role: ROLES.RECEPTIONIST },
    ];

    const classes = await prisma.class.findMany({
      where: { schoolId }, orderBy: { order: "asc" }, take: sample.length,
      select: { id: true, name: true },
    });

    let created = 0;
    const results = [];
    for (let i = 0; i < sample.length; i++) {
      const s = sample[i];
      const existing = await prisma.user.findUnique({ where: { email: s.email } });
      if (existing) continue;
      const username = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
      const user = await prisma.user.create({
        data: { name: s.name, username, email: s.email, password: hashed, role: s.role, organizationId: requester.organizationId, schoolId },
      });
      created++;
      const klass = classes[i];
      if (s.role === ROLES.TEACHER && klass) {
        await prisma.teacherAssignment.upsert({
          where: { teacherId_classId_subjectId_sectionId: { teacherId: user.id, classId: klass.id, subjectId: null, sectionId: null } },
          update: {}, create: { teacherId: user.id, classId: klass.id, subjectId: null, sectionId: null },
        });
      }
      results.push({ name: user.name, email: user.email, username, role: user.role, classTeacher: klass?.name || null });
    }

    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.CREATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: schoolId, entityName: school.name,
      organizationId: requester.organizationId, schoolId,
      details: JSON.stringify({ mode: "sample", created }),
    });
    return { created, password: sharedPassword, items: results };
  }

  async listUsers(requester, { page = 1, pageSize = 50 } = {}) {
    let result;
    if (requester.role === ROLES.SUPER_ADMIN) {
      result = await authRepository.findUsersByOrganization(requester.organizationId, { page, pageSize });
    } else if (requester.role === ROLES.ADMIN) {
      result = await authRepository.findUsersBySchool(requester.schoolId, { page, pageSize });
      result.items = result.items.filter((u) => u.role !== ROLES.ADMIN);
      result.total = result.items.length;
    } else {
      throw ApiError.forbiddenError("You do not have permission to view user accounts.");
    }
    return {
      items: result.items.map(UserResponseDTO.toDTO), total: result.total,
      page: result.page, pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  }

  async exportStaffExcel(requester) {
    const userResult = requester.role === ROLES.SUPER_ADMIN
      ? await authRepository.findUsersByOrganization(requester.organizationId, { pageSize: 10000 })
      : await authRepository.findUsersBySchool(requester.schoolId, { pageSize: 10000 });
    const rows = userResult.items.filter((u) => u.role !== ROLES.SUPER_ADMIN).map((u) => ({
      Name: u.name, Email: u.email, Phone: u.phone || "", Role: u.role,
      Username: u.username || "", Status: u.isActive ? "Active" : "Inactive",
      Branch: u.school?.name || "", Created: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
    }));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Staff");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async listAllUsersPlatform(requester, { page = 1, pageSize = 50, search, role, isActive, hasBlockReason, organizationId } = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) throw ApiError.forbiddenError("Only Super Admins can view the platform-wide user directory.");
    const [result, stats] = await Promise.all([
      authRepository.findAllUsersPlatform({ page, pageSize, search, role, isActive, hasBlockReason, organizationId }),
      authRepository.platformUserStats(),
    ]);
    return {
      stats, items: result.items.map(UserResponseDTO.toDTO), total: result.total,
      page: result.page, pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  }

  /**
   * Unified platform directory — staff + students in one list.
   */
  async listPlatformDirectory(requester, filters = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) throw ApiError.forbiddenError("Only Super Admins can access the platform directory.");
    const p = Math.max(1, parseInt(filters.page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 50));
    return authRepository.listPlatformDirectory({
      type: filters.type || "all",
      search: filters.search,
      organizationId: filters.organizationId,
      schoolId: filters.schoolId,
      role: filters.role,
      status: filters.status,
      classId: filters.classId,
      sectionId: filters.sectionId,
      page: p, pageSize: ps,
    });
  }

  async exportAllUsersPlatform(requester, filters = {}) {
    if (requester.role !== ROLES.SUPER_ADMIN) throw ApiError.forbiddenError("Only Super Admins can export the user directory.");
    const { items } = await authRepository.findAllUsersPlatform({ ...filters, page: 1, pageSize: 10000 });
    return buildCsv(
      ["Name", "Email", "Role", "Organization", "Branch", "Status", "Block Reason", "Joined"],
      items.map((u) => [u.name, u.email, u.role, u.organization?.name, u.school?.name, u.isActive ? "Active" : "Blocked", u.blockedReason, new Date(u.createdAt).toLocaleDateString("en-PK")])
    );
  }

  async getUserById(requester, targetId) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    return UserResponseDTO.toDTO(target);
  }

  async updateUser(requester, targetId, data) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    if (data.role) {
      const allowedRoles = CREATABLE_ROLES_BY[requester.role];
      if (!allowedRoles || !allowedRoles.includes(data.role)) throw ApiError.forbiddenError(`You cannot assign role '${data.role}'.`);
    }
    const { password, organizationId, schoolId, ...safeData } = data;
    const updated = await authRepository.updateUser(targetId, safeData);
    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.UPDATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId, entityName: target.name,
      organizationId: target.organizationId, schoolId: target.schoolId,
      details: JSON.stringify(Object.keys(safeData)),
    });
    return UserResponseDTO.toDTO(updated);
  }

  async deactivateUser(requester, targetId, reason) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    if (targetId === requester.id) throw ApiError.badRequestError("You cannot deactivate your own account.");
    await authRepository.revokeAllRefreshTokens(targetId);
    const updated = await authRepository.updateUser(targetId, { isActive: false });
    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.DEACTIVATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId, entityName: target.name,
      organizationId: target.organizationId, schoolId: target.schoolId,
      ...(reason ? { details: JSON.stringify({ reason }) } : {}),
    });
    return updated;
  }

  async reactivateUser(requester, targetId) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    const updated = await authRepository.updateUser(targetId, { isActive: true });
    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.REACTIVATE_STAFF, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId, entityName: target.name,
      organizationId: target.organizationId, schoolId: target.schoolId,
    });
    return updated;
  }

  async adminResetPassword(requester, targetId, newPassword) {
    const target = await authRepository.findById(targetId);
    if (!target) throw ApiError.notFoundError("User not found");
    this._assertCanAccessUser(requester, target);
    const hashed = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(targetId, { password: hashed });
    await authRepository.revokeAllRefreshTokens(targetId);
    auditService.record({
      actorId: requester.id, actorName: requester.name, actorRole: requester.role,
      action: AUDIT_ACTIONS.RESET_STAFF_PASSWORD, entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: targetId, entityName: target.name,
      organizationId: target.organizationId, schoolId: target.schoolId,
    });
    return true;
  }

  _assertCanAccessUser(requester, target) {
    if (requester.role === ROLES.SUPER_ADMIN) return;
    if (requester.role === ROLES.ADMIN && requester.organizationId === target.organizationId) return;
    throw ApiError.forbiddenError("You cannot access this user account.");
  }
}

export default new UserManagementService();
