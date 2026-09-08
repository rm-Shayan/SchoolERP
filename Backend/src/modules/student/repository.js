import prisma from "../../config/db.js";
import redis from "../../config/redis.js";

function redisGet(key) {
  try { return redis.get(key).then(JSON.parse).catch(() => null); } catch { return null; }
}
function redisSetEx(key, ttl, value) {
  try { return redis.setEx(key, ttl, JSON.stringify(value)).catch(() => {}); } catch { /* fail silently */ }
}

class StudentRepository {
  // ── Parents ────────────────────────────────────────────────────
  async findParentById(id) {
    return prisma.parent.findUnique({ where: { id } });
  }

  async upsertParent(data, client = prisma) {
    return client.parent.upsert({
      where: { whatsappNo: data.whatsappNo },
      update: {
        name: data.name || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      },
      create: data,
    });
  }

  async updateParent(id, data) {
    return prisma.parent.update({ where: { id }, data });
  }

  // ── Students ───────────────────────────────────────────────────
  // NOTE: `client = prisma` param — interactive transaction me tx client pass
  // karo taake capacity check + insert ek hi transaction me ho (race-safe).
  async createStudent(data, client = prisma) {
    return client.student.create({ data });
  }

  async findStudentById(id) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            // Org branding — ID slip theme-wise banane ke liye
            organization: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
          },
        },
        section: { include: { class: true } },
        parent: true,
      },
    });
  }

  async findStudentByIdentifierCode(identifierCode) {
    return prisma.student.findUnique({ where: { identifierCode } });
  }

  async findRollNumberInSchool(schoolId, rollNumber, excludeId, client = prisma) {
    return client.student.findFirst({
      where: {
        schoolId,
        rollNumber,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }

  async updateStudent(id, data, client = prisma) {
    return client.student.update({ where: { id }, data });
  }

  // Hard delete — cascades attendance/fees/exams/conduct/promotions via schema.
  async deleteStudent(id, client = prisma) {
    return client.student.delete({ where: { id } });
  }

  async countStudentsByParent(parentId, client = prisma) {
    return client.student.count({ where: { parentId } });
  }

  async deleteParent(parentId, client = prisma) {
    return client.parent.delete({ where: { id: parentId } });
  }

  async listStudents({ schoolId, sectionId, classId, status, search, page, pageSize }) {
    const where = { schoolId };

    if (sectionId) where.sectionId = sectionId;
    if (classId) where.section = { classId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { identifierCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // NOTE: avoid per-row _count aggregates (attendance/fee) here — they scan
    // huge tables and are not used by the directory UI. A single status
    // groupBy + one blocked count feed the dashboard stat cards cheaply.
    const [items, total, statusCounts, blockedCount] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          section: { include: { class: true } },
          parent: { select: { id: true, name: true, whatsappNo: true, phone: true, email: true } },
        },
        orderBy: [{ rollNumber: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where }),
      prisma.student.groupBy({ by: ["status"], where: { schoolId }, _count: { _all: true } }),
      prisma.student.count({ where: { schoolId, isBlocked: true } }),
    ]);

    const summary = { total: 0, ACTIVE: 0, GRADUATED: 0, DROPPED_OUT: 0, TRANSFERRED_OUT: 0, blocked: blockedCount };
    for (const row of statusCounts) {
      summary[row.status] = row._count._all;
      summary.total += row._count._all;
    }

    return { items, total, page, pageSize, summary };
  }

  async listActiveStudentsBySection(sectionId) {
    return prisma.student.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { parent: true },
      orderBy: { rollNumber: "asc" },
    });
  }

  async countActiveBySchool(schoolId) {
    return prisma.student.count({ where: { schoolId, status: "ACTIVE" } });
  }

  /**
   * Platform-wide student listing (SUPER_ADMIN only).
   * Filters: organizationId, schoolId, classId, sectionId, status, search.
   */
  async listAllStudentsPlatform({ organizationId, schoolId, classId, sectionId, status, search, page = 1, pageSize = 50 } = {}) {
    const where = {};
    if (organizationId) where.school = { organizationId };
    if (schoolId) where.schoolId = schoolId;
    if (sectionId) where.sectionId = sectionId;
    else if (classId) where.section = { classId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { identifierCode: { contains: search, mode: "insensitive" } },
        { parent: { whatsappNo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, code: true, organization: { select: { id: true, name: true } } } },
          section: { include: { class: true } },
          parent: { select: { id: true, name: true, whatsappNo: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async sectionExists(sectionId, client = prisma) {
    return client.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }
}

export default new StudentRepository();
