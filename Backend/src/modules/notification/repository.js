import prisma from "../../config/db.js";

class NotificationRepository {
  async getDeliveryStatus(schoolId, { fromDate, toDate }) {
    const where = {};
    if (schoolId) where.schoolId = schoolId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const groups = await prisma.notificationLog.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const summary = groups.reduce((acc, g) => {
      acc[g.status.toLowerCase()] = g._count._all;
      return acc;
    }, { sent: 0, delivered: 0, pending: 0, failed: 0 });

    const total = groups.reduce((s, g) => s + g._count._all, 0);

    // Channel split (email vs future whatsapp/sms)
    const channelGroups = await prisma.notificationLog.groupBy({
      by: ["channel"],
      where,
      _count: { _all: true },
    });
    const byChannel = channelGroups.reduce((acc, g) => {
      acc[g.channel.toLowerCase()] = g._count._all;
      return acc;
    }, {});

    return { summary: { total, ...summary }, byChannel };
  }

  async listLogs(schoolId, { allBranches, status, channel, page, pageSize }) {
    const where = {};
    // SUPER_ADMIN bina schoolId → all-branches delivery-health feed:
    // saare branches ka data, lekin sirf FAILED (baaki logs branch-level
    // noise hain). Specific schoolId par us branch ke poore logs.
    if (!allBranches && schoolId) where.schoolId = schoolId;
    if (allBranches && !status) status = "FAILED";
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [items, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          school: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.notificationLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

export default new NotificationRepository();
