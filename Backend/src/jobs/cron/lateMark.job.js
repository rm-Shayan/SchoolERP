import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import leaveService from "../../modules/leave/leave.service.js";
import portalNotificationService from "../../modules/notification/notification.portalService.js";

const logger = new Logger("late-mark-job");

function minutesOf(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Local (server tz) YYYY-MM-DD — matches School.offDays dates users pick. */
function localDateKey(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Skip when today is a weekly-off day (School.weeklyOff) or a holiday (School.offDays). */
function isOffDay(school, today) {
  const weeklyOff = Array.isArray(school.weeklyOff) ? school.weeklyOff : [0, 6];
  if (weeklyOff.includes(today.getDay())) return true;
  const offSet = new Set((school.offDays || []).map((o) => o?.date));
  return offSet.has(localDateKey(today));
}

/**
 * Auto attendance marking — per-school configurable times.
 * Runs every 15 min (Mon-Sat, 7AM-6PM).
 *
 * Flow per school:
 *   1. At attendanceCutoffTime → unmarked students marked LATE
 *   2. At attendanceAbsentTime → students still LATE (no check-in) → ABSENT
 *
 * Each step has its own Redis dedup key (once per school per date).
 */
export async function runLateMarkJob() {
  logger.logger.info("[LateMark] Starting attendance automation sweep...");
  const now = new Date();
  // DATE column UTC-midnight convention: local calendar day ka UTC start
  // (nahi to local-midnight instants UTC me previous date par save hote the).
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dateKey = today.toISOString().split("T")[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let totalLate = 0;
  let totalAbsent = 0;

  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true, name: true,
        attendanceStartTime: true,
        attendanceCutoffTime: true,
        attendanceAbsentTime: true,
        weeklyOff: true,
        offDays: true,
      },
    });

    for (const school of schools) {
      // Weekly off (weekend) or holiday set → school closed, do NOT auto-mark absent.
      if (isOffDay(school, today)) continue;

      const startMin = minutesOf(school.attendanceStartTime || "07:45");
      const cutoffMin = minutesOf(school.attendanceCutoffTime || "08:30");
      const absentMin = minutesOf(school.attendanceAbsentTime || "10:00");

      // Skip if before attendance start time
      if (nowMin < startMin) continue;

      // === STEP 1: Mark LATE after cutoffTime ===
      if (nowMin >= cutoffMin) {
        const lateKey = `late_mark:${school.id}:${dateKey}`;
        try {
          if (!(await redis.get(lateKey))) {
            const marked = await markStudentsWithStatus(school, today, "LATE", school.attendanceCutoffTime);
            totalLate += marked;
            try { await redis.setEx(lateKey, 86400, "sent"); } catch (_) {}
            if (marked > 0) {
              emitToRoom(`school:${school.id}`, "auto_late_completed", { schoolId: school.id, count: marked, date: today });
            }
          }
        } catch (_) {}
      }

      // === STEP 2: Upgrade LATE → ABSENT after absentTime ===
      if (nowMin >= absentMin) {
        const absentKey = `absent_mark:${school.id}:${dateKey}`;
        try {
          if (!(await redis.get(absentKey))) {
            const upgraded = await markLateToAbsent(school, today, school.attendanceAbsentTime);
            totalAbsent += upgraded.length;
            // Auto-absent ke baad parent/student portal notification (har bachche ka)
            for (const stu of upgraded) {
              await notifyAbsentToPortal(school, stu, school.attendanceAbsentTime).catch(() => {});
            }
            try { await redis.setEx(absentKey, 86400, "sent"); } catch (_) {}
            if (upgraded.length > 0) {
              emitToRoom(`school:${school.id}`, "auto_absent_completed", { schoolId: school.id, count: upgraded.length, date: today });
            }
          }
        } catch (_) {}
      }
    }

    logger.logger.info(`[LateMark] Done. LATE: ${totalLate}, ABSENT: ${totalAbsent}`);
    return { success: true, totalLate, totalAbsent };
  } catch (error) {
    logger.logger.error(`[LateMark] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Mark unmarked active students with a given status (LATE or ABSENT).
 * Skips students who already have an attendance record or are on approved leave.
 */
async function markStudentsWithStatus(school, today, status, cutoffTime) {
  const activeStudents = await prisma.student.findMany({
    where: { schoolId: school.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (activeStudents.length === 0) return 0;

  const existing = await prisma.attendanceRecord.findMany({
    where: { date: today, student: { schoolId: school.id } },
    select: { studentId: true, status: true },
  });
  const markedSet = new Set(existing.map((a) => a.studentId));

  let marked = 0;
  for (const s of activeStudents) {
    if (markedSet.has(s.id)) continue;
    const onLeave = await leaveService.hasApprovedLeave(s.id, today);
    if (onLeave) continue;

    const remark = status === "LATE"
      ? `Auto LATE — no check-in by cutoff ${cutoffTime}`
      : `Auto ABSENT — no check-in by ${cutoffTime}`;

    await prisma.attendanceRecord.create({
      data: { studentId: s.id, date: today, status, remarks: remark },
    });
    marked++;
  }
  return marked;
}

/**
 * Upgrade students still marked LATE → ABSENT if they never checked in.
 * Only touches records that are LATE and have NO checkIn time.
 * Returns upgraded students (id, name, class) taake portal notification ho sake.
 */
async function markLateToAbsent(school, today, absentTime) {
  const lateNoCheckin = await prisma.attendanceRecord.findMany({
    where: {
      date: today,
      status: "LATE",
      checkIn: null,
      student: { schoolId: school.id },
    },
    select: {
      id: true,
      student: {
        select: {
          id: true, firstName: true, lastName: true,
          section: { select: { name: true, class: { select: { name: true } } } },
        },
      },
    },
  });
  if (lateNoCheckin.length === 0) return [];

  await prisma.attendanceRecord.updateMany({
    where: { id: { in: lateNoCheckin.map((r) => r.id) } },
    data: {
      status: "ABSENT",
      remarks: `Upgraded to ABSENT — no check-in by ${absentTime}`,
    },
  });
  return lateNoCheckin.map((r) => r.student);
}

/** Auto-absent hone par har affected student ke liye portal notification. */
async function notifyAbsentToPortal(school, stu, absentTime) {
  const name = `${stu.firstName} ${stu.lastName}`.trim();
  const className = `${stu.section?.class?.name || ""} ${stu.section?.name || ""}`.trim();
  return portalNotificationService.create({
    schoolId: school.id,
    senderName: "Attendance System",
    title: "ATTENDANCE_ABSENT",
    body: `${name}${className ? ` (${className})` : ""} was marked ABSENT — no check-in recorded by ${absentTime}.`,
    category: "STUDENT",
    refType: "ATTENDANCE",
    refId: stu.id,
    link: "/attendance",
  });
}

export default runLateMarkJob;

/**
 * Startup catchup — server restart par agar aaj ka late/absent mark nahi hua
 * to wo complete karo. node-cron missed executions recover nahi karta, is liye
 * ye function server boot pe ek baar chalta hai.
 *
 * Flow:
 *   1. Har school ke liye check karo ke aaj LATE mark hua ya nahi
 *   2. Agar nahi hua aur current time cutoff se baad hai → LATE mark karo
 *   3. Agar LATE mark ho chuka hai lekin ABSENT nahi hua aur absent time baad
 *      hai → LATE → ABSENT upgrade karo
 *   4. Redis dedup keys set karo taake regular cron duplicate na chalaye
 */
export async function runStartupCatchup() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dateKey = today.toISOString().split("T")[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const schools = await prisma.school.findMany({
    select: {
      id: true, name: true,
      attendanceCutoffTime: true,
      attendanceAbsentTime: true,
      weeklyOff: true,
      offDays: true,
    },
  });

  let totalLate = 0;
  let totalAbsent = 0;

  for (const school of schools) {
    if (isOffDay(school, today)) continue;

    const cutoffMin = minutesOf(school.attendanceCutoffTime || "08:30");
    const absentMin = minutesOf(school.attendanceAbsentTime || "10:00");

    // STEP 1: Agar cutoff time baad hai aur LATE mark nahi hua
    if (nowMin >= cutoffMin) {
      const lateKey = `late_mark:${school.id}:${dateKey}`;
      try {
        if (!(await redis.get(lateKey))) {
          const marked = await markStudentsWithStatus(school, today, "LATE", school.attendanceCutoffTime);
          totalLate += marked;
          try { await redis.setEx(lateKey, 86400, "sent"); } catch (_) {}
          if (marked > 0) {
            logger.logger.info(`[Startup Catchup] ${school.name}: marked ${marked} students LATE`);
            emitToRoom(`school:${school.id}`, "auto_late_completed", { schoolId: school.id, count: marked, date: today });
          }
        }
      } catch (err) {
        logger.logger.error(`[Startup Catchup] ${school.name} LATE error: ${err.message}`);
      }
    }

    // STEP 2: Agar absent time baad hai aur ABSENT mark nahi hua
    if (nowMin >= absentMin) {
      const absentKey = `absent_mark:${school.id}:${dateKey}`;
      try {
        if (!(await redis.get(absentKey))) {
          const upgraded = await markLateToAbsent(school, today, school.attendanceAbsentTime);
          totalAbsent += upgraded.length;
          for (const stu of upgraded) {
            await notifyAbsentToPortal(school, stu, school.attendanceAbsentTime).catch(() => {});
          }
          try { await redis.setEx(absentKey, 86400, "sent"); } catch (_) {}
          if (upgraded.length > 0) {
            logger.logger.info(`[Startup Catchup] ${school.name}: upgraded ${upgraded.length} students to ABSENT`);
            emitToRoom(`school:${school.id}`, "auto_absent_completed", { schoolId: school.id, count: upgraded.length, date: today });
          }
        }
      } catch (err) {
        logger.logger.error(`[Startup Catchup] ${school.name} ABSENT error: ${err.message}`);
      }
    }
  }

  if (totalLate > 0 || totalAbsent > 0) {
    logger.logger.info(`[Startup Catchup] Done. LATE: ${totalLate}, ABSENT: ${totalAbsent}`);
  } else {
    logger.logger.info("[Startup Catchup] No missed attendance jobs for today.");
  }
}
