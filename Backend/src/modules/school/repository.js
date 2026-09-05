import prisma from "../../config/db.js";

class SchoolRepository {
  async organizationExists(organizationId) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    });
  }

  async userEmailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return Boolean(user);
  }

  async create(data) {
    return prisma.school.create({ data });
  }

  async findById(id) {
    return prisma.school.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        // Dedicated branch ADMINs (Principals) — `users` is renamed to `admins`
        // in the service. Includes DEDICATED (schoolId) + multi-branch admins
        // whose branchAccess list this branch (same account, no new credentials).
        users: {
          where: {
            role: "ADMIN",
            OR: [
              { schoolId: id },
              { branchAccess: { array_contains: [id] } },
            ],
          },
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { students: true, classes: true, users: true } },
      },
    });
  }

  /**
   * Find an ACTIVE ADMIN user who belongs to the given organization — the
   * "existing admin" path for branch assignment (no new credentials created).
   */
  async findOrgAdminByEmail(email, organizationId) {
    return prisma.user.findFirst({
      where: {
        email: String(email).trim().toLowerCase(),
        organizationId,
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  /**
   * Grant a user access to another branch (multi-branch admin). Home branch
   * (`schoolId`) is untouched — access is added to `branchAccess` only.
   */
  async addBranchAccess(userId, schoolId) {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { branchAccess: true },
    });
    const current = Array.isArray(row?.branchAccess) ? row.branchAccess : [];
    return prisma.user.update({
      where: { id: userId },
      data: { branchAccess: [...new Set([...current, schoolId])] },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  /**
   * Soft-disable every dedicated ADMIN user on a branch (used when the
   * branch admin is re-assigned — the old principal loses access).
   */
  async deactivateBranchAdmins(schoolId) {
    return prisma.user.updateMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      data: { isActive: false },
    });
  }

  async findByCode(code) {
    return prisma.school.findUnique({ where: { code } });
  }

  /**
   * Count the branches (Schools) belonging to an organization.
   * Used by the image sync rule: a single-branch org keeps its org image in
   * sync with the branch; multi-branch orgs leave the org image untouched.
   */
  async countByOrganization(organizationId) {
    return prisma.school.count({ where: { organizationId } });
  }

  async findByCodeWithOrg(code) {
    return prisma.school.findUnique({
      where: { code },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
    });
  }

  async findByOrgSlug(slug) {
    return prisma.school.findFirst({
      where: { organization: { slug } },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /** First branch of an organization (branding resolution). */
  async findByOrgId(organizationId) {
    return prisma.school.findFirst({
      where: { organizationId },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Find a school within a specific organization by its code (case-insensitive)
   * OR by its name (case-insensitive). Used by the login screen to resolve a
   * `school` query param (which may be either a code or a name) scoped to the
   * organization — never leaking another org's branch.
   */
  async findInOrgByCodeOrName(organizationId, value) {
    const needle = String(value).trim();
    if (!needle || !organizationId) return null;
    const upper = needle.toUpperCase();
    return prisma.school.findFirst({
      where: {
        organizationId,
        OR: [{ code: { equals: upper, mode: "insensitive" } }, { name: { equals: needle, mode: "insensitive" } }],
      },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.school.update({ where: { id }, data });
  }

  async listByOrganization(organizationId, { page = 1, pageSize = 100 } = {}) {
    const [items, total] = await Promise.all([
      prisma.school.findMany({
        where: { organizationId },
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
          _count: { select: { students: true, classes: true, users: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.school.count({ where: { organizationId } }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async listAll({ page = 1, pageSize = 100 } = {}) {
    const [items, total] = await Promise.all([
      prisma.school.findMany({
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
          _count: { select: { students: true, classes: true, users: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.school.count(),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async branchAnalytics(schoolId, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthKeys = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      monthKeys.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString("en", { month: "short" }), count: 0, rate: 0 });
    }

    // New students per month
    const newStudents = await prisma.student.findMany({
      where: { schoolId, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    for (const s of newStudents) {
      const key = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth() + 1}`;
      const bucket = monthKeys.find((m) => m.key === key);
      if (bucket) bucket.count += 1;
    }

    // Attendance rate per month
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { student: { schoolId }, date: { gte: since } },
      select: { date: true, status: true },
    });
    const attMap = {};
    for (const a of attendanceRecords) {
      const key = `${a.date.getFullYear()}-${a.date.getMonth() + 1}`;
      if (!attMap[key]) attMap[key] = { present: 0, total: 0 };
      attMap[key].total += 1;
      if (a.status === "PRESENT" || a.status === "LATE") attMap[key].present += 1;
    }
    for (const m of monthKeys) {
      const a = attMap[m.key];
      m.rate = a ? Math.round((a.present / a.total) * 100) : 0;
    }

    // Fee summary
    const feeRecords = await prisma.feeRecord.findMany({
      where: { student: { schoolId } },
      select: { totalAmount: true, paidAmount: true },
    });
    const totalDue = feeRecords.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const totalPaid = feeRecords.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);

    // Active counts
    const studentCount = await prisma.student.count({ where: { schoolId, status: "ACTIVE" } });
    const staffCount = await prisma.user.count({ where: { schoolId, isActive: true } });

    return {
      enrollment: { monthly: monthKeys.map((m) => ({ key: m.key, label: m.label, count: m.count })) },
      attendance: { monthly: monthKeys.map((m) => ({ key: m.key, label: m.label, rate: m.rate })) },
      fees: { totalDue, totalPaid, totalPending: totalDue - totalPaid },
      students: studentCount,
      staff: staffCount,
    };
  }
}

export default new SchoolRepository();
