import feeService from "./fee.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { sendCsv } from "../../lib/utils/csv.js";
import pdfService from "../../services/pdf.service.js";

// Bank details — branch ka apna account pehle, warna org ka default.
function resolveBankInfo(record) {
  const school = record.student.school;
  const bankName = school.bankName || school.organization?.bankName || null;
  const accountTitle = school.bankAccountTitle || school.organization?.bankAccountTitle || null;
  const accountNumber = school.bankAccountNumber || school.organization?.bankAccountNumber || null;
  if (!bankName && !accountNumber) return undefined;
  return { bankName, accountTitle, accountNumber };
}

class FeeController {
  /**
   * POST /api/v1/fees/schools/:schoolId/structures
   * Create a year-aware fee structure.
   */
  createFeeStructure = asyncHandler(async (req, res) => {
    const structure = await feeService.createFeeStructure(req.user, req.params.schoolId, req.body);
    return res.status(201).json(ApiResponse.created("Fee structure created", structure));
  });

  /**
   * GET /api/v1/fees/schools/:schoolId/structures
   * List fee structures for a school.
   */
  listFeeStructures = asyncHandler(async (req, res) => {
    const structures = await feeService.listFeeStructures(
      req.user,
      req.params.schoolId || req.query.schoolId,
      req.query
    );
    return res.status(200).json(ApiResponse.ok("Fee structures fetched", structures));
  });

