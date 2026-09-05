import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.connection.js";
import { defaultJobOptions } from "./jobDefaults.js";
import Logger from "../../lib/utils/logger.js";

const logger = new Logger("organization-queue");

export const organizationImportQueue = new Queue("organization-import", {
  connection: redisConnection,
  defaultJobOptions,
});

export const organizationDeleteQueue = new Queue("organization-delete", {
  connection: redisConnection,
  defaultJobOptions,
});

const onQueueError = (queueName) => (err) =>
  logger.logger.error(`[bullmq] Queue '${queueName}' error: ${err.message}`);

organizationImportQueue.on("error", onQueueError("organization-import"));
organizationDeleteQueue.on("error", onQueueError("organization-delete"));
