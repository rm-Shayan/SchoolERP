import feeService from "../../modules/fee/fee.service.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("fee-reminder-job");

/**
 * Daily fee reminder job (PRD §4 — "Due date se pehle automatic reminder; overdue pe bhi").
 *
 * 1. PRE-DUE: due date se 3 din pehle (0-3 din baqi) parents ko ek reminder
 *    (FeeRecord.preDueReminderSentAt dedup — sirf EK Dafa).
 * 2. OVERDUE: past-due unpaid records OVERDUE mark karta hai aur har parent ko
 *    sirf ek overdue message bhejta hai (FeeRecord.reminderSentAt dedup).
 *
 * Pre-due / manual reminders ab bhi FINANCE panel se "Send Reminders" ya
 * per-record "Remind" action se bheje ja sakte hain.
 */
export async function runFeeReminderJob() {
  logger.logger.info("Starting Daily Fee Reminder Job...");
  try {
    const preDue = await feeService.sendPreDueReminders();
    logger.logger.info(`[Fee Reminder] Pre-due: ${preDue.preDueRemindersSent} reminder(s) sent.`);

    const result = await feeService.runOverdueSweep();
    logger.logger.info(
      `[Fee Reminder] Overdue sweep: ${result.markedOverdue} record(s) marked OVERDUE, ${result.overdueRemindersSent} once-only reminder(s) sent.`
    );
    return { success: true, ...preDue, ...result };
  } catch (error) {
    logger.logger.error(`Error in Fee Reminder Job: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default runFeeReminderJob;
