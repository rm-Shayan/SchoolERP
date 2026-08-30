import prisma from "../../config/db.js";
import redis from "../../config/redis.js";

export const getDailyReport = async (schoolId, dateStr) => {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const dateKey = targetDate.toISOString().split("T")[0];
  const cacheKey = `staff-attendance:daily:${schoolId}:${dateKey}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  const allStaff = await prisma.user.findMany({
    where: { schoolId, isActive: true, role: { notIn: ["SUPER_ADMIN"] } },
    select: { id: true, name: true, email: true, role: true, username: true, phone: true, avatarUrl: true },
  });

  const records = await prisma.staffAttendance.findMany({ where: { schoolId, date: targetDate } });
  const recordMap = {};
  records.forEach((r) => { recordMap[r.staffId] = r; });

  const staffWithAttendance = allStaff.map((s) => ({ ...s, attendance: recordMap[s.id] || null }));
  const summary = {
    date: targetDate,
    totalStaff: allStaff.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    leave: records.filter((r) => r.status === "LEAVE").length,
    unmarked: allStaff.length - records.length,
  };

  const result = { summary, staff: staffWithAttendance };
  try { await redis.setEx(cacheKey, 300, JSON.stringify(result)); } catch (_) {}
  return result;
};

export const getMonthlyReport = async (schoolId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [records, school] = await Promise.all([
    prisma.staffAttendance.findMany({
      where: { schoolId, date: { gte: startDate, lte: endDate } },
      include: { staff: { select: { id: true, name: true, role: true, username: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.school.findFirst({ where: { id: schoolId }, select: { weeklyOff: true } }),
  ]);

  const byStaff = {};
  records.forEach((r) => {
    if (!byStaff[r.staffId]) {
      byStaff[r.staffId] = {
        staff: r.staff,
        days: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0, MANUAL_OVERRIDE: 0 },
        total: 0,
      };
    }
    byStaff[r.staffId].days[r.status] = (byStaff[r.staffId].days[r.status] || 0) + 1;
    byStaff[r.staffId].total++;
  });

  const weeklyOff = Array.isArray(school?.weeklyOff) ? school.weeklyOff : [0, 6];
  return { month, year, weeklyOff, records: Object.values(byStaff) };
};

export const getMyAttendance = async (staffId, { startDate, endDate } = {}) => {
  const where = { staffId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const records = await prisma.staffAttendance.findMany({ where, orderBy: { date: "desc" } });
  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    leave: records.filter((r) => r.status === "LEAVE").length,
  };

  return { records, summary };
};
