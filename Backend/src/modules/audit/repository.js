import prisma from "../../config/db.js";

class AuditRepository {
  async create(entry) {
    return prisma.auditLog.create({ data: entry });
  }

  async list({ where, page, pageSize }) {
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async exportCsv({ where, limit = 5000 }) {
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        actorName: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityName: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  }
}

export default new AuditRepository();
