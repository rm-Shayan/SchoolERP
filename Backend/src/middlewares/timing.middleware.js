import Logger from "../lib/utils/logger.js";

const logger = new Logger("timing");

// Thresholds (ms) — tunable via env
const SLOW_THRESHOLD = Number(process.env.TIMING_SLOW_MS) || 500;
const CRITICAL_THRESHOLD = Number(process.env.TIMING_CRITICAL_MS) || 2000;

/**
 * Request timing middleware.
 *
 * Logs every API response with its duration in ms. Slow requests (>{SLOW_THRESHOLD}ms)
 * are logged at warn level; critically slow ones (>{CRITICAL_THRESHOLD}ms) at error level.
 * Fast requests log at debug level so production logs stay clean by default.
 *
 * Usage: app.use('/api/v1', timingMiddleware, routes)
 *
 * Timing data is also attached to res.locals.timing for downstream use
 * (e.g. response headers, audit).
 */
export function timingMiddleware(req, res, next) {
  const start = performance.now();

  res.on("finish", () => {
    const durationMs = performance.now() - start;
    const duration = Math.round(durationMs * 100) / 100; // 2 decimal places
    const { method, originalUrl } = req;
    const status = res.statusCode;
    const userId = req.user?.id || req.parent?.parentId || req.student?.studentId || "-";

    // Attach for downstream use (headers, audit)
    res.locals.timing = { durationMs: duration, status, method, url: originalUrl };

    // Color-coded log line: METHOD URL STATUS DURATION userId
    const msg = `${method} ${originalUrl} ${status} ${duration}ms user=${userId}`;

    if (durationMs >= CRITICAL_THRESHOLD) {
      logger.logger.error(`[SLOW] ${msg}`);
    } else if (durationMs >= SLOW_THRESHOLD) {
      logger.logger.warn(`[SLOW] ${msg}`);
    } else {
      logger.logger.debug(msg);
    }
  });

  next();
}
