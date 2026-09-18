import cron from "node-cron";
import Logger from "../lib/utils/logger.js";
import redis from "../config/redis.js";
import { runLateMarkJob, runStartupCatchup } from "../jobs/cron/lateMark.job.js";
import { runAttendanceAlertJob } from "../jobs/cron/attendanceAlert.job.js";
import { runFeeReminderJob } from "../jobs/cron/feeReminder.job.js";
import { runCleanupJob } from "../jobs/cron/cleanup.job.js";
import { runAutoVoucherJob } from "../jobs/cron/autoVoucher.job.js";
import { runDueChargesJob } from "../jobs/cron/dueCharges.job.js";
import { runHomeworkCleanupJob } from "../jobs/cron/homeworkCleanup.job.js";
import { runConductCleanupJob } from "../jobs/cron/conductCleanup.job.js";
import { runExamCleanupJob } from "../jobs/cron/examCleanup.job.js";
import { runAttendanceCleanupJob } from "../jobs/cron/attendanceCleanup.job.js";
import { runFeeArchiveJob } from "../jobs/cron/feeArchive.job.js";
import { runPendingEmailJob } from "../jobs/cron/pendingEmail.job.js";
import { runPtmCleanupJob } from "../jobs/cron/ptmCleanup.job.js";
import { runStudyMaterialCleanupJob } from "../jobs/cron/studyMaterialCleanup.job.js";
import { runAcademicYearRolloverJob } from "../jobs/cron/academicYearRollover.job.js";

const logger = new Logger("scheduler-service");

// ── Distributed cron lock (Redis SET NX EX) ──
// Multi-replica deployments me har instance node-cron chalata hai — bina lock
// ke ek hi job (fee reminder, attendance alert, pending-email retry) har
// replica se DUPLICATE bhejti hai. Lock jeetne wala hi job chalaata hai.
//
// Redis DOWN hai to enableOfflineQueue=false ki wajah se set() turant throw
// karta hai. Aise me ham lock skipp karke job phir bhi chalate hain (no-lock
// fallback) taake fee/absent alerts kabhi silent-fail na hone. Risk: Redis
// down hone par multi-instance me duplicate run — acceptable, single-better
// than "jobs kabhi na chalein".
async function withJobLock(name, seconds, fn) {
  const key = `cron:lock:${name}`;
  let acquired = false;
  let lockHeld = false;
  try {
    const res = await redis.set(key, "1", { NX: true, EX: seconds });
    acquired = res === "OK";
    lockHeld = res === null;
  } catch (err) {
    // Redis down → lock check impossible. Job ko SKIP mat karo (warna fee/
    // absent alerts kabhi na chalein); bina lock chalao. Multi-instance me
    // rare duplicate acceptable hai — silent "never fire" se behtar.
    logger.logger.warn(`[CRON] ${name} — Redis unavailable (${err.message}); running WITHOUT lock`);
  }
  if (lockHeld) {
    logger.logger.info(`[CRON] ${name} skipped — another instance holds the lock`);
    return;
  }
  try {
    await fn();
  } catch (err) {
    logger.logger.error(`[CRON] ${name} failed: ${err.message}`);
  } finally {
    if (acquired) {
      try { await redis.del(key); } catch { /* release best-effort */ }
    }
  }
}

const every15Min = "*/15 7-18 * * 1-6";
const lockFns = {
  attendance: () => withJobLock("attendance", 840, async () => {
    await runLateMarkJob();
    await runAttendanceAlertJob();
  }),
  feeReminder: () => withJobLock("fee-reminder", 3600, runFeeReminderJob),
  dueCharges: () => withJobLock("due-charges", 3600, runDueChargesJob),
  homeworkCleanup: () => withJobLock("homework-cleanup", 3600, runHomeworkCleanupJob),
  conductCleanup: () => withJobLock("conduct-cleanup", 3600, runConductCleanupJob),
  examCleanup: () => withJobLock("exam-cleanup", 3600, runExamCleanupJob),
  attendanceCleanup: () => withJobLock("attendance-cleanup", 3600, runAttendanceCleanupJob),
  feeArchive: () => withJobLock("fee-archive", 3600, runFeeArchiveJob),
  cleanup: () => withJobLock("cleanup", 3600, runCleanupJob),
  autoVoucher: () => withJobLock("auto-voucher", 3600, runAutoVoucherJob),
  pendingEmail: () => withJobLock("pending-email", 2850, runPendingEmailJob),
  ptmCleanup: () => withJobLock("ptm-cleanup", 3600, runPtmCleanupJob),
  studyMaterialCleanup: () => withJobLock("study-material-cleanup", 3600, runStudyMaterialCleanupJob),
  academicYearRollover: () => withJobLock("academic-year-rollover", 3600, runAcademicYearRolloverJob),
};

class SchedulerService {
  async initSchedules() {
    logger.logger.info("Initializing Automated Node-Cron Schedulers...");

    // Server restart par agar aaj ka late/absent mark nahi hua to catchup karo.
    // node-cron missed executions recover nahi karta — ye startup pe ek baar
    // chalega taake server down hone par bhi attendance mark ho jaye.
    try {
      await runStartupCatchup();
    } catch (err) {
      logger.logger.error(`[Startup Catchup] Failed: ${err.message}`);
    }

    // Attendance automation (Mon-Sat, every 15 min)
    cron.schedule(every15Min, lockFns.attendance);

    // Daily Fee Reminder (9:00 AM)
    cron.schedule("0 9 * * *", lockFns.feeReminder);

    // Daily Due Charges (9:15 AM)
    cron.schedule("15 9 * * *", lockFns.dueCharges);

    // Homework Cleanup (daily 2:00 AM)
    cron.schedule("0 2 * * *", lockFns.homeworkCleanup);

    // Conduct Remarks Cleanup (daily 2:15 AM)
    cron.schedule("15 2 * * *", lockFns.conductCleanup);

    // Exam + Terms Cleanup (daily 2:30 AM)
    cron.schedule("30 2 * * *", lockFns.examCleanup);

    // Attendance Year-End Archive (daily 2:45 AM)
    cron.schedule("45 2 * * *", lockFns.attendanceCleanup);

    // Data Cleanup (daily 3:00 AM)
    cron.schedule("0 3 * * *", lockFns.cleanup);

    // Fee Year-End Archive (daily 3:30 AM) — PAID records only
    cron.schedule("30 3 * * *", lockFns.feeArchive);

    // PTM Sessions Cleanup (daily 3:40 AM)
    cron.schedule("40 3 * * *", lockFns.ptmCleanup);

    // Study Material Cleanup (daily 3:50 AM)
    cron.schedule("50 3 * * *", lockFns.studyMaterialCleanup);

    // Academic Year Auto-Rollover (daily 12:10 AM)
    cron.schedule("10 0 * * *", lockFns.academicYearRollover);

    // Monthly Auto Voucher (1st of month, 12:05 AM)
    cron.schedule("5 0 1 * *", lockFns.autoVoucher);

    // Pending Email Retry (every 30 min)
    cron.schedule("*/30 * * * *", lockFns.pendingEmail);

    logger.logger.info("Cron Schedulers registered successfully.");
  }
}

export default new SchedulerService();
