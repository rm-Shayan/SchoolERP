import { createClient } from "redis";
import Logger from "../lib/utils/logger.js";

const logger = new Logger("redis");

// Cloud Redis (Upstash) ka COLD TLS handshake 5s se zyada le sakta hai —
// pehle 5000ms par "Connection timeout" aa jata tha aur boot ~4s ruk jata tha,
// jabki reconnect turant successful hota tha. Ab env se tune hota hai,
// default 15s (local Docker par bhi chalta hai, sirf zyada patient hai).
const CONNECT_TIMEOUT = parseInt(process.env.REDIS_CONNECT_TIMEOUT || "15000", 10);

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: CONNECT_TIMEOUT, // fail fast-ish if Redis unreachable
    // JITNE bhi Redis DOWN ho, commands queue hue bina turant throw ho jayein.
    // (Default true hona = har cron job pehli redis.set() par HAMESHA hang ho
    // jata tha → fee/absent crons char bazari se kabhi chalte hi nahi the.)
    enableOfflineQueue: false,
    reconnectStrategy: (retries) => {
      // Redis DOWN hone par 10 attempt (attempt마다 200ms-3s) bahut zyada hain —
      // ab sirf 3 attempt karke ruk jao, server crash/busy spin na ho.
      if (retries > 3) return new Error("Redis max reconnect attempts reached");
      return Math.min(retries * 200, 1000); // exponential backoff capped at 1s
    },
  },
});

redis.on("error", (err) => logger.logger.error(`Redis Error: ${err.message}`));
redis.on("connect", () => logger.logger.info("Redis Connected Successfully"));
// redis v5 'reconnecting' event KOI argument nahi deta (socket.js: `emit('reconnecting')`),
// isliye pehle `${delay}ms` → "undefinedms" log hota tha. Backoff khud count karte hain —
// same formula reconnectStrategy ka, sirf readable log ke liye.
let reconnectAttempt = 0;
redis.on("reconnecting", () => {
  reconnectAttempt += 1;
  const delay = Math.min(reconnectAttempt * 200, 1000);
  logger.logger.info(`Redis reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);
});
redis.on("ready", () => {
  reconnectAttempt = 0;
  logger.logger.info("Redis ready — accepting commands");
});

// Self-connecting IIFE to ensure single redis instance is connected
(async () => {
  if (!redis.isOpen) {
    try {
      await redis.connect();
    } catch (err) {
      logger.logger.error(`Failed to connect Redis: ${err.message}`);
    }
  }
})();

export default redis;
