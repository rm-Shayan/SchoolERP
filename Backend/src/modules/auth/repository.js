import prisma from "../../config/db.js";

// Org branding fields shared by the #userInclude and session-school queries —
// matches what the UserResponseDTO exposes for the nested `organization`.
const ORG_BRAND_SELECT = {
  id: true,
  name: true,
  code: true,
  slug: true,
  status: true,
  themeColor: true,
  logoUrl: true,
};

// Safe staff list shape — password hash kabhi response mein nahi jata aur
// payload chhota rehta hai (pageSize=500 par noticeable farq parta hai).
const STAFF_LIST_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  blockedAt: true,
  blockedReason: true,
  blockedByName: true,
  credentialsEmailSentAt: true,
  createdAt: true,
  schoolId: true,
  organizationId: true,
};

class AuthRepository {
  // ==========================================
  // STAFF USER — Queries
  // ==========================================

  // Shared include: nested branch + org branding/status. NOTE: `organization.schools`
  // yahan NAHI hai — relation `branches` hota hai aur DTO waise bhi sirf apni
  // branch bhejta hai (koi org-level admin / Branch Switcher nahi). Ye include
  // login, /auth/me aur refresh teeno mein use hota hai — galat field = 500.
  #userInclude = {
    school: {
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        portalPassword: true,
        logoUrl: true,
        themeColor: true,
        attendanceStartTime: true,
        attendanceCutoffTime: true,
        attendanceAbsentTime: true,
        attendanceAlertTime: true,
      },
    },
    organization: {
      select: {
        ...ORG_BRAND_SELECT,
      },
    },
  };

  /**
   * Find a user by email (for login)
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: this.#userInclude,
    });
  }

  /**
   * Find staff member by School Code and Email/Username/Phone.
   * Matches when the school code is the user's HOME branch OR sits in their
   * `branchAccess` (multi-branch admin). Returns { user, school } where
   * `school` is the branch the code resolved to (the effective session branch).
   */
  async findStaffBySchoolAndCredential(schoolCode, identifier) {
    const cleanIdentifier = identifier.toString().trim();
    const code = schoolCode.toString().trim().toUpperCase();
    const school = await prisma.school.findFirst({
      where: { code },
      include: { organization: { select: ORG_BRAND_SELECT } },
    });
    if (!school) return { user: null, school: null };

    const identifierMatch = {
      OR: [
        { username: cleanIdentifier },
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    };
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { schoolId: school.id },
              { branchAccess: { array_contains: [school.id] } },
            ],
          },
          identifierMatch,
        ],
      },
      include: this.#userInclude,
    });
    return { user, school };
  }

  /**
   * Branch row (with org branding) for the CURRENT session — used by login,
   * switch-branch, refresh and /auth/me when the token is scoped to a
   * non-home branch.
   */
  async findSchoolForSession(id) {
    return prisma.school.findUnique({
      where: { id },
      include: { organization: { select: ORG_BRAND_SELECT } },
    });
  }

  /**
   * Minimal branch rows for a user's accessible set (home + branchAccess).
   */
  async listAccessibleSchools(organizationId, ids) {
    if (!ids || ids.length === 0) return [];
    return prisma.school.findMany({
      where: { id: { in: ids }, organizationId },
      select: { id: true, name: true, code: true, status: true },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Find a user by ID
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: this.#userInclude,
    });
  }

  /**
   * Create a new staff user
   */
  async createUser(data) {
    return prisma.user.create({
      data,
      include: {
        school: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
        organization: { select: { id: true, name: true, code: true, slug: true, status: true, themeColor: true, logoUrl: true } },
      },
    });
  }

  /**
   * Update a user by ID
   */
  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        school: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
        organization: { select: { id: true, name: true, code: true, slug: true, status: true, themeColor: true, logoUrl: true } },
      },
    });
  }

  /**
   * List users scoped to an organization (for SUPER_ADMIN)
   */
  async findUsersByOrganization(organizationId, { page = 1, pageSize = 50 } = {}) {
    const where = { organizationId };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...STAFF_LIST_SELECT,
          school: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
          organization: { select: { id: true, name: true, code: true, slug: true, status: true, themeColor: true, logoUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /**
   * List ALL staff users across every organization (platform view).
   * Used by the Super Admin platform console — see all staff accounts.
   * Filters: search (name/email/username/org/branch), role, isActive,
   * hasBlockReason — server-side, taake frontend ko 500-record cap na chahiye.
   */
  async findAllUsersPlatform({ page = 1, pageSize = 50, search, role, isActive, hasBlockReason, organizationId, schoolId } = {}) {
    const where = {};
    if (organizationId) where.organizationId = organizationId;
    if (schoolId) where.schoolId = schoolId;
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (hasBlockReason !== undefined) where.blockedReason = hasBlockReason ? { not: null } : null;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { organization: { name: { contains: search, mode: "insensitive" } } },
        { school: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...STAFF_LIST_SELECT,
          school: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
          organization: { select: { id: true, name: true, code: true, slug: true, status: true, themeColor: true, logoUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /**
   * Global directory stats — poore platform ke counts (filters se independent),
   * warna pagination ke saath stats sirf current page ka sum ho jate.
   */
  async platformUserStats() {
    const [total, active, orgGroups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({ by: ["organizationId"], where: { organizationId: { not: null } } }),
    ]);
    return { total, active, inactive: total - active, orgs: orgGroups.length };
  }

  /**
   * Unified platform directory — users (staff) + students combined.
   * type filter: 'all' | 'staff' | 'student'
   */
  async listPlatformDirectory({ type = "all", search, organizationId, schoolId, role, status, classId, sectionId, page = 1, pageSize = 50 } = {}) {
    const wantStaff = type === "all" || type === "staff";
    const wantStudent = type === "all" || type === "student";

    const buildUserWhere = () => {
      const w = {};
      if (organizationId) w.organizationId = organizationId;
      if (schoolId) w.schoolId = schoolId;
      if (role) w.role = role;
      if (status === "ACTIVE") w.isActive = true;
      else if (status === "INACTIVE") w.isActive = false;
      if (search) {
        w.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { organization: { name: { contains: search, mode: "insensitive" } } },
          { school: { name: { contains: search, mode: "insensitive" } } },
        ];
      }
      return w;
    };

    const buildStudentWhere = () => {
      const w = {};
      if (schoolId) w.schoolId = schoolId;
      if (organizationId) w.school = { organizationId };
      if (sectionId) w.sectionId = sectionId;
      else if (classId) w.section = { classId };
      if (status) w.status = status;
      if (search) {
        w.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { rollNumber: { contains: search, mode: "insensitive" } },
        ];
      }
      return w;
    };

    let userItems = [], userTotal = 0, studentItems = [], studentTotal = 0;

    // DB-level pagination: for "all" type, split pageSize across both queries
    // so we don't load 5000 rows into memory.
    const staffPageSize = type === "all" ? Math.ceil(pageSize * 0.6) : pageSize;
    const studentPageSize = type === "all" ? pageSize - staffPageSize : pageSize;
    const staffOffset = (page - 1) * staffPageSize;
    const studentOffset = (page - 1) * studentPageSize;

    if (wantStaff) {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where: buildUserWhere(),
          select: {
            id: true, name: true, email: true, username: true, role: true, isActive: true, createdAt: true, avatarUrl: true,
            school: { select: { id: true, name: true, code: true, logoUrl: true } },
            organization: { select: { id: true, name: true, logoUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: staffOffset,
          take: staffPageSize,
        }),
        prisma.user.count({ where: buildUserWhere() }),
      ]);
      userItems = items.map((u) => ({
        id: u.id, type: "staff", name: u.name, email: u.email,
        subtitle: u.role, status: u.isActive ? "ACTIVE" : "BLOCKED",
        avatarUrl: u.avatarUrl || null,
        organization: u.organization, branch: u.school,
        createdAt: u.createdAt,
      }));
      userTotal = total;
    }

    if (wantStudent) {
      const [items, total] = await Promise.all([
        prisma.student.findMany({
          where: buildStudentWhere(),
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true, status: true, createdAt: true,
            school: { select: { id: true, name: true, code: true, logoUrl: true, organization: { select: { id: true, name: true, logoUrl: true } } } },
            section: { select: { id: true, name: true, class: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip: studentOffset,
          take: studentPageSize,
        }),
        prisma.student.count({ where: buildStudentWhere() }),
      ]);
      studentItems = items.map((s) => ({
        id: s.id, type: "student", name: `${s.firstName} ${s.lastName}`, email: null,
        subtitle: s.section ? `${s.section.class?.name} — ${s.section.name}` : null,
        status: s.status,
        organization: s.school?.organization ?? null,
        branch: s.school ? { id: s.school.id, name: s.school.name, code: s.school.code, logoUrl: s.school.logoUrl || null } : null,
        createdAt: s.createdAt,
      }));
      studentTotal = total;
    }

    // Merge + sort by createdAt desc (small arrays now — at most pageSize items)
    const all = [...userItems, ...studentItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = userTotal + studentTotal;
    const items = all.slice(0, pageSize);

    return { items, total, userTotal, studentTotal, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * List users scoped to a single school branch (for ADMIN)
   */
  async findUsersBySchool(schoolId, { page = 1, pageSize = 50 } = {}) {
    const where = { schoolId };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...STAFF_LIST_SELECT,
          school: { select: { id: true, name: true, code: true, status: true, logoUrl: true, themeColor: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /**
   * Check if email is already taken (for user creation validation)
   */
  async findByEmailRaw(email) {
    return prisma.user.findUnique({ where: { email }, select: { id: true } });
  }

  /**
   * Check if a username is already taken (username is unique)
   */
  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
      select: { id: true, organizationId: true },
    });
  }

  // ==========================================
  // REFRESH TOKENS
  // ==========================================

  /**
   * Store a new refresh token hash in the database
   */
  async createRefreshToken(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  /**
   * Lighter user include for refresh token lookups — only the fields needed
   * for token rotation + blocking checks. Skips school/org branding fields
   * that the full #userInclude carries (logoUrl, themeColor, attendance*…)
   * and shaves ~40-60% off the query payload.
   */
  #refreshUserInclude = {
    school: {
      select: { id: true, status: true },
    },
    organization: {
      select: { id: true, status: true },
    },
  };

  /**
   * Find a refresh token by its hash (lightweight user include)
   */
  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: this.#refreshUserInclude } },
    });
  }

  /**
   * Revoke a specific refresh token (logout)
   */
  async revokeRefreshToken(tokenHash) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke ALL refresh tokens for a user (logout from all devices)
   */
  async revokeAllRefreshTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Delete expired/revoked tokens (cleanup, called periodically)
   */
  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }

  // ==========================================
  // OTP — Parent & Student Portal
  // ==========================================

  /**
   * Save an OTP (hashed) for a given identifier
   */
  async saveOtp(identifier, otpType, otpHash, expiresAt) {
    // Delete any previous unused OTPs for same identifier + type first
    await prisma.otpCode.deleteMany({
      where: { identifier, otpType, isUsed: false },
    });

    return prisma.otpCode.create({
      data: { identifier, otpType, otpHash, expiresAt },
    });
  }

  /**
   * Find latest valid OTP for an identifier
   */
  async findOtp(identifier, otpType) {
    return prisma.otpCode.findFirst({
      where: {
        identifier,
        otpType,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Increment failed attempt count for an OTP record
   */
  async incrementOtpAttempts(otpId) {
    return prisma.otpCode.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
  }

  /**
   * Mark OTP as used after successful verification
   */
  async markOtpUsed(otpId) {
    return prisma.otpCode.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  // ==========================================
  // PARENT — Queries
  // ==========================================

  /**
   * Find a parent by WhatsApp number
   */
  async findParentByWhatsapp(whatsappNo) {
    return prisma.parent.findUnique({
      where: { whatsappNo },
      include: {
        students: {
          include: {
            section: { include: { class: true } },
            school: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Find a parent by school code + phone (password login).
   * The parent must have at least one child enrolled at a branch with that code.
   */
  async findParentBySchoolAndPhone(schoolCode, phone) {
    return prisma.parent.findFirst({
      where: {
        whatsappNo: phone.toString().trim(),
        students: {
          some: {
            school: { code: schoolCode.toString().trim().toUpperCase() },
          },
        },
      },
      include: {
        students: {
          include: {
            section: { include: { class: true } },
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                portalPassword: true,
                organizationId: true,
                organization: { select: { id: true, status: true, themeColor: true, logoUrl: true, slug: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a parent by ID (for /me endpoint)
   */
  async findParentById(id) {
    return prisma.parent.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            section: { include: { class: true } },
            school: { select: { id: true, name: true, organization: { select: { themeColor: true, logoUrl: true, slug: true } } } },
          },
        },
      },
    });
  }

  // ==========================================
  // STUDENT — Queries
  // ==========================================

  /**
   * Find a student by identifierCode (QR / RFID value)
   */
  async findStudentByIdentifierCode(identifierCode) {
    return prisma.student.findUnique({
      where: { identifierCode },
      include: {
        parent: true,
        section: { include: { class: true } },
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            portalPassword: true,
            organizationId: true,
            organization: { select: { id: true, status: true, themeColor: true, logoUrl: true, slug: true } },
          },
        },
      },
    });
  }

  async findStudentByRollAndSchool(rollNumber, schoolCode) {
    return prisma.student.findFirst({
      where: {
        rollNumber: rollNumber.toString().trim(),
        school: {
          code: schoolCode.toString().trim().toUpperCase(),
        },
      },
      include: {
        parent: true,
        section: { include: { class: true } },
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            portalPassword: true,
            organizationId: true,
            organization: { select: { id: true, status: true, themeColor: true, logoUrl: true, slug: true } },
          },
        },
      },
    });
  }

  /**
   * Find student by ID
   */
  async findStudentById(id) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        section: { include: { class: true } },
        school: {
          select: {
            id: true,
            name: true,
            status: true,
            organizationId: true,
            organization: { select: { id: true, status: true, themeColor: true, logoUrl: true, slug: true } },
          },
        },
      },
    });
  }
}

export default new AuthRepository();
