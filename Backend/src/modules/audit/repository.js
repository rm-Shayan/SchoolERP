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
}

export default new AuditRepository();
