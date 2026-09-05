import prisma from "../../config/db.js";

class OrganizationRepository {
  async create(data) {
    return await prisma.organization.create({ data });
  }

  async findAll() {
    const orgs = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: "SUPER_ADMIN" },
          select: { username: true },
          take: 1,
        },
        _count: { select: { branches: true, users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate blocked branch counts in a single query instead of loading all branch rows
    const blockedGroups = await prisma.school.groupBy({
      by: ["organizationId"],
      where: { status: "BLOCKED" },
      _count: { id: true },
    });
    const blockedMap = Object.fromEntries(blockedGroups.map((g) => [g.organizationId, g._count.id]));

    return orgs.map((org) => ({
      ...org,
      blockedBranchCount: blockedMap[org.id] || 0,
    }));
  }

  /**
   * Aggregated platform overview — powers the Super Admin dashboard in a
   * single request instead of N+1 school fetches.
   * Returns orgs with branch/user counts plus totals and per-org student counts.
   */
  async findOverview() {
    const [orgs, schools, studentGroups] = await Promise.all([
      prisma.organization.findMany({
        include: {
          users: {
            where: { role: "SUPER_ADMIN" },
            select: { username: true },
            take: 1,
          },
          branches: { select: { status: true } },
          _count: { select: { branches: true, users: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.school.findMany({
        select: {
          id: true,
          organizationId: true,
          name: true,
          code: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.student.groupBy({
        by: ["schoolId"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
    ]);

    const studentsBySchool = Object.fromEntries(
      studentGroups.map((g) => [g.schoolId, g._count._all])
    );
    const studentsByOrg = schools.reduce((acc, s) => {
      acc[s.organizationId] = (acc[s.organizationId] || 0) + (studentsBySchool[s.id] || 0);
      return acc;
    }, {});

    return { orgs, schools, studentsByOrg };
  }

  /**
   * Aggregated revenue per organization (and grand total) from fee payments.
   * Decimal amounts come back as strings — convert to numbers for the UI.
   */
  async revenueOverview() {
    const payments = await prisma.feePayment.findMany({
      select: {
        amount: true,
        feeRecord: {
          select: {
            student: {
              select: {
                school: { select: { organizationId: true } },
              },
            },
          },
        },
      },
    });

    const byOrg = {};
    let total = 0;
    for (const p of payments) {
      const orgId = p.feeRecord?.student?.school?.organizationId;
      if (!orgId) continue;
      const amount = Number(p.amount) || 0;
      byOrg[orgId] = (byOrg[orgId] || 0) + amount;
      total += amount;
    }
    return { byOrg, total };
  }

  /**
   * Organizations created per month (last `months` months) — growth trend.
   */
  async orgGrowth(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const orgs = await prisma.organization.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const buckets = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const o of orgs) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }

  /**
   * Branch-level + revenue dashboard for a single organization.
   * Returns branches with staff/student counts and monthly revenue series.
   */
  async orgDashboard(organizationId, months = 12) {
    const branches = await prisma.school.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            students: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const staff = await prisma.user.findMany({
      where: { organizationId },
      include: {
        school: { select: { id: true, name: true, logoUrl: true, organization: { select: { logoUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.feePayment.findMany({
      where: { feeRecord: { student: { school: { organizationId } } } },
      select: {
        amount: true,
        paidAt: true,
        feeRecord: {
          select: { student: { select: { schoolId: true } } },
        },
      },
    });

    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthKeys = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      monthKeys.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString("en", { month: "short" }), total: 0 });
    }

    const revenueBySchool = {};
    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const bucket = monthKeys.find((m) => m.key === key);
      if (!bucket) continue;
      const amount = Number(p.amount) || 0;
      bucket.total += amount;
      const schoolId = p.feeRecord?.student?.schoolId;
      if (schoolId) {
        revenueBySchool[schoolId] = revenueBySchool[schoolId] || {};
        revenueBySchool[schoolId][key] = (revenueBySchool[schoolId][key] || 0) + amount;
      }
    }

    const totalRevenue = monthKeys.reduce((s, m) => s + m.total, 0);

    // ── Enrollment trends (new students per month) ──────────────────
    const newStudents = await prisma.student.findMany({
      where: { school: { organizationId }, createdAt: { gte: since } },
      select: { createdAt: true, schoolId: true },
    });
    const enrollmentByMonth = {};
    for (const s of newStudents) {
      const key = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth() + 1}`;
      enrollmentByMonth[key] = (enrollmentByMonth[key] || 0) + 1;
    }

    // ── Attendance rate (present vs total per month) ─────────────────
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { student: { school: { organizationId } }, date: { gte: since } },
      select: { date: true, status: true },
    });
    const attendanceByMonth = {};
    for (const a of attendanceRecords) {
      const key = `${a.date.getFullYear()}-${a.date.getMonth() + 1}`;
      if (!attendanceByMonth[key]) attendanceByMonth[key] = { present: 0, total: 0 };
      attendanceByMonth[key].total += 1;
      if (a.status === "PRESENT" || a.status === "LATE") attendanceByMonth[key].present += 1;
    }

    // ── Fee collection vs due ───────────────────────────────────────
    const feeRecords = await prisma.feeRecord.findMany({
      where: { student: { school: { organizationId } } },
      select: { totalAmount: true, paidAmount: true, status: true },
    });
    const totalDue = feeRecords.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const totalPaid = feeRecords.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
    const totalPending = totalDue - totalPaid;

    return {
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        status: b.status,
        staffCount: b._count?.users || 0,
        studentCount: b._count?.students || 0,
        revenueSeries: monthKeys.map((m) => revenueBySchool[b.id]?.[m.key] || 0),
      })),
      revenue: {
        total: totalRevenue,
        monthly: monthKeys,
      },
      enrollment: {
        monthly: monthKeys.map((m) => ({ ...m, count: enrollmentByMonth[m.key] || 0 })),
      },
      attendance: {
        monthly: monthKeys.map((m) => {
          const a = attendanceByMonth[m.key];
          return { ...m, rate: a ? Math.round((a.present / a.total) * 100) : 0 };
        }),
      },
      fees: {
        totalDue,
        totalPaid,
        totalPending,
      },
      staff: staff.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        status: u.isActive ? "ACTIVE" : "BLOCKED",
        isActive: u.isActive,
        blockedReason: u.blockedReason || null,
        schoolId: u.schoolId,
        schoolName: u.school?.name || null,
        schoolLogoUrl: u.school?.logoUrl || u.school?.organization?.logoUrl || null,
        avatarUrl: u.avatarUrl || null,
        joinedAt: u.createdAt,
      })),
    };
  }

  async findById(id) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "SUPER_ADMIN" },
          select: { username: true },
          take: 1,
        },
        branches: { select: { status: true } },
      },
    });
  }

  async findByCode(code) {
    return await prisma.organization.findUnique({ where: { code } });
  }

  async findBySlug(slug) {
    return await prisma.organization.findUnique({ where: { slug } });
  }

  /**
   * All public slugs — ISR generateStaticParams ke liye (koi auth nahi).
   */
  async findAllPublicSlugs() {
    const orgs = await prisma.organization.findMany({
      select: { slug: true },
    });
    return orgs.map((o) => o.slug);
  }

  /**
   * Public landing data: org + uski saari branches (public page ke liye).
   */
  async findBySlugWithBranches(slug) {
    return await prisma.organization.findUnique({
      where: { slug },
      include: {
        branches: {
          select: { id: true, name: true, code: true, address: true, phone: true, logoUrl: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async update(id, data) {
    return await prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Total collected revenue for a single organization (from fee payments).
   */
  async revenueForOrganization(organizationId) {
    const payments = await prisma.feePayment.findMany({
      where: { feeRecord: { student: { school: { organizationId } } } },
      select: { amount: true },
    });
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  /**
   * Count the branches (Schools) belonging to an organization.
   */
  async countBranches(organizationId) {
    return await prisma.school.count({ where: { organizationId } });
  }

  /**
   * School health audit — returns branches with issues:
   * 1. Blocked/inactive branches
   * 2. Branches with no admin (ADMIN role user)
   * 3. Branches with zero staff (no active users at all)
   * 4. Organizations with zero branches
   */
  async schoolHealth() {
    const [blocked, noAdmin, noStaff, emptyOrgs] = await Promise.all([
      prisma.school.findMany({
        where: { status: "BLOCKED" },
        select: {
          id: true, name: true, code: true, status: true,
          blockedReason: true, blockedByName: true,
          organization: { select: { id: true, name: true } },
        },
        orderBy: { blockedAt: "desc" },
      }),
      prisma.$queryRaw`
        SELECT s.id, s.name, s.code, s."organizationId", o.name AS "orgName"
        FROM "School" s
        JOIN "Organization" o ON o.id = s."organizationId"
        WHERE s.id NOT IN (
          SELECT DISTINCT "schoolId" FROM "User"
          WHERE "schoolId" IS NOT NULL AND role = 'ADMIN'
        )
        AND s.id NOT IN (
          SELECT DISTINCT value::text FROM "User", jsonb_array_elements_text(COALESCE("branchAccess", '[]'::jsonb)) WHERE role = 'ADMIN'
        )
        ORDER BY o.name, s.name
      `,
      prisma.$queryRaw`
        SELECT s.id, s.name, s.code, s."organizationId", o.name AS "orgName"
        FROM "School" s
        JOIN "Organization" o ON o.id = s."organizationId"
        WHERE s.id NOT IN (
          SELECT DISTINCT "schoolId" FROM "User"
          WHERE "schoolId" IS NOT NULL AND "isActive" = true
        )
        ORDER BY o.name, s.name
      `,
      prisma.organization.findMany({
        where: { branches: { none: {} } },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      blocked,
      noAdmin: (noAdmin ?? []).map((r) => ({
        id: r.id, name: r.name, code: r.code,
        organization: { id: r.organizationId, name: r.orgName },
      })),
      noStaff: (noStaff ?? []).map((r) => ({
        id: r.id, name: r.name, code: r.code,
        organization: { id: r.organizationId, name: r.orgName },
      })),
      emptyOrgs,
    };
  }
}

export default new OrganizationRepository();