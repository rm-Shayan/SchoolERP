import prisma from "../../config/db.js";

class ActivityRepository {
  async createActivity(data) {
    return prisma.activity.create({ data });
  }

  async findActivityById(id) {
    return prisma.activity.findUnique({
      where: { id },
      include: { school: { select: { id: true, name: true } } },
    });
  }

  async updateActivity(id, data) {
    return prisma.activity.update({ where: { id }, data });
  }

  async deleteActivity(id) {
    return prisma.activity.delete({ where: { id } });
  }

  async listActivitiesBySchool(schoolId, { fromDate, page, pageSize }) {
    const where = { schoolId };
    if (fromDate) where.eventDate = { gte: new Date(fromDate) };

    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { eventDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

export default new ActivityRepository();
