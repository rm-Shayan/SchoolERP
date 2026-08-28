import { createClient } from "redis";
import Logger from "../lib/utils/logger.js";

const logger = new Logger("redis");

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,       // fail fast if Redis is unreachable
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis max reconnect attempts reached");
      return Math.min(retries * 200, 3000); // exponential backoff capped at 3s
    },
  },
});

redis.on("error", (err) => logger.logger.error(`Redis Error: ${err.message}`));
redis.on("connect", () => logger.logger.info("Redis Connected Successfully"));
redis.on("reconnecting", (delay) => logger.logger.info(`Redis reconnecting in ${delay}ms`));

// Self-connecting IIFE to ensure single redis instance is connected
(async () => {
  if (!redis.isOpen) {
    try {
      await redis.connect();
      // Ensure noeviction — prevents important cache/auth data from being evicted
      // under memory pressure. OOM errors are better than silent data loss.
      await redis.configSet("maxmemory-policy", "noeviction");
    } catch (err) {
      logger.logger.error(`Failed to connect Redis: ${err.message}`);
    }
  }
})();

export default redis;
