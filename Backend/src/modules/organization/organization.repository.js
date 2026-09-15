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
    // Pehle saare FeePayment rows fetch hokar JS me sum hote the — ab SQL-side
    // grouped aggregation (org per total). Decimal amounts float8 → number.
    const rows = await prisma.$queryRaw`
      SELECT s."organizationId" AS "orgId",
             SUM(fp."amount")::float8 AS "total"
      FROM "FeePayment" fp
      JOIN "FeeRecord" f ON f."id" = fp."feeRecordId"
      JOIN "Student" st ON st."id" = f."studentId"
      JOIN "School" s ON s."id" = st."schoolId"
      GROUP BY s."organizationId"
    `;

    const byOrg = {};
    let total = 0;
    for (const r of rows) {
      byOrg[r.orgId] = r.total;
      total += r.total;
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

    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthKeys = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      monthKeys.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString("en", { month: "short" }), total: 0 });
    }

    // Payments / enrollment / attendance / fees sab pehle Node me poora fetch
    // hokar JS loops se aggregate hote the — ab ye 4 kaam SQL-side GROUP BY me.
    const [staff, paymentRows, enrollmentRows, attendanceRows, feeRows] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId },
        include: {
          school: { select: { id: true, name: true, logoUrl: true, organization: { select: { logoUrl: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.$queryRaw`
        SELECT to_char(fp."paidAt", 'YYYY-MM') AS "month",
               s."id" AS "schoolId",
               SUM(fp."amount")::float8 AS "amount"
        FROM "FeePayment" fp
        JOIN "FeeRecord" f ON f."id" = fp."feeRecordId"
        JOIN "Student" st ON st."id" = f."studentId"
        JOIN "School" s ON s."id" = st."schoolId"
        WHERE s."organizationId" = ${organizationId}
          AND fp."paidAt" >= ${since}
        GROUP BY "month", s."id"
      `,
      prisma.$queryRaw`
        SELECT to_char("createdAt", 'YYYY-MM') AS "month", COUNT(*)::int AS "count"
        FROM "Student"
        WHERE "schoolId" IN (SELECT "id" FROM "School" WHERE "organizationId" = ${organizationId})
          AND "createdAt" >= ${since}
        GROUP BY "month"
      `,
      prisma.$queryRaw`
        SELECT to_char(AR."date", 'YYYY-MM') AS "month",
               COUNT(*)::int AS "total",
               COUNT(*) FILTER (WHERE AR."status" IN ('PRESENT', 'LATE'))::int AS "present"
        FROM "AttendanceRecord" AR
        JOIN "Student" st ON st."id" = AR."studentId"
        WHERE st."schoolId" IN (SELECT "id" FROM "School" WHERE "organizationId" = ${organizationId})
          AND AR."date" >= ${since}
        GROUP BY "month"
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(f."totalAmount"), 0)::float8 AS "totalDue",
               COALESCE(SUM(f."paidAmount"), 0)::float8 AS "totalPaid"
        FROM "FeeRecord" f
        WHERE f."studentId" IN (
          SELECT "id" FROM "Student"
          WHERE "schoolId" IN (SELECT "id" FROM "School" WHERE "organizationId" = ${organizationId})
        )
      `,
    ]);

    const revenueBySchool = {};
    for (const r of paymentRows) {
      for (const m of monthKeys) {
        if (m.key === r.month) m.total += r.amount;
      }
      revenueBySchool[r.schoolId] = revenueBySchool[r.schoolId] || {};
      revenueBySchool[r.schoolId][r.month] = (revenueBySchool[r.schoolId][r.month] || 0) + r.amount;
    }

    const totalRevenue = monthKeys.reduce((s, m) => s + m.total, 0);

    // ── Enrollment trends (new students per month) ──────────────────
    const enrollmentByMonth = {};
    for (const r of enrollmentRows) enrollmentByMonth[r.month] = r.count;

    // ── Attendance rate (present vs total per month) ─────────────────
    const attendanceByMonth = {};
    for (const r of attendanceRows) attendanceByMonth[r.month] = { present: r.present, total: r.total };

    // ── Fee collection vs due ───────────────────────────────────────
    const fee = feeRows[0] || {};
    const totalDue = fee.totalDue || 0;
    const totalPaid = fee.totalPaid || 0;
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
    // FeePayment rows Node me load karke sum karne ke bajaye SQL-side aggregate.
    const rows = await prisma.$queryRaw`
      SELECT COALESCE(SUM(fp."amount"), 0)::float8 AS "total"
      FROM "FeePayment" fp
      JOIN "FeeRecord" f ON f."id" = fp."feeRecordId"
      JOIN "Student" st ON st."id" = f."studentId"
      JOIN "School" s ON s."id" = st."schoolId"
      WHERE s."organizationId" = ${organizationId}
    `;
    return rows[0].total || 0;
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