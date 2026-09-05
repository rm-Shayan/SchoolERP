/**
 * Shared BullMQ job defaults — Upstash safe.
 *
 * removeOnComplete: true → job data delete on success
 * removeOnFail: { age: 86400, count: 10 } → delete after 24h OR keep max 10
 *   (prevents failed job accumulation eating Upstash 256MB limit)
 */

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: true,
  removeOnFail: { age: 86400, count: 10 },
};
