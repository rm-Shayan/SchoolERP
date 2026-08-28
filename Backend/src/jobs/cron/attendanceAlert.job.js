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
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dateKey = today.toISOString().split("T")[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let totalAlerts = 0;

  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, attendanceAlertTime: true },
    });

    for (const school of schools) {
      const alertMin = minutesOf(school.attendanceAlertTime || "09:30");
      if (nowMin < alertMin) continue;
      if (nowMin > alertMin + 45) continue;

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

      for (const student of activeStudents) {
        const name = `${student.firstName} ${student.lastName}`;
        const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();
        const status = byStudent.get(student.id);
        const isLate = status === "LATE";
        const isAbsent = status === "ABSENT";
        if (!isLate && !isAbsent) continue;

        const alertType = isLate ? "Late" : "Absent";
        const message = isLate
          ? `Dear ${student.parent?.name || "Parent"}, your child ${name} (${className}) arrived after the attendance cutoff today.`
          : `Dear ${student.parent?.name || "Parent"}, your child ${name} (${className}) has no attendance check-in recorded today. If this is unexpected, please contact the school office.`;

        if (isLate) {
          notificationService.notifyParentPortal({
            schoolId: school.id,
            message,
            title: `Attendance Alert — ${alertType}`,
            details: [
              ["Student", name],
              ["Class", className || "—"],
              ["Status", alertType],
            ],
          }).catch(() => {});
        } else if (student.parent?.email) {
          notificationService.notifyParent({
            schoolId: school.id,
            parentEmail: student.parent.email,
            parentPhone: student.parent.phone,
            message,
            title: `Attendance Alert — ${alertType}`,
            details: [
              ["Student", name],
              ["Class", className || "—"],
              ["Status", alertType],
            ],
          }).catch(() => {});
        }
        // Portal notification — branch feed me alert dikhe.
        portalNotificationService.create({
          schoolId: school.id,
          senderName: "Attendance Alert",
          title: alertType === "Late" ? "ATTENDANCE_LATE" : "ATTENDANCE_ABSENT",
          body: `${name}${className ? ` (${className})` : ""} is ${alertType === "Late" ? "LATE" : "ABSENT"} today.`,
          category: "STUDENT",
          refType: "ATTENDANCE",
          refId: student.id,
          link: "/attendance",
        }).catch(() => {});
        totalAlerts++;
      }

      try { await redis.setEx(sentKey, 86400, "sent"); } catch (_) {}
      emitToRoom(`school:${school.id}`, "attendance_alert_completed", {
        schoolId: school.id,
        date: today,
      });
    }

    logger.logger.info(`[AttAlert] Done. Sent ${totalAlerts} attendance alert(s).`);
    return { success: true, totalAlerts };
  } catch (error) {
    logger.logger.error(`[AttAlert] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runAttendanceAlertJob;
