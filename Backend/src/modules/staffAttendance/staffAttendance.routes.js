import { Router } from "express";
import staffAttendanceController from "./staffAttendance.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { fileUpload } from "../../lib/upload.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin: mark single staff attendance
router.post(
  "/mark",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffAttendanceController.markAttendance
);

// Gate scanner: staff ID-card QR se check-in (koi bhi staff member operate kar sakta hai)
router.post(
  "/checkin",
  authorize("ADMIN", "TEACHER", "RECEPTIONIST", "SUPER_ADMIN"),
  staffAttendanceController.scanCheckIn
);

// Admin/branch staff: bulk mark attendance (AttendanceHub Staff tab)
router.post(
  "/bulk",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.bulkMark
);

// Admin/branch staff: daily report
router.get(
  "/daily",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.getDailyReport
);

// Admin/branch staff: monthly report
router.get(
  "/monthly",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.getMonthlyReport
);

// Admin/branch staff: delete attendance record
router.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.deleteAttendance
);

// Admin/branch staff: update attendance record
router.put(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.updateAttendance
);

// Admin/branch staff: export attendance as Excel/CSV
router.get(
  "/export",
  authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
  staffAttendanceController.exportAttendance
);

// Admin: import attendance from Excel
router.post(
  "/import",
  authorize("ADMIN", "SUPER_ADMIN"),
  fileUpload.single("file"),
  staffAttendanceController.importAttendance
);

// Admin: download import template
router.get(
  "/download-template",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffAttendanceController.downloadTemplate
);

// Staff: own attendance
router.get(
  "/my",
  authorize("ADMIN", "TEACHER", "RECEPTIONIST", "SUPER_ADMIN"),
  staffAttendanceController.getMyAttendance
);

export default router;
