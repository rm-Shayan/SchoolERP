import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("admission-import");

export const admissionImportQueue = new Queue("admission-import", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

admissionImportQueue.on("error", (err) =>
  logger.logger.error(`[bullmq] Queue 'admission-import' error: ${err.message}`)
);
