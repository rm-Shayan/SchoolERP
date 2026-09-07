import { Router } from "express";
import promotionController from "./promotion.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import {
  bulkPromoteSchema,
  repeatStudentSchema,
  transferSectionSchema,
  lifecycleSchema,
  bulkLifecycleSchema,
  listPromotionsSchema,
  getPromotionSchema,
} from "./promotion.validation.js";

const router = Router();
router.use(authenticate);

// ==========================================
// ACADEMIC YEAR ROLLOVER (PRD §9)
// ==========================================

/**
 * POST /api/v1/promotions/bulk-promote
 * Bulk year-end promotion: Class X-A → Class Y-B. `studentIds` restricts the
 * subset (overrides for repeaters); `rollNumbers` reassigns roll numbers.
 */
router.post(
  "/bulk-promote",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(bulkPromoteSchema),
  promotionController.bulkPromote
);

/**
 * POST /api/v1/promotions/repeat
 * Individual override — student repeats the current class.
 */
router.post(
  "/repeat",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(repeatStudentSchema),
  promotionController.repeatStudent
);

/**
 * POST /api/v1/promotions/transfer-section
 * Mid-year section transfer.
 */
router.post(
  "/transfer-section",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(transferSectionSchema),
  promotionController.transferSection
);

/**
 * POST /api/v1/promotions/graduate
 * End-of-year graduation (archived, never deleted).
 */
router.post(
  "/graduate",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(lifecycleSchema),
  promotionController.graduate
);

/**
 * POST /api/v1/promotions/dropout
 * Dropout / withdrawal (archived, never deleted).
 */
router.post(
  "/dropout",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(lifecycleSchema),
  promotionController.dropout
);

/**
 * POST /api/v1/promotions/bulk-graduate
 * Bulk graduation — pass out entire last-class section.
 */
router.post(
  "/bulk-graduate",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(bulkLifecycleSchema),
  promotionController.bulkGraduate
);

/**
 * POST /api/v1/promotions/bulk-dropout
 * Bulk dropout — withdraw entire section.
 */
router.post(
  "/bulk-dropout",
  authorize(ROLE_GROUPS.MANAGEMENT),
  validate(bulkLifecycleSchema),
  promotionController.bulkDropout
);

/**
 * GET /api/v1/promotions
 * Promotion / lifecycle history with optional filters.
 */
router.get(
  "/",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listPromotionsSchema),
  promotionController.list
);

/**
 * GET /api/v1/promotions/export
 * CSV export — current filters ke mutabiq (year / action / section).
 * NOTE: `/:id` se pehle registered — warna "export" id ban jata.
 */
router.get(
  "/export",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(listPromotionsSchema),
  promotionController.exportPromotions
);

/**
 * GET /api/v1/promotions/:id
 * Single promotion record detail.
 */
router.get(
  "/:id",
  authorize(ROLE_GROUPS.ALL_STAFF),
  validate(getPromotionSchema),
  promotionController.getRecord
);

export default router;
