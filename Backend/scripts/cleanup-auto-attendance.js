/**
 * Clean stale AUTO-marked attendance records that fell on off days.
 *
 * History: before per-school weeklyOff existed, the auto-mark cron ran
 * Mon–Sat and had no guard — so every school got LATE→ABSENT records on
 * Saturdays (default weekend) as well as on holidays. This removes only
 * cron-generated records (remarks "Auto ..." / "Upgraded to ABSENT") whose
 * date is a weekly-off day or a holiday for that school. Manual marks are
 * left untouched.
 *
 * Usage:
 *   node --env-file=.env scripts/cleanup-auto-attendance.js
 */
import prisma from "../src/config/db.js";

const p = (n) => String(n).padStart(2, "0");
const localKey = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

async function main() {
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, weeklyOff: true, offDays: true },
  });

  let total = 0;
  for (const school of schools) {
    const weekly = new Set(Array.isArray(school.weeklyOff) ? school.weeklyOff : [0, 6]);
    const offSet = new Set((school.offDays || []).map((o) => o?.date));

    const candidates = await prisma.attendanceRecord.findMany({
      where: {
        student: { schoolId: school.id },
        OR: [{ remarks: { startsWith: "Auto" } }, { remarks: { startsWith: "Upgraded" } }],
      },
      select: { id: true, date: true, remarks: true },
    });

    const bad = candidates.filter((r) => weekly.has(r.date.getDay()) || offSet.has(localKey(r.date)));
    if (bad.length === 0) continue;

    const ids = bad.map((r) => r.id);
    const res = await prisma.attendanceRecord.deleteMany({ where: { id: { in: ids } } });
    total += res.count;
    console.log(`[${school.name}] removed ${res.count} auto records on off days (of ${candidates.length} candidates)`);
  }

  console.log(`DONE — removed ${total} stale auto attendance records total`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });