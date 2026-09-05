import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import { defaultJobOptions } from "./jobDefaults.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("staff-import");

export const staffImportQueue = new Queue("staff-import", {
  connection: redisConnection,
  defaultJobOptions,
});

staffImportQueue.on("error", (err) =>
  logger.logger.error(`[bullmq] Queue 'staff-import' error: ${err.message}`)
);
