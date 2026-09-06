import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../../modules/notification/notification.portalService.js";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import leaveService from "../../modules/leave/leave.service.js";

const logger = new Logger("attendance-alert-job");

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
 * Attendance alert — per-school `attendanceAlertTime`.
 * Runs every 15 min. At/after the configured alert time (within a 45-min
 * window) parents + admins are notified about:
 *   - students marked LATE today, and
 *   - students with no check-in at all (absent).
 * Redis dedup: once per school per date. No auto-ABSENT marking here — the
 * system only records LATE (lateMark job) and alerts; history is preserved.
 */
export async function runAttendanceAlertJob() {
  logger.logger.info("[AttAlert] Starting attendance alert sweep...");
  const now = new Date();
  // DATE column UTC-midnight convention (see lateMark.job.js)
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dateKey = today.toISOString().split("T")[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let totalAlerts = 0;

  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, attendanceAlertTime: true, weeklyOff: true, offDays: true },
    });

    for (const school of schools) {
      // Weekly off (weekend) or holiday set → school closed, no absent/late alerts.
      if (isOffDay(school, today)) continue;

      const alertMin = minutesOf(school.attendanceAlertTime || "09:30");
      if (nowMin < alertMin) continue;

      const sentKey = `att_alert:${school.id}:${dateKey}`;
      try {
        if (await redis.get(sentKey)) continue;
      } catch (_) {}

      const activeStudents = await prisma.student.findMany({
        where: { schoolId: school.id, status: "ACTIVE" },
        include: {
          parent: { select: { id: true, name: true, whatsappNo: true, phone: true, email: true } },
          section: { include: { class: { select: { name: true } } } },
        },
      });
      if (activeStudents.length === 0) {
        try { await redis.setEx(sentKey, 86400, "no_students"); } catch (_) {}
        continue;
      }

      const records = await prisma.attendanceRecord.findMany({
        where: { date: today, student: { schoolId: school.id } },
        select: { studentId: true, status: true },
      });
      const byStudent = new Map();
      for (const r of records) byStudent.set(r.studentId, r.status);

      // Siblings ek hi parent/email par aate hain — absent emails ko parent
      // email se group karo taake 2 bachay hon to EK mail me dono ka zikr ho.
      const absentByEmail = new Map();

      for (const student of activeStudents) {
        const name = `${student.firstName} ${student.lastName}`;
        const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();
        const status = byStudent.get(student.id);
        const isLate = status === "LATE";
        const isAbsent = status === "ABSENT";
        if (!isLate && !isAbsent) continue;

        if (isLate) {
          const message = `Dear ${student.parent?.name || "Parent"}, your child ${name} (${className}) arrived after the attendance cutoff today.`;
          notificationService.notifyParentPortal({
            schoolId: school.id,
            message,
            title: `Attendance Alert — Late`,
            details: [
              ["Student", name],
              ["Class", className || "—"],
              ["Status", "Late"],
            ],
          }).catch(() => {});
        } else if (student.parent?.email) {
          const key = student.parent.email.trim().toLowerCase();
          if (!absentByEmail.has(key)) {
            absentByEmail.set(key, { parentName: student.parent.name, parentPhone: student.parent.phone, kids: [] });
          }
          absentByEmail.get(key).kids.push({ name, className });
        }
        // Portal notification — branch feed me alert dikhe (har bachche ke liye).
        portalNotificationService.create({
          schoolId: school.id,
          senderName: "Attendance Alert",
          title: isAbsent ? "ATTENDANCE_ABSENT" : "ATTENDANCE_LATE",
          body: `${name}${className ? ` (${className})` : ""} is ${isAbsent ? "ABSENT" : "LATE"} today.`,
          category: "STUDENT",
          refType: "ATTENDANCE",
          refId: student.id,
          link: "/attendance",
        }).catch(() => {});
        totalAlerts++;
      }

      // Har parent email ko EK combined email — saare absent bachay list karke.
      for (const [email, group] of absentByEmail) {
        const kids = group.kids.map((k) => `${k.name} (${k.className || "—"})`).join(", ");
        const plural = group.kids.length > 1;
        const message = `Dear ${group.parentName || "Parent"}, ${plural ? "your children" : "your child"} ${kids} ${plural ? "have" : "has"} no attendance check-in recorded today. If this is unexpected, please contact the school office.`;
        notificationService.notifyParent({
          schoolId: school.id,
          parentEmail: email,
          parentPhone: group.parentPhone,
          message,
          title: `Attendance Alert — Absent`,
          details: group.kids.map((k) => ["Student", k.name]),
        }).catch(() => {});
      }

      // Dedup key SIRF tab set karo jab koi parent email actually bheji gayi.
      // lateMark job LATE→ABSENT upgrade absentTime par karta hai (default
      // 10:00), alertTime (default 09:30) se BAAD. Agar pehli pass par koi
      // ABSENT na ho to key set karne ka matlab hai absent wale parents ko
      // din bhar mail na mile. Isliye jab tak koi absent-email dispatch na ho,
      // alert job har 15-min tick par dobara chalti hai aur updgrade hone ke
      // baad email karti hai.
      if (absentByEmail.size > 0) {
        try { await redis.setEx(sentKey, 86400, "sent"); } catch (_) {}
      }
      if (absentByEmail.size > 0) {
        emitToRoom(`school:${school.id}`, "attendance_alert_completed", {
          schoolId: school.id,
          date: today,
        });
      }
    }

    logger.logger.info(`[AttAlert] Done. Sent ${totalAlerts} attendance alert(s).`);
    return { success: true, totalAlerts };
  } catch (error) {
    logger.logger.error(`[AttAlert] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runAttendanceAlertJob;
