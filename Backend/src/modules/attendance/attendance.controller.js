import attendanceService from "./attendance.service.js";
import attendanceArchiveService from "./attendanceArchive.service.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";

class AttendanceController {
  /**
   * POST /api/v1/attendance/devices
   * Register a new scan device (web camera, handheld QR scanner, RFID reader)
   */
  registerDevice = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.body.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required to register a scan device"));
      }

      const device = await attendanceService.registerDevice(schoolId, req.body);
      return res
        .status(201)
        .json(ApiResponse.created("Scan device registered successfully", device));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/devices
   * List all registered devices for school branch
   */
  listDevices = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID parameter is required"));
      }

      const devices = await attendanceService.listDevices(schoolId);
      return res
        .status(200)
        .json(ApiResponse.ok("Scan devices fetched successfully", devices));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/scan
   * Real-time QR / RFID / Manual gate scan endpoint
   */
  scan = async (req, res, next) => {
    try {
      const { identifierCode, deviceId, method, scannedAt, synced } = req.body;
      const schoolId = req.user?.schoolId || null;

      const result = await attendanceService.processScan(schoolId, {
        identifierCode,
        deviceId,
        method,
        scannedAt,
        synced,
      });

      return res
        .status(200)
        .json(ApiResponse.ok("Attendance scan recorded successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/sync
   * Bulk sync offline scan buffer from gate devices
   */
  syncOffline = async (req, res, next) => {
    try {
      const { scans } = req.body;
      const schoolId = req.user?.schoolId || null;

      const results = await attendanceService.syncOfflineScans(schoolId, scans);
      return res
        .status(200)
        .json(ApiResponse.ok("Offline attendance scans synced", results));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/override
   * Manual Attendance Status Override (PRESENT, LATE, ABSENT, LEAVE)
   */
  override = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.body.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required for manual override"));
      }

      const record = await attendanceService.manualOverride(schoolId, req.body);
      return res
        .status(200)
        .json(ApiResponse.ok("Attendance record manually updated", record));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/daily
   * Fetch daily attendance report for office dashboard
   */
  getDailyReport = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required"));
      }

      const report = await attendanceService.getDailyReport(schoolId, req.query.date);
      return res
        .status(200)
        .json(ApiResponse.ok("Daily attendance report fetched", report));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/students/:studentId
   * Fetch attendance history for a single student
   */
  getStudentHistory = async (req, res, next) => {
    try {
      const history = await attendanceService.getStudentHistory(
        req.params.studentId,
        req.query.startDate,
        req.query.endDate
      );
      return res
        .status(200)
        .json(ApiResponse.ok("Student attendance history fetched", history));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/students/:studentId/yearly-summaries
   * Archived yearly attendance history (AttendanceYearSummary) for a student
   */
  getStudentYearlySummaries = async (req, res, next) => {
    try {
      const summaries = await attendanceService.getStudentYearlySummaries(
        req.params.studentId
      );
      return res
        .status(200)
        .json(ApiResponse.ok("Student yearly attendance history fetched", summaries));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/section-bulk
   * Teacher Bulk Attendance Marking for a Section
   */
  markSectionBulkAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.body.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required"));
      }

      const records = await attendanceService.markSectionBulkAttendance(schoolId, req.body);
      return res
        .status(200)
        .json(ApiResponse.ok("Section bulk attendance updated successfully", records));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/staff
   * List staff members for school branch
   */
  listStaff = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required"));
      }

      const staff = await attendanceService.getSchoolStaff(schoolId);
      return res
        .status(200)
        .json(ApiResponse.ok("School staff list fetched successfully", staff));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/attendance/monthly
   * Monthly attendance report — class/section-wise breakdown
   */
  getMonthlyReport = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) {
        return next(ApiError.badRequestError("School ID is required"));
      }

      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

      const report = await attendanceService.getMonthlyReport(schoolId, year, month);
      return res
        .status(200)
        .json(ApiResponse.ok("Monthly attendance report fetched", report));
    } catch (error) {
      return next(error);
    }
  };

  // ─── OFF DAYS / HOLIDAYS ────────────────────────────────────────────────
  getOffDays = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const offDays = await attendanceService.getOffDays(schoolId);
      return res.status(200).json(ApiResponse.ok("Off days fetched", offDays));
    } catch (error) {
      return next(error);
    }
  };

  addOffDay = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.body.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const { date, reason } = req.body;
      const result = await attendanceService.addOffDay(schoolId, date, reason);
      return res.status(201).json(ApiResponse.ok("Off day added", result));
    } catch (error) {
      return next(error);
    }
  };

  removeOffDay = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await attendanceService.removeOffDay(schoolId, req.params.date);
      return res.status(200).json(ApiResponse.ok("Off day removed", result));
    } catch (error) {
      return next(error);
    }
  };

  updateWeeklyOff = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId || req.body.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await attendanceService.updateWeeklyOff(schoolId, req.body.weekdays);
      return res.status(200).json(ApiResponse.ok("Weekly off days updated", result));
    } catch (error) {
      return next(error);
    }
  };

  updateRecord = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));

      const updated = await attendanceService.updateRecord(schoolId, req.params.id, req.body);
      return res.status(200).json(ApiResponse.ok("Record updated", updated));
    } catch (error) {
      return next(error);
    }
  };

  deleteRecord = async (req, res, next) => {
    try {
      const schoolId = req.user.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));

      const result = await attendanceService.deleteRecord(schoolId, req.params.id);
      return res.status(200).json(ApiResponse.ok("Record deleted", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/archive
   * Archive attendance: summarize per student + delete raw records.
   * SUPER_ADMIN or ADMIN only.
   */
  archiveAttendance = async (req, res, next) => {
    try {
      const { dateFrom, dateTo, yearLabel } = req.body;
      const schoolId = req.user.schoolId || req.body.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      if (!dateFrom || !dateTo || !yearLabel) {
        return next(ApiError.badRequestError("dateFrom, dateTo, and yearLabel are required"));
      }
      const result = await attendanceArchiveService.archiveByDateRange(
        schoolId, new Date(dateFrom), new Date(dateTo), yearLabel
      );
      return res.status(200).json(ApiResponse.ok("Attendance archived successfully", result));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/attendance/archive/auto
   * Auto-archive: find schools with old records and archive them.
   * SUPER_ADMIN only.
   */
  autoArchive = async (req, res, next) => {
    try {
      const results = await attendanceArchiveService.autoArchiveAll();
      return res.status(200).json(ApiResponse.ok("Auto-archive completed", { results }));
    } catch (error) {
      return next(error);
    }
  };
}


export default new AttendanceController();
