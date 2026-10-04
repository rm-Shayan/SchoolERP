// One-shot maintenance: drop cached portal/auth responses so freshly deployed
// code is not shadowed by entries written before a fix.
//
// The in-memory fallback in portalCache.js is per-process, so a restart clears
// it on its own. Redis is the store that survives restarts, hence this script.
// If Redis is unreachable there is nothing persistent to clear — say so and
// exit 0 rather than throwing, so it is safe to run in any deploy pipeline.
import "../src/config/env.js";
import redis from "../src/config/redis.js";

const PATTERNS = ["portal:*", "auth:user:*", "auth:children:*", "auth:parent:*"];

try {
  await redis.connect();
} catch {
  console.log("  Redis unreachable — no persistent cache to clear.");
  console.log("  (the in-memory fallback dies with the process, so a restart is enough)");
  process.exit(0);
}

let total = 0;
for (const p of PATTERNS) {
  const keys = await redis.keys(p);
  if (keys.length) {
    await redis.del(keys);
    console.log(`  ${p.padEnd(16)} deleted ${keys.length}`);
    total += keys.length;
  } else {
    console.log(`  ${p.padEnd(16)} nothing cached`);
  }
}
console.log(`  total keys cleared: ${total}`);
await redis.quit?.();
process.exit(0);