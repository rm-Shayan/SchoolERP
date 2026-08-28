import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import leaveService from "../../modules/leave/leave.service.js";

const logger = new Logger("late-mark-job");

function minutesOf(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
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
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
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
      },
    });

    for (const school of schools) {
      const startMin = minutesOf(school.attendanceStartTime || "07:45");
      const cutoffMin = minutesOf(school.attendanceCutoffTime || "08:30");
      const absentMin = minutesOf(school.attendanceAbsentTime || "10:00");

      // Skip if before attendance start time
      if (nowMin < startMin) continue;

      // === STEP 1: Mark LATE after cutoffTime ===
      if (nowMin >= cutoffMin && nowMin <= cutoffMin + 60) {
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
      if (nowMin >= absentMin && nowMin <= absentMin + 60) {
        const absentKey = `absent_mark:${school.id}:${dateKey}`;
        try {
          if (!(await redis.get(absentKey))) {
            const marked = await markLateToAbsent(school, today, school.attendanceAbsentTime);
            totalAbsent += marked;
            try { await redis.setEx(absentKey, 86400, "sent"); } catch (_) {}
            if (marked > 0) {
              emitToRoom(`school:${school.id}`, "auto_absent_completed", { schoolId: school.id, count: marked, date: today });
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
 */
async function markLateToAbsent(school, today, absentTime) {
  const lateNoCheckin = await prisma.attendanceRecord.findMany({
    where: {
      date: today,
      status: "LATE",
      checkIn: null,
      student: { schoolId: school.id },
    },
    select: { id: true },
  });
  if (lateNoCheckin.length === 0) return 0;

  await prisma.attendanceRecord.updateMany({
    where: { id: { in: lateNoCheckin.map((r) => r.id) } },
    data: {
      status: "ABSENT",
      remarks: `Upgraded to ABSENT — no check-in by ${absentTime}`,
    },
  });
  return lateNoCheckin.length;
}

export default runLateMarkJob;
