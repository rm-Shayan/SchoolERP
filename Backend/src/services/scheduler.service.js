import cron from "node-cron";
import Logger from "../lib/utils/logger.js";
import { runLateMarkJob } from "../jobs/cron/lateMark.job.js";
import { runAttendanceAlertJob } from "../jobs/cron/attendanceAlert.job.js";
import { runFeeReminderJob } from "../jobs/cron/feeReminder.job.js";
import { runCleanupJob } from "../jobs/cron/cleanup.job.js";
import { runAutoVoucherJob } from "../jobs/cron/autoVoucher.job.js";
import { runDueChargesJob } from "../jobs/cron/dueCharges.job.js";
import { runHomeworkCleanupJob } from "../jobs/cron/homeworkCleanup.job.js";
import { runPendingEmailJob } from "../jobs/cron/pendingEmail.job.js";

const logger = new Logger("scheduler-service");

class SchedulerService {
  initSchedules() {
    logger.logger.info("Initializing Automated Node-Cron Schedulers...");

    // Attendance automation (Mon-Sat, every 15 min)
    cron.schedule("*/15 7-18 * * 1-6", async () => {
      logger.logger.info("[CRON] attendance automation (late mark + alerts)");
      await runLateMarkJob();
      await runAttendanceAlertJob();
    });

    // Daily Fee Reminder (9:00 AM)
    cron.schedule("0 9 * * *", async () => {
      logger.logger.info("[CRON] daily fee reminder");
      await runFeeReminderJob();
    });

    // Daily Due Charges (9:15 AM)
    cron.schedule("15 9 * * *", async () => {
      logger.logger.info("[CRON] due charges calculation");
      await runDueChargesJob();
    });

    // Homework Cleanup (daily 2:00 AM)
    cron.schedule("0 2 * * *", async () => {
      logger.logger.info("[CRON] homework year-end cleanup");
      await runHomeworkCleanupJob();
    });

    // Data Cleanup (daily 3:00 AM)
    cron.schedule("0 3 * * *", async () => {
      logger.logger.info("[CRON] data cleanup");
      await runCleanupJob();
    });

    // Monthly Auto Voucher (1st of month, 12:05 AM)
    cron.schedule("5 0 1 * *", async () => {
      logger.logger.info("[CRON] auto voucher generation");
      await runAutoVoucherJob();
    });

    // Pending Email Retry (every 30 min)
    cron.schedule("*/30 * * * *", async () => {
      await runPendingEmailJob();
    });

    logger.logger.info("Cron Schedulers registered successfully.");
  }
}

export default new SchedulerService();
