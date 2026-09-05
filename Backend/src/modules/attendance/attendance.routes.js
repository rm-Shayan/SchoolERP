import { Router } from "express";
import attendanceController from "./attendance.controller.js";
import {
  createDeviceSchema,
  scanQrSchema,
  syncOfflineScansSchema,
  manualOverrideSchema,
  bulkSectionAttendanceSchema,
  updateAttendanceRecordSchema,
  addOffDaySchema,
  removeOffDaySchema,
  updateWeeklyOffSchema,
} from "./attendance.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// ─── GATE SCAN & OFFLINE SYNC ───────────────────────────────────────────────
/**
 * POST /api/v1/attendance/scan
 * Real-time QR / RFID / Manual scan processing endpoint
 */
router.post(
  "/scan",
  authorize(ROLE_GROUPS.ATTENDANCE),
  validate(scanQrSchema),
  attendanceController.scan
);

/**
 * POST /api/v1/attendance/sync
 * Bulk sync offline scans from gate devices
 */
router.post(
  "/sync",
  authorize(["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]),
  validate(syncOfflineScansSchema),
  attendanceController.syncOffline
);

// ─── DEVICE MANAGEMENT ──────────────────────────────────────────────────────
router.post(
  "/devices",
  authorize(["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]),
  validate(createDeviceSchema),
  attendanceController.registerDevice
);

router.get(
  "/devices",
  authorize(ROLE_GROUPS.ATTENDANCE),
  attendanceController.listDevices
);

// ─── TEACHER & STAFF ATTENDANCE ──────────────────────────────────────────────
/**
 * POST /api/v1/attendance/section-bulk
 * Teacher marks bulk attendance for all students of a particular section
 */
router.post(
  "/section-bulk",
  authorize(["SUPER_ADMIN", "ADMIN", "TEACHER", "RECEPTIONIST"]),
  validate(bulkSectionAttendanceSchema),
  attendanceController.markSectionBulkAttendance
);

/**
 * GET /api/v1/attendance/staff
 * Fetch list of all school staff members (Teachers, Receptionists, etc.)
 */
router.get(
  "/staff",
  authorize(["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]),
  attendanceController.listStaff
);

// ─── MANUAL OVERRIDE & REPORTING ────────────────────────────────────────────
// ─── OFF DAYS / HOLIDAYS ─────────────────────────────────────────────────────
/**
 * GET /api/v1/attendance/off-days
 * List school off days / holidays (extra closures beyond weekends)
 */
router.get(
  "/off-days",
  authorize(["SUPER_ADMIN", "ADMIN"]),
  attendanceController.getOffDays
);

/**
 * POST /api/v1/attendance/off-days
 * Add an off day / holiday — body { date: "YYYY-MM-DD", reason? }
 */
router.post(
  "/off-days",
  authorize(["SUPER_ADMIN", "ADMIN"]),
  validate(addOffDaySchema),
  attendanceController.addOffDay
);

/**
 * DELETE /api/v1/attendance/off-days/:date
 * Remove an off day / holiday
 */
router.delete(
  "/off-days/:date",
  authorize(["SUPER_ADMIN", "ADMIN"]),
  validate(removeOffDaySchema),
  attendanceController.removeOffDay
);

/**
 * PUT /api/v1/attendance/weekly-off
 * Set which weekdays are off for this school — body { weekdays: [0..6] } (0=Sun .. 6=Sat)
 */
router.put(
  "/weekly-off",
  authorize(["SUPER_ADMIN", "ADMIN"]),
  validate(updateWeeklyOffSchema),
  attendanceController.updateWeeklyOff
);

/**
 * POST /api/v1/attendance/override
 * Manual Attendance Status Override (e.g. absent student turned out present with note)
 */
router.post(
  "/override",
  authorize(["SUPER_ADMIN", "ADMIN", "TEACHER", "RECEPTIONIST"]),
  validate(manualOverrideSchema),
  attendanceController.override
);

/**
 * GET /api/v1/attendance/daily
 * Office Live Dashboard Attendance Summary & List
 */
router.get(
  "/daily",
  authorize(ROLE_GROUPS.ALL_STAFF),
  attendanceController.getDailyReport
);

/**
 * GET /api/v1/attendance/monthly
 * Monthly attendance report — class/section-wise breakdown
 */
router.get(
  "/monthly",
  authorize(["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]),
  attendanceController.getMonthlyReport
);

/**
 * GET /api/v1/attendance/students/:studentId
 * Individual Student Attendance History
 */
router.get(
  "/students/:studentId",
  authorize(ROLE_GROUPS.ALL_STAFF),
  attendanceController.getStudentHistory
);

/**
 * GET /api/v1/attendance/students/:studentId/yearly-summaries
 * Archived yearly attendance rollups (AttendanceYearSummary)
 */
router.get(
  "/students/:studentId/yearly-summaries",
  authorize(ROLE_GROUPS.ALL_STAFF),
  attendanceController.getStudentYearlySummaries
);

router.put(
  "/:id",
  authorize(["SUPER_ADMIN", "ADMIN", "TEACHER", "RECEPTIONIST"]),
  validate(updateAttendanceRecordSchema),
  attendanceController.updateRecord
);

router.delete(
  "/:id",
  authorize(["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]),
  attendanceController.deleteRecord
);

// ─── ARCHIVE ────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/attendance/archive
 * Archive attendance for a school + date range (summarize + delete raw).
 */
router.post(
  "/archive",
  authorize(["SUPER_ADMIN", "ADMIN"]),
  attendanceController.archiveAttendance
);

/**
 * POST /api/v1/attendance/archive/auto
 * Auto-archive old records across all active schools.
 */
router.post(
  "/archive/auto",
  authorize(["SUPER_ADMIN"]),
  attendanceController.autoArchive
);

export default router;

