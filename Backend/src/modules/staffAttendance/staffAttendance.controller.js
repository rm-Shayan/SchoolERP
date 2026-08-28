import ApiResponse from "../../lib/utils/ApiResponse.js";
import ApiError from "../../lib/utils/ApiError.js";
import staffAttendanceService from "./staffAttendance.service.js";
import { getDailyReport, getMonthlyReport, getMyAttendance } from "./staffAttendanceReport.service.js";
import { fileUpload } from "../../lib/upload.js";

class StaffAttendanceController {
  /** POST /staff-attendance/mark — Admin: mark single staff attendance */
  markAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await staffAttendanceService.markAttendance(schoolId, req.body);
      return res.status(200).json(ApiResponse.ok("Staff attendance marked", result));
    } catch (error) {
      return next(error);
    }
  };

  /** POST /staff-attendance/bulk — Admin: bulk mark attendance */
  bulkMark = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await staffAttendanceService.bulkMark(schoolId, req.body);
      return res.status(200).json(ApiResponse.ok("Bulk attendance marked", result));
    } catch (error) {
      return next(error);
    }
  };

  /** GET /staff-attendance/daily — Admin: daily report */
  getDailyReport = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await getDailyReport(schoolId, req.query.date);
      return res.status(200).json(ApiResponse.ok("Daily staff attendance fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** GET /staff-attendance/monthly — Admin: monthly report */
  getMonthlyReport = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
      const result = await getMonthlyReport(schoolId, year, month);
      return res.status(200).json(ApiResponse.ok("Monthly staff attendance fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  /** POST /staff-attendance/checkin — ID-card QR scan se check-in (gate) */
  scanCheckIn = async (req, res, next) => {
    try {
      const result = await staffAttendanceService.scanCheckIn(req.user, req.body?.token);
      const msg = result.alreadyCheckedIn
        ? `${result.staffName} already checked in today`
        : `Check-in recorded for ${result.staffName}`;
      return res.status(200).json(ApiResponse.ok(msg, result));
    } catch (error) {
      return next(error);
    }
  };

  /** DELETE /staff-attendance/:id — Admin: delete attendance record */
  deleteAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await staffAttendanceService.deleteAttendance(schoolId, req.params.id);
      return res.status(200).json(ApiResponse.ok("Attendance record deleted", result));
    } catch (error) {
      return next(error);
    }
  };

  /** PUT /staff-attendance/:id — Admin: update attendance record */
  updateAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const result = await staffAttendanceService.updateAttendance(schoolId, req.params.id, req.body);
      return res.status(200).json(ApiResponse.ok("Attendance record updated", result));
    } catch (error) {
      return next(error);
    }
  };

  /** GET /staff-attendance/export — Admin: export attendance as Excel/CSV */
  exportAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId || req.query.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      const format = req.query.format === "csv" ? "csv" : "xlsx";
      const buffer = await staffAttendanceService.exportAttendance(schoolId, {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        format,
      });
      const ext = format === "csv" ? "csv" : "xlsx";
      const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `attachment; filename=staff-attendance-${Date.now()}.${ext}`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  };

  /** POST /staff-attendance/import — Admin: import attendance from Excel */
  importAttendance = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return next(ApiError.badRequestError("School ID is required"));
      if (!req.file) return next(ApiError.badRequestError("Please upload an Excel file (.xlsx or .xls)"));
      const result = await staffAttendanceService.importAttendance(schoolId, req.file.buffer);
      return res.status(200).json(ApiResponse.ok("Import completed", result));
    } catch (error) {
      return next(error);
    }
  };

  /** POST /staff-attendance/download-template — Admin: download import template */
  downloadTemplate = async (req, res, next) => {
    try {
      const xlsx = (await import("xlsx")).default;
      const headers = ["Staff Name", "Email", "Date", "Status", "Remarks"];
      const sample = ["Ahmed Khan", "ahmed@school.edu", "2026-08-27", "PRESENT", ""];
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([headers, sample]);
      xlsx.utils.book_append_sheet(wb, ws, "Staff Attendance");
      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", 'attachment; filename="staff-attendance-template.xlsx"');
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  };

  /** GET /staff-attendance/my — Staff: own attendance */
  getMyAttendance = async (req, res, next) => {
    try {
      const staffId = req.user?.id;
      const result = await getMyAttendance(staffId, req.query);
      return res.status(200).json(ApiResponse.ok("My attendance fetched", result));
    } catch (error) {
      return next(error);
    }
  };
}

export default new StaffAttendanceController();