  /**
   * GET /api/v1/fees/structures/:id
   * Single fee structure.
   */
  getFeeStructure = asyncHandler(async (req, res) => {
    const structure = await feeService.getFeeStructure(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Fee structure fetched", structure));
  });

  /**
   * PUT /api/v1/fees/structures/:id
   * Update a fee structure (name / class / year / line items).
   */
  updateFeeStructure = asyncHandler(async (req, res) => {
    const structure = await feeService.updateFeeStructure(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Fee structure updated", structure));
  });

  /**
   * DELETE /api/v1/fees/structures/:id
   * Delete a fee structure.
   */
  deleteFeeStructure = asyncHandler(async (req, res) => {
    await feeService.deleteFeeStructure(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Fee structure deleted"));
  });

  /**
   * POST /api/v1/fees/generate-monthly
   * Bulk-generate monthly fee records for active students (per structure).
   */
  generateMonthlyFees = asyncHandler(async (req, res) => {
    const result = await feeService.generateMonthlyFees(req.user, req.body);
    return res.status(201).json(ApiResponse.created("Monthly fee records generated", result));
  });

  /**
   * GET /api/v1/fees/records/export?schoolId=&month=&year=&status=
   * Month ka poora fee record CSV mein download karo.
   */
  exportFeeRecords = asyncHandler(async (req, res) => {
    const { csv } = await feeService.exportFeeRecords(req.user, req.query);
    return sendCsv(res, csv, "fee-records");
  });

  /**
   * GET /api/v1/fees/records/summary?schoolId=&month=&year=
   * Month ka fee summary (total/collected/outstanding + status counts).
   */
  getFeeSummary = asyncHandler(async (req, res) => {
    const summary = await feeService.getFeeSummary(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Fee summary fetched", summary));
  });

  /**
   * GET /api/v1/fees/schools/:schoolId/due-day
   * School ka current default monthly due day.
   */
  getSchoolDueDay = asyncHandler(async (req, res) => {
    const result = await feeService.getSchoolDueDay(req.user, req.params.schoolId);
    return res.status(200).json(ApiResponse.ok("Due day fetched", result));
  });

  /**
   * PUT /api/v1/fees/schools/:schoolId/due-day
   * School ka default monthly due day set karo.
   */
  setSchoolDueDay = asyncHandler(async (req, res) => {
    const school = await feeService.setSchoolDueDay(req.user, req.params.schoolId, req.body.dueDay);
    return res.status(200).json(ApiResponse.ok("Default due day updated", school));
  });

  /**
   * PATCH /api/v1/fees/records/:id/due-date
   * Ek student ke is month ke due date ko extend karo.
   */
  updateRecordDueDate = asyncHandler(async (req, res) => {
    const record = await feeService.updateRecordDueDate(req.user, req.params.id, req.body.dueDate);
    return res.status(200).json(ApiResponse.ok("Due date extended", record));
  });

  /**
   * GET /api/v1/fees/records
   * List fee records (filters: status, studentId, due dates).
   */
  listFeeRecords = asyncHandler(async (req, res) => {
    const result = await feeService.listFeeRecords(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Fee records fetched", result));
  });

  /**
   * GET /api/v1/fees/records/bulk
   * Bulk fee records for multiple students — single query (N+1 eliminate).
   * Query: ?schoolId=&studentIds=id1,id2,id3
   */
  listBulkFeeRecords = asyncHandler(async (req, res) => {
    const { schoolId, studentIds, status, dueDateBefore, dueDateAfter } = req.query;
    const ids = studentIds ? studentIds.split(",").filter(Boolean) : [];
    const result = await feeService.listFeeRecordsByStudentIds(req.user, {
      schoolId,
      studentIds: ids,
      status,
      dueDateBefore,
      dueDateAfter,
    });
    return res.status(200).json(ApiResponse.ok("Bulk fee records fetched", result));
  });

  /**
   * GET /api/v1/fees/records/:id
   * Single fee record with payments.
   */
  getFeeRecord = asyncHandler(async (req, res) => {
    const record = await feeService.getFeeRecord(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Fee record fetched", record));
  });

  /**
   * POST /api/v1/fees/records/:id/payments
   * Record a payment → receipt PDF. PAID → portal notification (no email);
   * PARTIAL → updated fee voucher emailed to parent.
   */
  recordPayment = asyncHandler(async (req, res) => {
    const result = await feeService.recordPayment(req.user, req.params.id, req.body);
    return res.status(201).json(ApiResponse.created("Payment recorded successfully", {
      payment: result.payment,
      feeRecord: result.feeRecord,
    }));
  });

  /**
   * GET /api/v1/fees/students/:studentId/yearly-summaries
   * Per-student yearly fee summary (charged / paid / outstanding per year).
   */
  getStudentYearlySummaries = asyncHandler(async (req, res) => {
    const summaries = await feeService.getStudentYearlyFeeSummaries(req.user, req.params.studentId);
    return res.status(200).json(ApiResponse.ok("Student yearly fee summary fetched", summaries));
  });

  /**
   * GET /api/v1/fees/records/:id/receipt
   * Download receipt PDF.
   */
  getReceipt = asyncHandler(async (req, res) => {
    const record = await feeService.getFeeRecord(req.user, req.params.id);
    const payment = record.payments[record.payments.length - 1];

    const receipt = await pdfService.feeReceipt({
      schoolName: record.student.school.name,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim(),
      rows: [
        { label: "Fee Period", value: new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" }) },
        { label: "Due Date", value: new Date(record.dueDate).toLocaleDateString("en-PK") },
      ],
      lineItems: [{ title: "Total Fee", amount: record.totalAmount }, { title: "Paid", amount: record.paidAmount }],
      totalPaid: record.paidAmount,
      paidAt: payment?.paidAt,
      refNo: `RC-${record.id.slice(0, 8)}`,
      qrData: `FEE:${record.id}`,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${record.id}.pdf"`);
    return res.send(receipt);
  });

  /**
   * GET /api/v1/fees/records/:id/voucher
   * Unpaid record ka voucher PDF — QR scan se fee collect hoti hai.
   */
  getVoucher = asyncHandler(async (req, res) => {
    const record = await feeService.getFeeRecord(req.user, req.params.id);

    const total = Number(record.totalAmount);
    const paid = Number(record.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const status = paid <= 0 ? "UNPAID" : balance > 0 ? "PARTIAL" : "PAID";

    const voucher = await pdfService.feeVoucher({
      schoolName: record.student.school.name,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim(),
      rollNumber: record.student.rollNumber,
      monthLabel: new Date(record.dueDate).toLocaleString("en-PK", { month: "long", year: "numeric" }),
      totalAmount: total,
      paidAmount: paid,
      totalDue: balance,
      dueDate: record.dueDate,
      issuedDate: new Date(),
      refNo: `VC-${record.id.slice(0, 8)}`,
      qrData: `FEE:${record.id}`,
      status,
      themeColor: record.student.school.organization?.themeColor || undefined,
      logoUrl: record.student.school.logoUrl || record.student.school.organization?.logoUrl || undefined,
      // Bank details — branch override → org default (voucher par print).
      bank: resolveBankInfo(record),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="voucher-${record.id}.pdf"`);
    return res.send(voucher);
  });

  /**
   * GET /api/v1/fees/records/:id/voucher-a5
   * Print-optimized A5 voucher — smaller margins for half-sheet printing.
   */
  getVoucherA5 = asyncHandler(async (req, res) => {
    const record = await feeService.getFeeRecord(req.user, req.params.id);

    const total = Number(record.totalAmount);
    const paid = Number(record.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const status = paid <= 0 ? "UNPAID" : balance > 0 ? "PARTIAL" : "PAID";

    const voucher = await pdfService.feeVoucherA5({
      schoolName: record.student.school.name,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: `${record.student.section?.class?.name || ""} ${record.student.section?.name || ""}`.trim(),
      totalAmount: total,
      paidAmount: paid,
      totalDue: balance,
      dueDate: record.dueDate,
      refNo: `VC-${record.id.slice(0, 8)}`,
      qrData: `FEE:${record.id}`,
      status,
      themeColor: record.student.school.organization?.themeColor || undefined,
      logoUrl: record.student.school.logoUrl || record.student.school.organization?.logoUrl || undefined,
      bank: resolveBankInfo(record),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="voucher-a5-${record.id}.pdf"`);
    return res.send(voucher);
  });

  /**
   * POST /api/v1/fees/records/:id/scan
   * Voucher QR scan → remaining balance collect, fee PAID mark.
   */
  scanCollect = asyncHandler(async (req, res) => {
    const result = await feeService.scanCollect(req.user, req.params.id);
    const msg = result.alreadyPaid ? "Fee already paid" : "Fee marked PAID via voucher scan";
    return res.status(200).json(ApiResponse.ok(msg, result.feeRecord));
  });

  /**
   * POST /api/v1/fees/reminders
   * Manually trigger fee reminders (also scheduled daily). Branch-scoped:
   * sirf requester ki branch ke records (schoolId + month/year filter).
   */
  sendReminders = asyncHandler(async (req, res) => {
    const result = await feeService.sendReminders(req.user, req.body);
    return res.status(200).json(ApiResponse.ok("Fee reminders dispatched", result));
  });

  /**
   * POST /api/v1/fees/records/:id/remind
   * Manual per-record reminder — ek student ka voucher dobara bhejo.
   */
  remindRecord = asyncHandler(async (req, res) => {
    const result = await feeService.remindRecord(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Reminder sent to parent", result));
  });

  /**
   * GET /api/v1/fees/records/bulk-vouchers?classId=&month=&year=&status=
   * Class ke saare students ke vouchers ka ek PDF — one-click print.
   */
  bulkVouchers = asyncHandler(async (req, res) => {
    const { classId, month, year, status, studentIds } = req.query;
    // studentIds can be comma-separated: ?studentIds=id1,id2,id3
    const ids = studentIds ? studentIds.split(",").filter(Boolean) : undefined;
    try {
      const pdf = await feeService.generateBulkVouchers(req.user, {
        classId, month, year, status, studentIds: ids,
      });
      if (!pdf) {
        return res.status(404).json(ApiResponse.notFound("No vouchers generated"));
      }
      const monthLabel = month && year ? `-${month}-${year}` : "";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="fee-vouchers${monthLabel}.pdf"`);
      return res.send(pdf);
    } catch (err) {
      // Friendly message for "no records" case — 404 instead of 500
      if (err.message?.includes("No fee records found")) {
        return res.status(404).json(ApiResponse.notFound(
          `No fee records found${classId ? " for the selected class" : ""}${month && year ? ` in ${month}/${year}` : ""}. Generate records first.`
        ));
      }
      throw err;
    }
  });

  /**
   * POST /api/v1/fees/calculate-due-charges
   * Overdue records par late fee charges auto-calculate karo.
   * School-level ya platform-wide (scheduler).
   */
  calculateDueCharges = asyncHandler(async (req, res) => {
    const schoolId = req.body.schoolId || req.user?.schoolId || null;
    const result = await feeService.calculateDueCharges(schoolId);
    return res.status(200).json(ApiResponse.ok("Due charges calculated", result));
  });
}

export default new FeeController();
