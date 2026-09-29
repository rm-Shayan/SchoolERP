/**
 * sync-from-neon.js — PRODUCTION → LOCAL one-way data sync.
 *
 * Kya karta hai:
 *   Neon (production Postgres) ke schema + data ko local Docker Postgres me
 *   copy karta hai, taake local dev me asli production data dikhe.
 *
 * Safety:
 *   1. Sirf PRODUCTION → LOCAL jaata hai. Kabhi ulta nahi.
 *   2. Source localhost nahi ho sakta, target hamesha localhost hona chahiye.
 *   3. Target DB ka schema DROP hokar replace hota hai — local me kuch
 *      important ho to pehle backup le lo.
 *   4. Destructive action ke liye --yes flag zaroori hai (warna dry-run).
 *   5. Temp dump file ka path fix hai (dump me symlink attack ka koi khatra
 *      nahi kyunki file hum khud banate hain aur turant delete karte hain).
 *
 * Usage:
 *   npm run sync:neon            # pehle dry-run (kuch delete nahi karta)
 *   npm run sync:neon -- --yes   # asli sync
 *   node --env-file=dev.env scripts/sync-from-neon.js [--yes]
 *
 * Source connection order (pehli milti hai):
 *   1. --source <url> flag / NEON_SYNC_SOURCE env
 *   2. .env ki DATABASE_URL (aap ki real Neon URL)
 * Target:
 *   dev.env ki DATABASE_URL (local Postgres)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync, statSync, openSync, closeSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yesFlag = process.argv.includes("--yes");
const srcFlagIdx = process.argv.indexOf("--source");

// ── helpers ────────────────────────────────────────────────────────────
function parseEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseUrl(raw) {
  const m = String(raw || "").match(
    /^postgres(?:ql)?:\/\/([^:@/]+):([^@]+)@([^:/?#]+)(?::(\d+))?\/([^?]+)/
  );
  if (!m) return null;
  return { user: m[1], password: m[2], host: m[3], port: m[4] || "5432", db: m[5], raw };
}

function die(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}

function closeSafe(fd) {
  try { if (typeof fd === "number" && fd >= 0) closeSync(fd); } catch { /* already closed */ }
}

// ── resolve source (Neon) aur target (local) ───────────────────────────
const sourceRaw =
  (srcFlagIdx > -1 ? process.argv[srcFlagIdx + 1] : null) ||
  process.env.NEON_SYNC_SOURCE ||
  parseEnvFile(path.join(backendRoot, ".env")).DATABASE_URL;
const targetRaw = parseEnvFile(path.join(backendRoot, "dev.env")).DATABASE_URL;

const src = parseUrl(sourceRaw);
const tgt = parseUrl(targetRaw);

console.log("== Neon → Local sync ==");
console.log(`source: ${src ? `${src.user}@${src.host}:${src.port}/${src.db}` : "INVALID"}`);
console.log(`target: ${tgt ? `${tgt.user}@${tgt.host}:${tgt.port}/${tgt.db}` : "INVALID"}`);

// ── SAFETY GUARDS ──────────────────────────────────────────────────────
if (!src || !tgt) die("Connection URLs parse nahi huin.");
if (tgt.host !== "localhost" && tgt.host !== "127.0.0.1") {
  die(`target localhost nahi hai (${tgt.host}) — sirf local DB par chal sakta hai.`);
}
if (src.host === "localhost" || src.host === "127.0.0.1") {
  die("source khud localhost hai — Neon → local sync ka matlab hi khatam.");
}
if (!yesFlag) {
  console.log("\n⚠️  Ye target DB ka data REPLACE karega. Dry-run mode — asli sync ke liye --yes lagao:");
  console.log("   npm run sync:neon -- --yes");
  process.exit(0);
}

// ── [1/4] dump from Neon (pg_dump DOCKER container se — host par Postgres
//     tools install hone ki zaroorat nahi) ──────────────────────────────
console.log("\n[1/4] Neon se dump le raha hoon (schema + data, Docker pg_dump)…");
const dumpFile = path.join(backendRoot, "tmp-neon-dump.sql");
if (existsSync(dumpFile)) unlinkSync(dumpFile);

