import prisma from "../../config/db.js";

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
        id: true,
        name: true,
        code: true,
        slug: true,
        status: true,
        themeColor: true,
        logoUrl: true,
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
   * Branch staff (ADMIN/TEACHER/...) — branch relation se (apni branch locked).
   */
  async findStaffBySchoolAndCredential(schoolCode, identifier) {
    const cleanIdentifier = identifier.toString().trim();
    const code = schoolCode.toString().trim().toUpperCase();
    const identifierMatch = {
      OR: [
        { username: cleanIdentifier },
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    };
    return prisma.user.findFirst({
      where: { school: { code }, ...identifierMatch },
      include: this.#userInclude,
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
  async findAllUsersPlatform({ page = 1, pageSize = 50, search, role, isActive, hasBlockReason } = {}) {
    const where = {};
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
                organization: { select: { id: true, status: true } },
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
            school: { select: { id: true, name: true } },
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
            organization: { select: { id: true, status: true } },
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
            organization: { select: { id: true, status: true } },
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
            organization: { select: { id: true, status: true } },
          },
        },
      },
    });
  }
}

export default new AuthRepository();
