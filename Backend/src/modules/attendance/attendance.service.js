import prisma from "../../config/db.js";
import attendanceRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";
import { buildMonthlyReport } from "./monthlyReport.js";

class AttendanceService {
  /**
   * Register a new Scan Device — stored as JSON array in School.scanDevices.
   * Uses a transaction to prevent race conditions from concurrent registrations.
   */
  async registerDevice(schoolId, data) {
    const newDevice = {
      id: crypto.randomUUID(),
      deviceName: data.deviceName,
      type: data.type || "QR_WEB_CAMERA",
      deviceMac: data.deviceMac || null,
      location: data.location || null,
    };
    await prisma.$transaction(async (tx) => {
      const school = await tx.school.findUnique({ where: { id: schoolId }, select: { scanDevices: true } });
      const devices = school?.scanDevices || [];
      devices.push(newDevice);
      await tx.school.update({ where: { id: schoolId }, data: { scanDevices: devices } });
    });
    return newDevice;
  }

  /**
   * List registered scan devices for a school branch
   */
  async listDevices(schoolId) {
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { scanDevices: true } });
    return school?.scanDevices || [];
  }

  /**
   * Process a single QR / RFID / Manual attendance scan — O(1) instant scan.
   * — Uses a combined DB operation (upsertScanAndRecord) so the backend does
   *   ONE round-trip instead of three (find student + create scan + create record).
   * — Notifications are fire-and-forget; cache bust is immediate.
   * — Returns a payload the frontend can use immediately.
   */
  async processScan(requesterSchoolId, { identifierCode, deviceId, method = "QR", scannedAt, synced = true }) {
    const scanTime = scannedAt ? new Date(scannedAt) : new Date();
    const today = new Date(scanTime);
    today.setHours(0, 0, 0, 0);

    // 1. Find Student by identifierCode (single indexed query)
    const student = await attendanceRepository.findStudentByIdentifierCode(identifierCode);

    if (!student) {
      // Return lightweight payload so scanner UI can show "Student not found" without throwing
      return { status: "not_found", identifierCode };
    }

    if (student.status !== "ACTIVE") {
      throw ApiError.badRequestError(`Student '${student.firstName} ${student.lastName}' is currently ${student.status}. Scans disallowed.`);
    }

    // Branch isolation check (if requester has schoolId scope)
    if (requesterSchoolId && student.schoolId !== requesterSchoolId) {
      throw ApiError.forbiddenError("Cannot scan students belonging to a different school branch");
    }

    // 2. Upsert scan record + daily attendance record in ONE DB round-trip (instant)
    // This combines scan + find/create AttendanceRecord into one transaction-efficient call.
    const cutoffTimeStr = student.school?.attendanceCutoffTime || "08:30";
    const result = await attendanceRepository.upsertScanAndRecord(
      student.id, today, scanTime, method, deviceId, cutoffTimeStr
    );

    // 3. Fire-and-forget late alert — only if this is a new check-in (no existing check-in time)
    // This is queued via a background function so the API response completes instantly.
    if (!result.existingRecord.checkIn) {
      const cutoffTimeStr = student.school?.attendanceCutoffTime || "08:30";
      const [cutH, cutM] = cutoffTimeStr.split(":").map(Number);
      const scanMinutes = scanTime.getHours() * 60 + scanTime.getMinutes();
      const cutoffMinutes = (cutH || 8) * 60 + (cutM || 30);
      const status = scanMinutes > cutoffMinutes ? "LATE" : "PRESENT";
      // Just queue it — don't await; the API response completes instantly.
      attendanceService._sendLateAlertQueue(student, scanTime, status);
    }

    // 4. Invalidate daily cache after the scan so dashboard updates immediately
    // This is quick — just a Redis DEL
    try { await attendanceService._invalidateDailyCache(student.schoolId, today); } catch (_) {}

    // 5. Broadcast to portal clients — section room + school room
    const portalPayload = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      sectionId: student.sectionId,
      status: result.attendanceRecord.status,
      scanType: result.scanType,
      scannedAt: scanTime,
      checkIn: result.attendanceRecord.checkIn,
      checkOut: result.attendanceRecord.checkOut,
    };
    emitToRoom(`section:${student.sectionId}`, "portal:attendance_marked", portalPayload);
    emitToRoom(`school:${student.schoolId}`, "portal:attendance_marked", portalPayload);
    emitToRoom(`school:${student.schoolId}`, "gate_scan_event", {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        imageUrl: student.imageUrl,
        identifierCode: student.identifierCode,
      },
      checkIn: result.attendanceRecord.checkIn,
      checkOut: result.attendanceRecord.checkOut,
      status: result.attendanceRecord.status,
      scannedAt: scanTime,
      schoolId: student.schoolId,
    });

    // 6. Fetch fee status — Redis cached term + fee records (2 queries max)
    //    Best case: Redis hit → 1 query (fee records)
    //    Worst case: Redis miss → 2 queries (term + fee records)
    let feeStatus = null;
    try {
      const termRange = await attendanceService._getCachedCurrentTerm(student.schoolId);
      if (termRange) {
        // Term cached — fetch fee records directly (1 query)
        const records = await attendanceRepository.findStudentFeeRecords(
          student.id, termRange.startDate, termRange.endDate
        );
        feeStatus = {
          term: termRange.name,
          records: records.map((r) => ({
            month: r.dueDate.toISOString().slice(0, 7),
            totalAmount: Number(r.totalAmount),
            paidAmount: Number(r.paidAmount),
            status: r.status,
          })),
        };
      } else {
        // No active term — empty
        feeStatus = { term: null, records: [] };
      }
    } catch (_) {}

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      imageUrl: student.imageUrl,
      identifierCode: student.identifierCode,
      status: result.attendanceRecord.status,
      scanType: result.scanType,
      scannedAt: scanTime,
      checkIn: result.attendanceRecord.checkIn,
      checkOut: result.attendanceRecord.checkOut,
      feeStatus,
    };
  }

  /**
   * Send late alert to parent — background queue version (non-blocking).
   * Called from processScan so the HTTP response completes instantly.
   */
  async _sendLateAlertQueue(student, scanTime, status) {
    if (status !== "LATE") return;
    const timeStr = scanTime.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
    const studentName = `${student.firstName} ${student.lastName}`;
    const className = `${student.section?.class?.name || ""} ${student.section?.name || ""}`.trim();
    const dateStr = scanTime.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
    const msg = `Dear Parent, your child ${studentName} checked in LATE today at ${timeStr}. Please ensure they arrive on time.`;

    await notificationService.notifyParentPortal({
      schoolId: student.schoolId,
      message: msg,
      title: "Late Arrival Alert",
      details: [
        ["Student", studentName],
        ["Class", className || "—"],
        ["Date", dateStr],
        ["Check-in Time", timeStr],
        ["Status", "LATE"],
      ],
    }).catch(() => {}); // Non-blocking — errors silently ignored
  }

  /**
   * Cache current active term for a school — avoids DB hit on every scan.
   * TTL = 1 hour (covers morning scan rush; term changes are rare).
   * Returns { name, startDate, endDate } or null if no active term.
   */
  async _getCachedCurrentTerm(schoolId) {
    const cacheKey = `term:current:${schoolId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    // Cache miss — fetch from DB (single indexed query via repository)
    const term = await attendanceRepository.findCurrentTerm(schoolId);
    const value = term
      ? { name: term.name, startDate: term.startDate, endDate: term.endDate }
      : null;

    try {
      // 1 hour TTL — term rarely changes mid-day
      await redis.setEx(cacheKey, 3600, JSON.stringify(value));
    } catch (_) {}

    return value;
  }

  /**
   * Invalidate the daily attendance cache for a school (called after each scan/override).
   */
  async _invalidateDailyCache(schoolId, date) {
    try {
      const dateKey = date.toISOString().split("T")[0];
      await redis.del(`attendance:daily:${schoolId}:${dateKey}`);
    } catch (_) {}
  }

  /**
   * Daily Attendance Report for Office Dashboard — Redis cached (5 min TTL)
   */
  async getDailyReport(schoolId, dateStr) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const dateKey = targetDate.toISOString().split("T")[0];
    const cacheKey = `attendance:daily:${schoolId}:${dateKey}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    const records = await attendanceRepository.getDailySchoolAttendance(schoolId, targetDate);
    const offDays = await attendanceRepository.findOffDays(schoolId);
    const weeklyOff = await attendanceRepository.findWeeklyOff(schoolId);

    const summary = {
      date: targetDate,
      totalMarked: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      leave: records.filter((r) => r.status === "LEAVE").length,
      manualOverride: records.filter((r) => r.status === "MANUAL_OVERRIDE").length,
    };

    const result = { summary, records, offDays, weeklyOff };

    try {
      // Cache for 5 minutes — invalidated after each new scan or override
      await redis.setEx(cacheKey, 300, JSON.stringify(result));
    } catch (_) {}

    return result;
  }

  async getMonthlyReport(schoolId, year, month) {
    return buildMonthlyReport(attendanceRepository, schoolId, year, month);
  }

  // ─── OFF DAYS / HOLIDAYS ────────────────────────────────────────────────
  async getOffDays(schoolId) {
    return attendanceRepository.findOffDays(schoolId);
  }

  async addOffDay(schoolId, date, reason) {
    const list = await attendanceRepository.findOffDays(schoolId);
    const exists = list.some((o) => o.date === date);
    const next = exists
      ? list
      : [...list, { date, reason: reason || null }].sort((a, b) => a.date.localeCompare(b.date));
    if (!exists) await attendanceRepository.updateOffDays(schoolId, next);
    try { await attendanceService._invalidateDailyCache(schoolId, new Date(date)); } catch (_) {}
    return { offDays: next };
  }

  async removeOffDay(schoolId, date) {
    const list = await attendanceRepository.findOffDays(schoolId);
    const next = list.filter((o) => o.date !== date);
    if (next.length !== list.length) await attendanceRepository.updateOffDays(schoolId, next);
    try { await attendanceService._invalidateDailyCache(schoolId, new Date(date)); } catch (_) {}
    return { offDays: next };
  }

  async updateWeeklyOff(schoolId, weekdays) {
    const clean = [...new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
    await attendanceRepository.updateWeeklyOff(schoolId, clean);
    try { await attendanceService._invalidateDailyCache(schoolId, new Date()); } catch (_) {}
    return { weeklyOff: clean };
  }

  async getStudentHistory(studentId, startDate, endDate) {
    return attendanceRepository.getStudentAttendanceHistory(
      studentId,
      startDate,
      endDate
    );
  }

  async getStudentYearlySummaries(studentId) {
    return attendanceRepository.getStudentYearlySummaries(studentId);
  }

  async updateRecord(schoolId, recordId, { status, remarks }) {
    const record = await prisma.attendanceRecord.findFirst({ where: { id: recordId, schoolId } });
    if (!record) throw ApiError.notFoundError("Attendance record not found");

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { ...(status && { status }), ...(remarks !== undefined && { remarks }) },
    });

    try { await attendanceService._invalidateDailyCache(schoolId, record.date); } catch (_) {}

    emitToRoom(`school:${schoolId}`, "portal:attendance_marked", {
      studentId: record.studentId,
      sectionId: record.sectionId,
      status: updated.status,
      date: updated.date,
      action: "override",
    });

    return updated;
  }

  async deleteRecord(schoolId, recordId) {
    const record = await prisma.attendanceRecord.findFirst({ where: { id: recordId, schoolId } });
    if (!record) throw ApiError.notFoundError("Attendance record not found");

    await prisma.attendanceRecord.delete({ where: { id: recordId } });

    try { await attendanceService._invalidateDailyCache(schoolId, record.date); } catch (_) {}

    return { deleted: true, id: recordId };
  }
}

export default new AttendanceService();
