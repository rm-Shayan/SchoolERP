import Logger from "../../lib/utils/logger.js";
import { retryPendingEmails } from "../../services/emailOutbox.js";

const logger = new Logger("pending-email-job");

export const runPendingEmailJob = async () => {
  try {
    const summary = await retryPendingEmails(100);
    if (summary.total > 0) {
      logger.logger.info(
        `[Outbox] Processed ${summary.total}: sent=${summary.sent} deferred=${summary.deferred} permanentFailed=${summary.failedPermanent}`
      );
    }
  } catch (err) {
    logger.logger.error(`[Outbox] Retry job crashed: ${err.message}`);
  }
};

export default runPendingEmailJob;
