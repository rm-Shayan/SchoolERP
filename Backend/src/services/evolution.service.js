import Logger from "../lib/utils/logger.js";

/**
 * Evolution API client — ek hi jagah se HTTP calls.
 *
 * Yahin saare timeouts/status codes/E.164 formatting ek baar niptte hain;
 * service code ko raw `fetch` likhni ki zaroorat nahi.
 *
 * DO providers hain (Evolution 2.x):
 *   - `WHATSAPP_BAILEYS`    — QR/pairing-code pairing. PRODUCTION ke liye
 *                             (Meta ka chargeable Cloud API nahi, is liye free).
 *   - `WHATSAPP_CLOUD`      — Meta official test number. DEV/testing ke liye,
 *                             QR bilkul nahi chahiye.
 * Dono ke liye ye client same hai — sirf `integration` alag.
 *
 * Env:
 *   EVOLUTION_BASE_URL  (default http://localhost:8080)
 *   EVOLUTION_API_KEY   (Evolution ka AUTHENTICATION_API_KEY, `apikey` header)
 */

const logger = new Logger("evolution");

const DEFAULT_BASE_URL = "http://localhost:8080";

/** Reconnect/short-lived errors — outbox me turant retry bekar hai, backoff chahiye. */
const TRANSIENT_PATTERNS = [
  /fetch failed/i,
  /network/i,
  /econnrefused/i,
  /econnreset/i,
  /etimedout/i,
  /socket hang up/i,
  /429/,
  /50\d/,
];

export class EvolutionError extends Error {
  constructor(message, { status = 0, instanceName = null, transient = false, body = null } = {}) {
    super(message);
    this.name = "EvolutionError";
    this.status = status;
    this.instanceName = instanceName;
    this.transient = transient;
    this.body = body;
  }
}

