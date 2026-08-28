import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("school-queue");

export const schoolImportQueue = new Queue("school-import", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

schoolImportQueue.on("error", (err) =>
  logger.logger.error(`[bullmq] Queue 'school-import' error: ${err.message}`)
);
