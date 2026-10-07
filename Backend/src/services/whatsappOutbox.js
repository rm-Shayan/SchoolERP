import Logger from "../lib/utils/logger.js";
import prisma from "../config/db.js";
import { instanceNameFor, sendBranchMessage, isTransient, describeError } from "./whatsappProvider.js";

export { instanceNameFor };

/**
 * WhatsApp outbox — `emailOutbox.js` ka sibling, wahi atomic-claim semantics.
 *
 * Kaam: send fail ho to row PERSIST hoti hai (drop nahi), cron auto-retry karta hai.
 * Never throws — callers `await queueWhatsApp(...)` apne flow me safely laga sakte hain.
 *
 * Retry ke 2 level hain (email se zyada zaroori, kyunki WhatsApp me rate limit
 * aur network dono alag-alag cheezein hain):
 *   1. Inline — attempts 1..N, linear backoff, turant.
 *   2. Outbox — `PendingMessage` me persist, cron 15 min baad dobara try karta hai.
 *
 * Duplicate-send guard: har row ATOMIC claim hoti hai — `scheduledFor` ko
 * future me le jaate hue `status` ko NAHI badalte. Do replicas/cron ticks ek hi
 * row utha lein to pehla jeeta hai, dusra skip. Crash hone par row wedge nahi
 * hoti (scheduledFor guzar jata hai, dobara try hoti hai) — at-least-once,
 * duplicate nahi.
 */

const logger = new Logger("whatsapp-queue");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Generic failure — thodi der baad retry. */
const RETRY_SOON_MS = 15 * 60 * 1000;
/** Instant retry — network/Evolution 5xx (recover hota hai) jaldi. */
const RETRY_FAST_MS = 60 * 1000;
/** Iske baad permanent FAILED. */
const MAX_PENDING_ATTEMPTS = 5;

/**
 * Evolution ke transient errors turant wapas try ho sakte hain; baaki
 * (invalid number, banned, policy rejection) ka early retry bekar hai —
 * cooldown lamba rakho.
 */
function cooldownFor(err) {
  return isTransient(err) ? RETRY_FAST_MS : RETRY_SOON_MS;
}

function serializePayload(obj) {
  return JSON.stringify(obj);
}

function deserializePayload(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("payload not an object");
  return parsed;
}

/**
 * Ek WhatsApp message queue karo.
 *
 * @param {object} msgData
 * @param {string} msgData.schoolId   kis BRANCH ke instance se bhejna hai (branch scoping)
 * @param {string} [msgData.organizationId] tenant routing ke liye retry par
 * @param {string} msgData.to         normalized phone (digits only), ya phir normalize isme hota hai
 * @param {string} msgData.text       message body
 * @param {"CRITICAL"|"HIGH"|"NORMAL"|"LOW"} [msgData.priority]
 * @param {number} [attempts]   inline attempts (default 3)
 * @param {number} [timeoutMs]  request latency bound (0 = off)
 *
 * @returns {Promise<{queued:boolean, messageId?:string, error?:string}>}
 *          queued=false ka matlab row outbox me persist ho gayi, cron try karega.
 */
