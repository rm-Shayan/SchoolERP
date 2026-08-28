import Logger from "../lib/utils/logger.js";

const logger = new Logger("emit-buffer");

// --- Pending emit counter ------------------------------------------------
// Each call to trackEmit() increments; each flush/decrement brings it down.
// When the counter reaches zero and someone is waiting (drainEmits), we
// resolve their promise so closeWebSocket can proceed.
let pending = 0;
let waiters = []; // resolve functions parked by drainEmits()

const EMIT_DRAIN_TIMEOUT_MS = 5_000;

/** Call this BEFORE io.to(room).emit(). */
export const trackEmitStart = () => { pending++; };

/**
 * Call this AFTER io.to(room).emit().
 * Hooks into each target socket's "flush" event so we know when packets
 * hit the wire. Falls back to a timeout if a socket disconnects before
 * flushing.
 */
export const trackEmitFlush = (room, io) => {
  if (!io || pending === 0) return;

  // Collect all sockets in the target room
  const roomSockets = io.sockets.adapter.rooms.get(room);
  if (!roomSockets || roomSockets.size === 0) {
    trackEmitEnd();
    return;
  }

  let flushed = 0;
  const total = roomSockets.size;

  const onDone = () => {
    flushed++;
    if (flushed >= total) trackEmitEnd();
  };

  for (const socketId of roomSockets) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) { onDone(); continue; }
    sock.once("flush", onDone);
    sock.once("disconnect", onDone);
  }

  // Safety timeout — don't block forever on a stuck socket
  setTimeout(() => {
    if (flushed < total) {
      logger.logger.warn(`Emit drain safety timeout — ${total - flushed} socket(s) did not flush`);
      flushed = total;
      trackEmitEnd();
    }
  }, EMIT_DRAIN_TIMEOUT_MS).unref();
};

const trackEmitEnd = () => {
  pending = Math.max(0, pending - 1);
  if (pending === 0 && waiters.length > 0) {
    for (const resolve of waiters) resolve();
    waiters = [];
  }
};

/**
 * Wait for all in-flight emits to flush to clients.
 * Returns a promise that resolves when the counter hits zero or after
 * EMIT_DRAIN_TIMEOUT_MS — whichever comes first.
 */
export const drainEmits = () => {
  if (pending === 0) {
    logger.logger.info("No pending emits — drain complete");
    return Promise.resolve();
  }
  logger.logger.info(`Draining ${pending} in-flight emit(s)…`);
  return new Promise((resolve) => {
    waiters.push(resolve);
    setTimeout(() => {
      // Remove ourselves from waiters if we're still pending
      const idx = waiters.indexOf(resolve);
      if (idx !== -1) {
        waiters.splice(idx, 1);
        logger.logger.warn(`Emit drain timed out with ${pending} pending — proceeding`);
        resolve();
      }
    }, EMIT_DRAIN_TIMEOUT_MS).unref();
  });
};
