import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import evolutionService from "../../services/evolution.service.js";
import { sendEmail } from "../../services/email.service.js";

const logger = new Logger("whatsapp-health-job");

/** Branch ko alert karne ke liye recipient: us branch ka active ADMIN, nahi to org owner. */
async function branchAlertEmail(organizationId, schoolId) {
  let user = await prisma.user.findFirst({
    where: { schoolId, role: "ADMIN", isActive: true },
    select: { email: true, name: true },
  });
  if (!user) {
    user = await prisma.user.findFirst({
      where: { organizationId, isOrganizationOwner: true, isActive: true },
      select: { email: true, name: true },
    });
  }
  return user?.email || null;
}

async function alertBranch(organizationId, schoolId, subject, text) {
  const to = await branchAlertEmail(organizationId, schoolId);
  if (!to) return;
  try {
    await sendEmail({ to, subject, text, organizationId, schoolId });
    logger.logger.info(`[Health] alert email sent to ${to}`);
  } catch (err) {
    logger.logger.error(`[Health] alert email failed to ${to}: ${err.message}`);
  }
}

/**
 * Har 5 minute WhatsApp device ka live state check karta hai.
 * - CONNECTED tha par ab open nahi → DB DISCONNECTED + branch admin ko email
 * - AWAITING_QR 10 min se zyada (QR expire, scan nahi hua) → DISCONNECTED + email
 */
export const runWhatsAppHealthJob = async () => {
  const rows = await prisma.whatsAppInstance.findMany({
    where: { state: { in: ["CONNECTED", "AWAITING_QR"] } },
    include: { school: { select: { name: true } } },
  });

  // Koi branch connected/awaiting nahi to health check bilkul nahi chalega.
  if (!rows || rows.length === 0) return;

  for (const row of rows) {
    try {
      const state = await evolutionService.connectionState(row.instanceName);

      if (row.state === "CONNECTED" && !state.connected) {
        await prisma.whatsAppInstance.update({
          where: { id: row.id },
          data: { state: "DISCONNECTED", isEnabled: false, lastError: "Device disconnected on WhatsApp side" },
        });
        await alertBranch(
          row.organizationId,
          row.schoolId,
          "WhatsApp disconnected - SchoolERP",
          `Branch "${row.school?.name || row.schoolId}" ka WhatsApp device disconnect ho gaya hai. Messages ab email fallback se ja rahe hain. Settings > Branch Credentials > WhatsApp se dobara connect karein.`
        );
        continue;
      }

      if (row.state === "AWAITING_QR") {
        const stale = Date.now() - new Date(row.updatedAt).getTime() > 10 * 60 * 1000;
        if (state.connected) {
          const live = await evolutionService.fetchInstance(row.instanceName);
          const phone = (live?.ownerJid || "").replace(/@.*$/, "") || row.phoneNumber;
          await prisma.whatsAppInstance.update({
            where: { id: row.id },
            data: { state: "CONNECTED", phoneNumber: phone || null, isEnabled: true, qrCode: null, lastConnectedAt: new Date(), lastError: null },
          });
        } else if (stale) {
          await prisma.whatsAppInstance.update({
            where: { id: row.id },
            data: { state: "DISCONNECTED", qrCode: null, lastError: "QR expire - user ne scan nahi kiya" },
          });
          await alertBranch(
            row.organizationId,
            row.schoolId,
            "WhatsApp QR expire - SchoolERP",
            `Branch "${row.school?.name || row.schoolId}" ka WhatsApp QR expire ho gaya hai aur connection nahi hua. Settings > Branch Credentials > WhatsApp se phir se QR banayein.`
          );
        }
      }
    } catch (err) {
      logger.logger.error(`[Health] check failed for ${row.instanceName}: ${err.message}`);
    }
  }
};

export default runWhatsAppHealthJob;