export const queueWhatsApp = async (msgData, attempts = 3, timeoutMs = 0) => {
  const { organizationId, schoolId, to, text, priority = "NORMAL", template, ...rest } = msgData;

  if (!schoolId) {
    logger.logger.error(`[WhatsApp] queue skipped — no schoolId (branch instance required) for ${to}`);
    return { queued: false, error: "Missing schoolId" };
  }

  const persist = async (error) => {
    try {
      const row = await prisma.pendingMessage.create({
        data: {
          channel: "WHATSAPP",
          organizationId: organizationId || null,
          schoolId: schoolId || null,
          recipientAddr: String(to || ""),
          payload: serializePayload({ to, text, template, ...rest }),
          priority,
          lastError: error,
          scheduledFor: new Date(Date.now() + RETRY_SOON_MS),
        },
      });
      return { queued: false, persistedId: row.id, error };
    } catch (e) {
      logger.logger.error(`[WhatsApp] outbox persist failed for ${to}: ${e.message}`);
      return { queued: false, error: `${error} (and outbox persist failed: ${e.message})` };
    }
  };

  const attemptSend = async () => {
    const send = () =>
      sendBranchMessage({ organizationId, schoolId, to, text, template });
    if (!timeoutMs) return send();
    let timer;
    try {
      return await Promise.race([
        send(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`WhatsApp timeout after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  let lastErr = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const info = await attemptSend();
      logger.logger.info(`[WhatsApp] sent to ${to} via ${instanceNameFor(schoolId)}: ${info?.key?.id || "ok"}`);
      return { queued: true, info };
    } catch (err) {
      lastErr = err;
      logger.logger.error(`WhatsApp attempt ${attempt}/${attempts} failed for ${to}: ${err.message}`);
      if (attempt < attempts) await sleep(cooldownFor(err) / Math.max(attempts, 1));
    }
  }

  logger.logger.error(`All WhatsApp attempts exhausted for ${to} — saving to outbox`);
  return persist(lastErr?.message || "Send failed");
};

/**
 * Outbox worker — PENDING messages utha kar priority order me retry karta hai.
 * Cron 15 min call karta hai. Returns summary for logging.
 */
export const retryPendingMessages = async (limit = 100) => {
  const rows = await prisma.pendingMessage.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: new Date() },
      attempts: { lt: MAX_PENDING_ATTEMPTS },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const summary = { total: rows.length, sent: 0, deferred: 0, failedPermanent: 0 };
  const inFlight = new Set();

  for (const row of rows) {
    if (inFlight.has(row.id)) {
      summary.deferred += 1;
      continue;
    }

    // ATOMIC CLAIM — sirf is batch me jeeta hua hi process karo.
    const claimed = await prisma.pendingMessage.updateMany({
      where: { id: row.id, status: "PENDING", scheduledFor: { lte: new Date() } },
      data: { scheduledFor: new Date(Date.now() + RETRY_SOON_MS) },
    });
    if (claimed.count === 0) {
      summary.deferred += 1;
      continue;
    }
    inFlight.add(row.id);

    let msg;
    try {
      msg = deserializePayload(row.payload);
    } catch {
      await prisma.pendingMessage.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: "Corrupt payload" },
      });
      summary.failedPermanent += 1;
      continue;
    }

    const attemptsSoFar = row.attempts + 1;

    let sentInfo = null;
    let lastErr = null;
    try {
      sentInfo = await sendBranchMessage({
        organizationId: row.organizationId || undefined,
        schoolId: row.schoolId,
        to: msg.to || row.recipientAddr,
        text: msg.text,
        template: msg.template || undefined,
      });
    } catch (err) {
      lastErr = err;
    }

    if (sentInfo) {
      await prisma.pendingMessage.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null, attempts: attemptsSoFar },
      });
      logger.logger.info(`[WhatsApp outbox] Retry OK #${row.id} -> ${msg.to}`);
      summary.sent += 1;
      continue;
    }

    const error = describeError(lastErr);
    const permanent = attemptsSoFar >= MAX_PENDING_ATTEMPTS;

    await prisma.pendingMessage.update({
      where: { id: row.id },
      data: {
        status: permanent ? "FAILED" : "PENDING",
        lastError: error.message,
        attempts: attemptsSoFar,
        scheduledFor: permanent ? new Date() : new Date(Date.now() + cooldownFor(lastErr)),
      },
    });

    if (permanent) {
      summary.failedPermanent += 1;
      logger.logger.error(`[WhatsApp outbox] PERMANENT FAIL #${row.id} -> ${msg.to}: ${error.message}`);
    } else {
      summary.deferred += 1;
    }
  }

  if (summary.total) {
    logger.logger.info(
      `[WhatsApp outbox] total=${summary.total} sent=${summary.sent} deferred=${summary.deferred} failed=${summary.failedPermanent}`
    );
  }

  return summary;
};

export const outboxConstants = {
  RETRY_SOON_MS,
  RETRY_FAST_MS,
  MAX_PENDING_ATTEMPTS,
};
