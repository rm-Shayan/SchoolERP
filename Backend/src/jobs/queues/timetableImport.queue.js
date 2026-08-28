import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("timetable-import");

export const timetableImportQueue = new Queue("timetable-import", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

timetableImportQueue.on("error", (err) =>
  logger.logger.error(`[bullmq] Queue 'timetable-import' error: ${err.message}`)
);
