/**
 * Smart environment loader — MUST be the first import in src/index.js.
 *
 * Rule:
 *   NODE_ENV=local  →  Backend/dev.env   (local Postgres + local Docker Redis)
 *   anything else   →  Backend/.env      (production values / Neon + Upstash)
 *
 * Precedence (highest → lowest), dotenv never overrides set vars:
 *   1. Real environment variables (Docker `docker run -e`, systemd, etc.)
 *   2. `node --env-file=...` values from npm scripts
 *   3. The file chosen here
 *
 * In the production Docker image there is NO .env file inside the container
 * — secrets come from runtime env vars, so the missing file is silently
 * skipped. That is expected, not an error.
 */

import { config as dotenvConfig } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const isLocal = process.env.NODE_ENV === "local";
const envFile = isLocal ? "dev.env" : ".env";
const envPath = path.join(backendRoot, envFile);

if (existsSync(envPath)) {
  dotenvConfig({ path: envPath, quiet: true });
  if (process.env.ENV_LOADER_VERBOSE === "true") {
    console.log(`[env] loaded ${envFile} (NODE_ENV=${process.env.NODE_ENV || "unset"})`);
  }
}
// else: file missing → env vars are already the source of truth (Docker/prod).

// ── Timezone (cron + attendance automation) ──────────────────────────
// Production container default UTC hoti hai; school times (attendance
// cutoff/absent, fee reminder 9AM) PKT me hain. Bina is ke node-cron window
// (7-18 UTC = 12PM-11PM PKT) aur now.getHours() UTC dono PKT school times se
// mismatch ho jate hain → absent/late alerts miss. Explicit TZ env override
// kar sakta hai; warna Asia/Karachi default.
if (!process.env.TZ) process.env.TZ = process.env.CRON_TZ || "Asia/Karachi";
