import feeService from "../../modules/fee/fee.service.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("fee-archive-job");

/**
 * Fee Year-End Archive (node-cron — daily 3:30 AM).
 *
 * Sirf PAID fee records ko per-student per-year FeeYearSummary mein roll-up
 * karke delete. UNPAID/PARTIAL/OVERDUE records LIVE rehte hain taake
 * outstanding collect ho sake. Grace policy: khatam hote calendar year ke
 * records ~6 mahine tak (ENDED_YEAR_GRACE_DAYS, default 180) live rehte hain,
 * phir PAID hone par archive. Summary hamesha rehti hai — yearly fee view
 * (staff, parent, student portal) usi ko merge karke dikhata hai.
 *
 * Idempotent: summaries upsert hoti hain, delete sirf fetched records par.
 */
export async function runFeeArchiveJob() {
  logger.logger.info("[FeeArchive] Starting year-end PAID fee archive sweep...");
  try {
    const result = await feeService.archiveFeeRecords();
    logger.logger.info(
      `[FeeArchive] Done. Students processed: ${result.studentsProcessed}, records archived: ${result.recordsArchived}, summaries upserted: ${result.summariesCreated}`
    );
    return { success: true, ...result };
  } catch (error) {
    logger.logger.error(`[FeeArchive] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runFeeArchiveJob;