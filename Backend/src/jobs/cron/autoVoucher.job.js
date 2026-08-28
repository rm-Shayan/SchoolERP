import feeService from "../../modules/fee/fee.service.js";
import feeRepository from "../../modules/fee/repository.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("auto-voucher-job");

/**
 * Monthly Auto Voucher Generation Job (node-cron — 1st of month, 12:05 AM).
 *
 * \"Jese mene due date 10 set ki thi, tu agle mahine fee voucher generate hoga
 * or due date 10 hi hogi\" — har school apne saved `monthlyFeeDueDay` ke saath
 * current month ke UNPAID vouchers khud banata hai. Schools jinke paas fee
 * structure setup nahi hai skip ho jate hain; already-generated records bhi
 * skip (duplicate nahi bante).
 */
export async function runAutoVoucherJob() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  logger.logger.info(`Starting Monthly Auto Voucher Job for ${month}/${year}...`);

  try {
    const schools = await feeRepository.listSchoolsWithFeeSetup();
    let generated = 0;
    let skipped = 0;

    for (const school of schools) {
      const result = await feeService.autoGenerateMonthlyFees(school.id, month, year);
      if (result.skipped) {
        skipped++;
        logger.logger.info(`[AutoVoucher] School ${school.id} skipped: ${result.reason}`);
      } else {
        generated += result.created || 0;
        logger.logger.info(
          `[AutoVoucher] School ${school.id}: ${result.created} voucher(s) created (due ${result.dueDay})`
        );
      }
    }

    logger.logger.info(
      `[AutoVoucher] Done — ${generated} voucher(s) created, ${skipped} school(s) skipped.`
    );
    return { success: true, month, year, generated, skipped };
  } catch (error) {
    logger.logger.error(`Error in Auto Voucher Job: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runAutoVoucherJob;