// libpq conninfo — password temp docker env-file se (cmdline/logs me kabhi nahi)
// pg_dump version >= server version hona zaroori hai → postgres:18 image (Neon v18)
const connInfo = `host=${src.host} port=${src.port} dbname=${src.db} user=${src.user} sslmode=require`;
const envFile = path.join(backendRoot, "tmp-pg-env");
writeFileSync(envFile, `PGPASSWORD=${src.password}\n`, { flag: "w" });
let dumpFd;
try {
  dumpFd = openSync(dumpFile, "w");
  execFileSync("docker", [
    "run", "--rm", "--env-file", envFile,
    "postgres:18-alpine",
    "pg_dump",
    "--no-owner", "--no-privileges",
    // _prisma_migrations JAAN BOOJH KAR copy hoti hai: schema reset ke baad
    // local ki apni history waise bhi nahi bachti — bina iske agli baar
    // 'migrate deploy' existing tables par fail ho jata.
    "-d", connInfo,
  ], { stdio: ["ignore", dumpFd, "inherit"] });
} catch (err) {
  closeSafe(dumpFd);
  unlinkSync(envFile);
  die(`pg_dump (docker) fail hua: ${err.message.replace(src.password, "<hidden>")}`);
}
closeSafe(dumpFd);
unlinkSync(envFile);
const mb = statSync(dumpFile).size / 1024 / 1024;
console.log(`   dump ready: ${mb.toFixed(1)} MB`);

// ── container ready check ──────────────────────────────────────────────
try {
  execFileSync("docker", ["inspect", "-f", "{{.State.Running}}", "schoolerp-postgres"], { stdio: "pipe" });
} catch {
  die("schoolerp-postgres container nahi chal raha. Pehle:  docker compose up -d  (Backend folder me)");
}

// (purana host-pg_dump path hata diya gaya — ab hamesha docker pg_dump)──────────────────────────────────────────────
// ── [2/4] target schema reset ──────────────────────────────────────────
console.log("\n[2/4] Local DB ka schema reset (drop schema public)…");
execFileSync("docker", [
  "exec", "schoolerp-postgres", "psql",
  "-U", "postgres", "-d", tgt.db,
  "-v", "ON_ERROR_STOP=1",
  "-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
], { stdio: ["ignore", "ignore", "inherit"] });

// ── [3/4] restore into local ───────────────────────────────────────────
console.log("\n[3/4] Local me restore (single transaction)…");
execFileSync("docker", [
  "exec", "-i", "schoolerp-postgres", "psql",
  "-U", "postgres", "-d", tgt.db,
  "-v", "ON_ERROR_STOP=1", "-1",
  "-f", "-",                                  // SQL stdin se
], { input: readFileSync(dumpFile), stdio: ["pipe", "ignore", "inherit"] });

// ── [4/4] verify ───────────────────────────────────────────────────────
console.log("\n[4/4] Verify (row counts)…");
// Prisma tables quoted PascalCase names use karti hain ("User", not users)
const verifySql =
  'SELECT \'User\', count(*) FROM "User" UNION ALL ' +
  'SELECT \'School\', count(*) FROM "School" UNION ALL ' +
  'SELECT \'Student\', count(*) FROM "Student" UNION ALL ' +
  'SELECT \'Section\', count(*) FROM "Section" ORDER BY 1;';
let out = "";
try {
  out = execFileSync("docker", [
    "exec", "schoolerp-postgres", "psql",
    "-U", "postgres", "-d", tgt.db, "-tA", "-c", verifySql,
  ], { encoding: "utf8" });
} catch {
  console.log("   (verify queries fail huin — tables ke naam alag ho sakte hain, skip)");
}
if (out.trim()) console.log(out.trim().split("\n").map((l) => `   ${l}`).join("\n"));

// ── cleanup + next steps ───────────────────────────────────────────────
unlinkSync(dumpFile);
console.log("\n✅ Sync complete — local me ab production ka data hai.");
console.log("   Server chalao:  NODE_ENV=local npm run dev");
console.log("   (temp dump file delete ho gayi)");
