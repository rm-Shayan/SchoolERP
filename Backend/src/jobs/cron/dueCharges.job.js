import feeService from "../../modules/fee/fee.service.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("due-charges-job");

/**
 * Daily Due Charges Calculation Job.
 *
 * Overdue sweep (9 AM) ke baad chalta hai — jo records OVERDUE mark ho chuke
 * hain, unke class ke fee structure se late fee line items check karta hai
 * aur charges calculate karke FeeRecord.dueCharges me save karta hai.
 *
 * Grace days (lateFeeDays) ka khayal rakhta hai — agar 3 din ka grace hai
 * to 4th din pe charges lagenge.
 */
export async function runDueChargesJob() {
  logger.logger.info("Starting Daily Due Charges Calculation Job...");

  try {
    // null = scheduler mode — saare active schools ke liye
    const result = await feeService.calculateDueCharges(null);
    logger.logger.info(
      `[DueCharges] ${result.updated} record(s) updated with late fee charges.`
    );
    return { success: true, ...result };
  } catch (error) {
    logger.logger.error(`Error in Due Charges Job: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runDueChargesJob;
