import { Router } from "express";
import feeController from "./fee.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize, assertSameSchool } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  createFeeStructureSchema,
  listFeeStructuresSchema,
  getFeeStructureSchema,
  updateFeeStructureSchema,
  generateMonthlyFeesSchema,
  listFeeRecordsSchema,
  recordPaymentSchema,
  getFeeRecordSchema,
  listStructuresParamSchema,
  setSchoolDueDaySchema,
  updateRecordDueDateSchema,
} from "./fee.validation.js";

const router = Router();
router.use(authenticate);

// ==========================================
// FEE STRUCTURES (PRD §4 — year-aware)
// ==========================================
router.post(
  "/schools/:schoolId/structures",
  authorize(ROLE_GROUPS.FINANCE),
  assertSameSchool,
  validate(createFeeStructureSchema),
  feeController.createFeeStructure
);

router.get(
  "/schools/:schoolId/structures",
  authorize(ROLE_GROUPS.FINANCE),
  assertSameSchool,
  validate(listStructuresParamSchema),
  feeController.listFeeStructures
);

router.get(
  "/structures",
  authorize(ROLE_GROUPS.FINANCE),
  validate(listFeeStructuresSchema),
  feeController.listFeeStructures
);

router.get(
  "/structures/:id",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeStructureSchema),
  feeController.getFeeStructure
);

router.put(
  "/structures/:id",
  authorize(ROLE_GROUPS.FINANCE),
  validate(updateFeeStructureSchema),
  feeController.updateFeeStructure
);

router.delete(
  "/structures/:id",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeStructureSchema),
  feeController.deleteFeeStructure
);

// ==========================================
// MONTHLY GENERATION + RECORDS (PRD §4)
// ==========================================
router.post(
  "/generate-monthly",
  authorize(ROLE_GROUPS.FINANCE),
  validate(generateMonthlyFeesSchema),
  feeController.generateMonthlyFees
);

/**
 * GET /fees/schools/:schoolId/due-day — current default due day (page load).
 */
router.get(
  "/schools/:schoolId/due-day",
  authorize(ROLE_GROUPS.FINANCE),
  assertSameSchool,
  feeController.getSchoolDueDay
);

/**
 * PUT /fees/schools/:schoolId/due-day — school ka default monthly due day
 * set karo (e.g. 10 = har month 10th). Agle mahine ka auto voucher isi par banta hai.
 */
router.put(
  "/schools/:schoolId/due-day",
  authorize(ROLE_GROUPS.FINANCE),
  assertSameSchool,
  validate(setSchoolDueDaySchema),
  feeController.setSchoolDueDay
);

/**
 * PATCH /fees/records/:id/due-date — ek particular bache ka is month ka
 * due date extend karo (OVERDUE → UNPAID reset hota hai).
 */
router.patch(
  "/records/:id/due-date",
  authorize(ROLE_GROUPS.FINANCE),
  validate(updateRecordDueDateSchema),
  feeController.updateRecordDueDate
);

/**
 * GET /fees/records/export — month ka poora fee record CSV.
 * /records/:id se pehle register hona zaroori hai (route conflict na ho).
 */
router.get(
  "/records/export",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.exportFeeRecords
);

/**
 * GET /fees/records/bulk-vouchers — class ke saare students ka ek PDF
 */
router.get(
  "/records/bulk-vouchers",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.bulkVouchers
);

/**
 * GET /fees/records/summary — month ka summary (pehle register karo, warna
 * "/records/:id" isse :id samajh lega).
 */
router.get(
  "/records/summary",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.getFeeSummary
);

/**
 * GET /fees/records/bulk — N+1 eliminate: saare students ke records ek query.
 * /records/:id se pehle register.
 */
router.get(
  "/records/bulk",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.listBulkFeeRecords
);

router.get(
  "/records",
  authorize(ROLE_GROUPS.FINANCE),
  validate(listFeeRecordsSchema),
  feeController.listFeeRecords
);

router.get(
  "/records/:id",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.getFeeRecord
);

/**
 * GET /fees/students/:studentId/yearly-summaries — FINANCE
 * Per-student yearly fee summary (student detail view).
 */
router.get(
  "/students/:studentId/yearly-summaries",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.getStudentYearlySummaries
);

router.post(
  "/records/:id/payments",
  authorize(ROLE_GROUPS.FINANCE),
  validate(recordPaymentSchema),
  feeController.recordPayment
);

router.get(
  "/records/:id/receipt",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.getReceipt
);

router.get(
  "/records/:id/voucher",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.getVoucher
);

router.get(
  "/records/:id/voucher-a5",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.getVoucherA5
);

/**
 * POST /fees/records/:id/scan
 * Voucher QR scan → fee collect (remaining balance PAID).
 */
router.post(
  "/records/:id/scan",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.scanCollect
);

/**
 * POST /fees/records/:id/remind
 * Manual per-record reminder — ek voucher/reminder dobara bhejo (FINANCE).
 */
router.post(
  "/records/:id/remind",
  authorize(ROLE_GROUPS.FINANCE),
  validate(getFeeRecordSchema),
  feeController.remindRecord
);

// ==========================================
// REMINDERS (PRD §4 — due se pehle + overdue)
// ==========================================
router.post(
  "/reminders",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.sendReminders
);

// ==========================================
// DUE CHARGES (late fee from line items)
// ==========================================
router.post(
  "/calculate-due-charges",
  authorize(ROLE_GROUPS.FINANCE),
  feeController.calculateDueCharges
);

export default router;
