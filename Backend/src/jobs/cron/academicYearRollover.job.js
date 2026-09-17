import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { cacheDel } from "../../lib/utils/cache.js";

const logger = new Logger("academic-year-rollover-job");

/** Same-month-same-day start/end ke liye inclusive month-span (e.g. Apr1-Mar31 = 12). */
function monthSpan(start, end) {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() - start.getUTCMonth() + 1
  );
}

function addDaysUTC(d, days) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function addMonthsUTC(d, months) {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** DATE column UTC-midnight convention (same as attendance/lateMark jobs). */
function startOfUTCDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayFloor(d) {
  return Math.floor(d.getTime() / 86400000);
}

/**
 * Academic Year auto-rollover (daily 00:10 AM — scheduler.service.js).
 *
 * Har school ke liye:
 *   1. Agar koi year startDate >= aaj (yaani naya year pehle se exists) → skip.
 *   2. Warna latest year (startDate desc) khatam ho chuka? → NAYA year banao:
 *      - startDate = purana endDate + 1 din
 *      - duration = purane year ka month-span (same pattern maintain)
 *      - endDate = startDate + duration months - 1 din
 *      - name = "2026-2027" (start/end years)
 *      - Naya year isCurrent=true, baaki saare isCurrent=false.
 *
 * Prisma date fields local-midnight strings store hone par UTC-midnight ke
 * usul par already hain — compare day-floor se hota hai.
 */
export async function runAcademicYearRolloverJob() {
  const now = new Date();
  const todayStart = startOfUTCDay(now);
  let created = 0;

  try {
    const schools = await prisma.school.findMany({ select: { id: true, name: true } });

    for (const school of schools) {
      const years = await prisma.academicYear.findMany({
        where: { schoolId: school.id },
        orderBy: { startDate: "desc" },
      });
      if (years.length === 0) continue;

      // Naya year already exists (aaj ya aage se start hua) → kuch nahi karna.
      const nextStarted = years.some(
        (y) => startOfUTCDay(new Date(y.startDate)) >= todayStart
      );
      if (nextStarted) continue;

      const prev = years[0]; // latest started year
      const prevStart = startOfUTCDay(new Date(prev.startDate));
      const prevEnd = startOfUTCDay(new Date(prev.endDate));

      // Abhi bhi chal raha hai / aaj tak effective hai → rollover nahi.
      if (dayFloor(prevEnd) >= dayFloor(todayStart)) continue;

      // Purane year ka wohi duration pattern naye year par lagao.
      const months = Math.max(1, monthSpan(prevStart, prevEnd));
      const startDate = addDaysUTC(prevEnd, 1);
      const endDate = addDaysUTC(addMonthsUTC(startDate, months), -1);
      const name = `${startDate.getUTCFullYear()}-${endDate.getUTCFullYear()}`;

      await prisma.academicYear.updateMany({
        where: { schoolId: school.id },
        data: { isCurrent: false },
      });
      await prisma.academicYear.create({
        data: { schoolId: school.id, name, startDate, endDate, isCurrent: true },
      });
      await cacheDel(`academic:years:${school.id}`);
      created++;

      logger.logger.info(
        `[AcYear] ${school.name}: rolled over "${prev.name}" (${months} months) → "${name}" ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`
      );
    }

    logger.logger.info(`[AcYear] Done. Auto-created ${created} academic year(s).`);
    return { success: true, created };
  } catch (error) {
    logger.logger.error(`[AcYear] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runAcademicYearRolloverJob;