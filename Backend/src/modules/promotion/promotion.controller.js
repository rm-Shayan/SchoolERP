import promotionService from "./promotion.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { sendCsv } from "../../lib/utils/csv.js";

class PromotionController {
  /**
   * POST /api/v1/promotions/bulk-promote
   * Bulk year-end promotion to the next class/section (PRD §9).
   */
  bulkPromote = asyncHandler(async (req, res) => {
    const result = await promotionService.bulkPromote(req.user, req.body);
    return res.status(200).json(ApiResponse.ok("Students promoted successfully", result));
  });

  /**
   * POST /api/v1/promotions/repeat
   * Individual override — student repeats the current class/year.
   */
  repeatStudent = asyncHandler(async (req, res) => {
    const record = await promotionService.repeatStudent(req.user, req.body);
    return res.status(201).json(ApiResponse.created("Student marked as repeating", record));
  });

  /**
   * POST /api/v1/promotions/transfer-section
   * Mid-year section transfer.
   */
  transferSection = asyncHandler(async (req, res) => {
    const record = await promotionService.transferSection(req.user, req.body);
    return res.status(200).json(ApiResponse.ok("Student transferred to new section", record));
  });

  /**
   * POST /api/v1/promotions/graduate
   * End-of-year graduation (archive, never delete).
   */
  graduate = asyncHandler(async (req, res) => {
    const record = await promotionService.graduate(req.user, req.body);
    return res.status(200).json(ApiResponse.ok("Student graduated", record));
  });

  /**
   * POST /api/v1/promotions/dropout
   * Dropout / withdrawal (archive, never delete).
   */
  dropout = asyncHandler(async (req, res) => {
    const record = await promotionService.dropout(req.user, req.body);
    return res.status(200).json(ApiResponse.ok("Student marked as dropped out", record));
  });

  /**
   * GET /api/v1/promotions
   * Promotion / lifecycle history (filters optional).
   */
  list = asyncHandler(async (req, res) => {
    const result = await promotionService.list(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Promotion records fetched", result));
  });

  /**
   * GET /api/v1/promotions/:id
   * Single promotion record detail.
   */
  getRecord = asyncHandler(async (req, res) => {
    const record = await promotionService.getRecord(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Promotion record fetched", record));
  });

  /**
   * GET /api/v1/promotions/export
   * CSV export — current filters ke mutabiq promotion history.
   */
  exportPromotions = asyncHandler(async (req, res) => {
    const { csv } = await promotionService.exportPromotions(req.user, req.query);
    return sendCsv(res, csv, "promotions");
  });
}

export default new PromotionController();
