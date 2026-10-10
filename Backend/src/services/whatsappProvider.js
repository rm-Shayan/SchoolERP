import Logger from "../lib/utils/logger.js";
import prisma from "../config/db.js";
import evolutionService from "./evolution.service.js";
import metaCloudService from "./metaCloud.service.js";

/**
 * Provider dispatcher — branch ka `WhatsAppInstance.integration` decide karta
 * hai kaunse provider se send ho:
 *   - WHATSAPP_BAILEYS → Evolution API (QR/regular WhatsApp account)
 *   - WHATSAPP_CLOUD   → Meta Cloud API direct (test number / production)
 * Callers sirf `sendBranchMessage()` ko jante hain — provider switch iske
 * peeche chhupa hai.
 */

const logger = new Logger("whatsapp-provider");

/** Branch ka deterministic instance name (Evolution session key). */
export const instanceNameFor = (schoolId) => `sch-${schoolId}`;

/** Branch ka integration mode — default BAILEYS jab keh rah-i na ho. */
async function integrationFor(schoolId) {
  try {
    const inst = await prisma.whatsAppInstance.findFirst({
      where: { schoolId },
      select: { integration: true },
    });
    return inst?.integration || "WHATSAPP_BAILEYS";
  } catch (err) {
    logger.logger.warn(`[Provider] integration lookup failed for ${schoolId}: ${err.message}`);
    return "WHATSAPP_BAILEYS";
  }
}

export function isTransient(err) {
  return err && typeof err.transient === "boolean"
    ? err.transient
    : metaCloudService.isTransient(err);
}

export function describeError(err) {
  if (err && typeof err.transient === "boolean" && err.name === "MetaCloudError") {
    return metaCloudService.describeError(err);
  }
  return evolutionService.describeError(err);
}

/**
 * Send one message through the branch's chosen provider.
 *
 * @param {object} params
 * @param {string} params.schoolId
 * @param {string} [params.organizationId]
 * @param {string} params.to            normalized digits
 * @param {string} params.text          plain body (Baileys / free-form Cloud)
 * @param {object} [params.template]    { name, language, components } — Cloud template
 * @returns {Promise<{id?:string|null}>} resolves when Meta/Evolution accepted
 */
export const sendBranchMessage = async ({ schoolId, organizationId, to, text, template }) => {
  const integration = await integrationFor(schoolId);

  if (integration === "WHATSAPP_CLOUD") {
    if (template?.name) {
      return metaCloudService.sendTemplate({
        organizationId,
        schoolId,
        to,
        name: template.name,
        language: template.language,
        components: template.components,
      });
    }
    return metaCloudService.sendText({ organizationId, schoolId, to, text });
  }

  return evolutionService.sendText({ instanceName: instanceNameFor(schoolId), number: to, text });
};