function baseUrl() {
  const configured = process.env.EVOLUTION_BASE_URL;
  return (configured || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function apiKey() {
  return process.env.EVOLUTION_API_KEY || "";
}

function isTransient(err) {
  if (err instanceof EvolutionError && err.transient) return true;
  const msg = err?.message || "";
  return TRANSIENT_PATTERNS.some((p) => p.test(msg));
}

/**
 * Evolution API me number DIGITS-ONLY international format me jata hai.
 * `normalizePkPhone()` pehle se yehi deta hai, lekin yahan safety net hai kyunki
 * koi legacy/na-normalized value aa sakti hai.
 */
export function toEvolutionNumber(raw) {
  const digits = String(raw ?? "").replace(/\D+/g, "");
  if (!digits) throw new EvolutionError(`Cannot send — empty recipient number`);
  return digits;
}

async function request(path, { method = "GET", body = null, instanceName = null, timeoutMs = 15000 } = {}) {
  const url = `${baseUrl()}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (apiKey()) headers.apikey = apiKey();

  let timer;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    clearTimeout(timer);
    const transient = isTransient(err);
    throw new EvolutionError(`Evolution unreachable: ${err.message}`, { instanceName, transient });
  }

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const msg =
      payload?.response?.message ||
      payload?.message ||
      payload?.error ||
      text?.slice(0, 300) ||
      `HTTP ${res.status}`;
    throw new EvolutionError(`Evolution ${method} ${path} -> ${res.status}: ${msg}`, {
      status: res.status,
      instanceName,
      transient: res.status === 429 || res.status >= 500,
      body: payload,
    });
  }

  return payload;
}

/** Evolution error ko uske domain-ready form me decode karta hai (logging ke liye). */
function describe(err) {
  if (!(err instanceof EvolutionError)) return { message: err?.message || String(err), transient: false };
  return { message: err.message, transient: err.transient, status: err.status };
}

const evolutionService = {
  isTransient: (err) => isTransient(err),

  /** Server alive hai? Settings UI ka "Test connection" button isi se chalta hai. */
  async ping() {
    const started = Date.now();
    await request("/instance/fetchInstances", { timeoutMs: 6000 });
    return { ok: true, ms: Date.now() - started, baseUrl: baseUrl() };
  },

  /**
   * Instance banao. `name` deterministic rakho (`sch-<schoolId>`) taake
   * ek branch ke liye hamesha ek hi instance rahe — dobara create duplicate na bane.
   */
  async createInstance({ instanceName, integration = "WHATSAPP_BAILEYS" }) {
    // Evolution API expects the dash form ("WHATSAPP-BAILEYS"); DB + provider
    // layer use the underscore form ("WHATSAPP_BAILEYS").
    const apiIntegration = String(integration).replace(/_/g, "-");
    return request("/instance/create", {
      method: "POST",
      instanceName,
      body: {
        instanceName,
        integration: apiIntegration,
        qrcode: true,
      },
    });
  },

  /** Live instance record from Evolution (owner number/jid, status). */
  async fetchInstance(instanceName) {
    try {
      const data = await request(`/instance/fetchInstances`, { timeoutMs: 8000 });
      const list = Array.isArray(data) ? data : data?.instances || [];
      return list.find((i) => i.name === instanceName || i.instanceName === instanceName) || null;
    } catch (err) {
      logger.logger.warn(`[Evolution] fetchInstance failed for ${instanceName}: ${err.message}`);
      return null;
    }
  },

  /**
   * Connection state — `open` matlab paired & ready.
   * Note: response ka shape Evolution version par vary karta hai, is liye
   * dono possible shapes decode karte hain.
   */
  async connectionState(instanceName) {
    const data = await request(`/instance/connectionState/${encodeURIComponent(instanceName)}`, {
      instanceName,
    });
    const state = data?.instance?.state || data?.state || data?.connection || "unknown";
    return { state, connected: state === "open", raw: data };
  },

  /** QR (base64 png) — Baileys pair karte waqt. Cloud API par iski zaroorat nahi. */
  async getQr(instanceName) {
    const data = await request(`/instance/connect/${encodeURIComponent(instanceName)}`, {
      instanceName,
      timeoutMs: 25000,
    });
    let qr = data?.base64 || data?.qrcode?.base64 || data?.qrcode || null;
    if (qr && typeof qr === "string" && !qr.startsWith("data:image")) {
      // Evolution kabhi raw base64 deta hai — frontend img ke liye data URI chahiye
      qr = `data:image/png;base64,${qr.replace(/^data:.*;base64,/, "")}`;
    }
    return {
      qr,
      pairingCode: data?.pairingCode || data?.code || null,
      raw: data,
    };
  },

  /**
   * Text message bhejo. `number` ka E.164 normalization isi me hota hai.
   * Baileys chat-jid format (`5551234@s.whatsapp.net`) bhi accept karta hai.
   */
  async sendText({ instanceName, number, text, delay = 1200, quoted = null }) {
    const recipient = toEvolutionNumber(number);
    const payload = { number: recipient, text: String(text ?? ""), delay };
    if (quoted) payload.quoted = quoted;

    return request(`/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      instanceName,
      body: payload,
      timeoutMs: 20000,
    });
  },

  /**
   * Logout — WhatsApp session hata deta hai (device unlink), lekin
   * Evolution instance record rehta hai. QR dobara scan karke wapas pair ho sakta hai.
   */
  async logout(instanceName) {
    return request(`/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      instanceName,
    });
  },

  /**
   * DELETE — instance ka DB record + filesystem data dono uda deta hai.
   * Branch delete hone par yahi call hoti hai: koi orphan session nahi bachna chahiye.
   */
  async deleteInstance(instanceName) {
    return request(`/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: "DELETE",
      instanceName,
    });
  },

  /** Best-effort cleanup — failures ko call-stack me propagate nahi karna. */
  async safeDeleteInstance(instanceName) {
    try {
      await this.deleteInstance(instanceName);
      return { ok: true };
    } catch (err) {
      const d = describe(err);
      logger.logger.error(`[Evolution] deleteInstance "${instanceName}" failed: ${d.message}`);
      return { ok: false, error: d.message, transient: d.transient };
    }
  },

  describeError: describe,
};

export default evolutionService;
export { evolutionService };
