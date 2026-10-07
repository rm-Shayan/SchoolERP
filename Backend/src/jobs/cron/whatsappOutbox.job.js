import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { retryPendingMessages } from "../../services/whatsappOutbox.js";
import { sendEmail } from "../../services/email.service.js";

const logger = new Logger("whatsapp-outbox-job");

async function alertPlatform(subject, text) {
  try {
    const supers = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN", isActive: true },
      select: { email: true },
      take: 5,
    });
    for (const u of supers) {
      await sendEmail({ to: u.email, subject, text });
    }
  } catch (err) {
    logger.logger.error(`[Outbox] platform alert email failed: ${err.message}`);
  }
}

export const runWhatsAppOutboxJob = async () => {
  try {
    const summary = await retryPendingMessages(100);
    if (summary.total > 0) {
      logger.logger.info(
        `[WhatsApp outbox] total=${summary.total} sent=${summary.sent} deferred=${summary.deferred} failed=${summary.failedPermanent}`
      );
    }
  } catch (err) {
    logger.logger.error(`[WhatsApp outbox] job crashed: ${err.message}`);
    await alertPlatform(
      "WhatsApp outbox worker crashed - SchoolERP",
      `WhatsApp retry worker/job crash hua: ${err.message}. Pending messages queue me ho sakte hain - check karein.`
    );
  }
};

export default runWhatsAppOutboxJob;
