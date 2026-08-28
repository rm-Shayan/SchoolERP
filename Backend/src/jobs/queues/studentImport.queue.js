import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("student-import");

export const studentImportQueue = new Queue("student-import", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

studentImportQueue.on("error", (err) =>
  logger.logger.error(`[bullmq] Queue 'student-import' error: ${err.message}`)
);
