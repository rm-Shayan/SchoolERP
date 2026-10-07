import Logger from "../lib/utils/logger.js";
import prisma from "../config/db.js";
import { decryptSecret } from "../lib/utils/secretBox.js";

/**
 * Meta WhatsApp Cloud API — direct Graph API integration (evolution API ki
 * zaroorat NAHI). Branch ka number `OrgSecrets` (category WHATSAPP) me store
 * hota hai; dev me global WHATSAPP_META_* env se fallback chalta hai.
 *
 * Record flow: template messages (hamesha allowed) vs free-form text (sirf
 * 24h customer window me — warna 131047). SchoolERP ke PROACTIVE alerts ke
 * liye sendTemplate() use karna hota hai.
 */

const logger = new Logger("meta-cloud");

const GRAPH_BASE = process.env.WHATSAPP_META_GRAPH_URL || "https://graph.facebook.com";
const GRAPH_VERSION = process.env.WHATSAPP_META_VERSION || "v25.0";

const ENV_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN || "";
const ENV_PHONE_NUMBER_ID = process.env.WHATSAPP_META_PHONE_NUMBER_ID || "";

/** Meta codes that are worth an early retry. Everything 13xxxx is a policy
 *  rejection and retrying quickly is pointless. */
const TRANSIENT_CODES = new Set([1, 2, 130429, 130503, 131048]);

export class MetaCloudError extends Error {
  constructor(code, message, details = "", transient = false) {
    super(message || `Meta error ${code}`);
    this.name = "MetaCloudError";
    this.code = code;
    this.details = details;
    this.transient = Boolean(
      transient || (code && TRANSIENT_CODES.has(code)) || !Number.isInteger(code)
    );
  }
}

/** Branch ki WHATSAPP creds — OrgSecrets row, phir dev env fallback. */
async function branchCreds({ organizationId, schoolId }) {
  if (organizationId && schoolId) {
    try {
      const row = await prisma.orgSecrets.findFirst({
        where: { organizationId, schoolId, category: "WHATSAPP" },
        select: { data: true },
      });
      if (row?.data) {
        const d = row.data;
        const accessToken = d.accessTokenEnc ? decryptSecret(d.accessTokenEnc) : null;
        if (accessToken && d.phoneNumberId) {
          return { accessToken, phoneNumberId: String(d.phoneNumberId) };
        }
      }
    } catch (err) {
      logger.logger.error(`[Meta] credential lookup failed: ${err.message}`);
    }
  }
  if (ENV_TOKEN && ENV_PHONE_NUMBER_ID) {
    return { accessToken: ENV_TOKEN, phoneNumberId: ENV_PHONE_NUMBER_ID };
  }
  return null;
}

async function graphPost(accessToken, phoneNumberId, payload) {
  const res = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    const errCode = parsed?.error?.code;
    throw new MetaCloudError(
      errCode,
      parsed?.error?.error_data?.details || parsed?.error?.message || `HTTP ${res.status}`,
      parsed?.error?.message || "",
      errCode ? TRANSIENT_CODES.has(errCode) : res.status >= 500
    );
  }
  return res.json();
}

class MetaCloudService {
  isTransient(err) {
    return err instanceof MetaCloudError ? err.transient : Boolean(err?.code);
  }

  describeError(err) {
    if (err instanceof MetaCloudError) {
      return { code: err.code, message: err.message, transient: err.transient, raw: err };
    }
    return { code: err?.code || null, message: err?.message || "Unknown Meta error", transient: true, raw: err };
  }

  /** Verify the branch's Meta credentials via GET /{phone_number_id}. */
  async verifyConnection({ organizationId, schoolId }) {
    const creds = await branchCreds({ organizationId, schoolId });
    if (!creds) return { ok: false, reason: "No Meta credentials configured" };
    try {
      const res = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${creds.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const parsed = await res.json().catch(() => ({}));
        throw new MetaCloudError(parsed?.error?.code, parsed?.error?.message || `HTTP ${res.status}`);
      }
      const info = await res.json();
      return {
        ok: true,
        displayPhoneNumber: info.display_phone_number,
        verifiedName: info.verified_name,
        codeVerificationStatus: info.code_verification_status,
        qualityRating: info.quality_rating,
        phoneNumberId: creds.phoneNumberId,
      };
    } catch (err) {
      const desc = this.describeError(err);
      return { ok: false, reason: desc.message, transient: desc.transient };
    }
  }

  /** Send an approved template (the ONLY reliable channel for proactive
   *  messages — free-form needs an open 24h customer window). */
  async sendTemplate({ organizationId, schoolId, to, name, language = "en", components = [] }) {
    const creds = await branchCreds({ organizationId, schoolId });
    if (!creds) throw new MetaCloudError(0, "No Meta WhatsApp credentials configured for this branch");
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name,
        language: { code: language },
        ...(components?.length ? { components } : {}),
      },
    };
    const info = await graphPost(creds.accessToken, creds.phoneNumberId, payload);
    return { id: info?.messages?.[0]?.id || null, waId: info?.contacts?.[0]?.wa_id || null };
  }

  /** Free-form text — only valid inside the 24h customer service window. */
  async sendText({ organizationId, schoolId, to, text }) {
    const creds = await branchCreds({ organizationId, schoolId });
    if (!creds) throw new MetaCloudError(0, "No Meta WhatsApp credentials configured for this branch");
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: String(text) },
    };
    const info = await graphPost(creds.accessToken, creds.phoneNumberId, payload);
    return { id: info?.messages?.[0]?.id || null, waId: info?.contacts?.[0]?.wa_id || null };
  }
}

export default new MetaCloudService();