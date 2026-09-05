import "dotenv/config";
import http from "http";
import app from "./app.js";
import prisma from "./config/db.js";
import { initWebSocket, closeWebSocket, setDraining } from "./config/websocket.js";
import schedulerService from "./services/scheduler.service.js";
import { markReady } from "./config/readiness.js";

// dotenv loaded via import "dotenv/config" at top

// ── Startup timing ──────────────────────────────────────────────────────
// performance.timeOrigin = process boot timestamp.
// By the time index.js top-level runs, all static imports (app.js → Express,
// BullMQ workers are deferred, Prisma client, etc.) have finished.
// We measure from process start so the user sees the real wall-clock cost.
const T_BOOT = performance.timeOrigin;
const T_MODULE_IMPORTS_DONE = performance.now(); // relative to T_BOOT
const ms = (t) => `${Math.round(performance.now() - t)}ms`;

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const DRAIN_TIMEOUT_MS = 5_000;
let isShuttingDown = false;

// ------------------------------------------------------------------
// Graceful shutdown — called on SIGTERM / SIGINT
// ------------------------------------------------------------------
const shutdown = async (signal) => {
  if (isShuttingDown) return; // prevent double-fire from SIGTERM + SIGINT
  isShuttingDown = true;
  console.log(`\n🛑 ${signal} received — starting graceful shutdown…`);

  // Force-kill safety net: if teardown hangs, exit anyway
  const forceExit = setTimeout(() => {
    console.error(`⏰ Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS / 1000}s — forcing exit`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref(); // don't keep process alive on this timer

  try {
    // 1. Drain — flip /health to 503 so LB stops sending new traffic.
    //    Wait DRAIN_TIMEOUT_MS for existing LB health checks to fail
    //    and for in-flight requests to complete.
    setDraining();
    console.log(`   ⏳ Draining for ${DRAIN_TIMEOUT_MS / 1000}s — /health returning 503`);
    await new Promise((r) => setTimeout(r, DRAIN_TIMEOUT_MS));

    // 2. Stop HTTP server — reject new connections, finish in-flight
    await new Promise((resolve) => server.close(resolve));
    console.log("   ✅ HTTP server closed — no new connections accepted");

    // 3. Socket.io — tell clients to reconnect elsewhere, then close
    await closeWebSocket();
    console.log("   ✅ Socket.io shut down");

    // 4. BullMQ workers — finish current jobs, stop polling
    const workers = (await import("./jobs/index.js")).default;
    await Promise.all(workers.map((w) => w.close()));
    console.log("   ✅ BullMQ workers closed");

    // 5. Shared BullMQ Redis connection
    const { redisConnection } = await import("./lib/redis.connection.js");
    await redisConnection.quit();
    console.log("   ✅ BullMQ Redis connection closed");

    // 6. Prisma — close database connection pool
    await prisma.$disconnect();
    console.log("   ✅ Database connections closed");

    console.log("🟢 Graceful shutdown complete");
  } catch (err) {
    console.error(`❌ Error during shutdown: ${err.message}`);
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
};

// Register signal handlers early (before async work)
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// ------------------------------------------------------------------
// Boot
// ------------------------------------------------------------------
const start = async () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║           🚀 Starting School ERP            ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  ⏱  Module imports:      ${ms(T_MODULE_IMPORTS_DONE)} (from process start)`);

  // 1. HTTP server
  const tHttp = performance.now();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`  ⏱  HTTP server:         ${ms(tHttp)} (port ${PORT} open)`);

  // 2. Socket.io + Redis adapter
  const tSocket = performance.now();
  await initWebSocket(server);
  console.log(`  ⏱  Socket.io + Redis:   ${ms(tSocket)}`);

  // 3. Node-cron schedulers
  const tCron = performance.now();
  schedulerService.initSchedules();
  console.log(`  ⏱  Cron schedulers:     ${ms(tCron)}`);

  // ── Total time-to-listen ──────────────────────────────────────────
  const totalBoot = Math.round(performance.now() - T_MODULE_IMPORTS_DONE);
  console.log("  ─────────────────────────────────────────────");
  console.log(`  ✅ Server ready in ${totalBoot}ms — accepting traffic`);
  console.log("");

  // ── Background (non-blocking) ─────────────────────────────────────
  // 4. DB pool warmup
  const tDb = performance.now();
  const dbReady = prisma
    .$queryRaw`SELECT 1`
    .then(() => console.log(`  🔥 DB pool warmed up in ${ms(tDb)}`))
    .catch((err) => console.error(`  ❌ DB warmup failed: ${err.message}`));

  // 4b. Tenant storage creds cache warmup — 1 query, phir uploads memory se.
  //     Non-blocking: DB pool ke warm hone par fire-and-forget.
  const { warmupOrgStorageCache } = await import("./lib/utils/orgStorage.cache.js");
  const storageCacheReady = dbReady.then(() => warmupOrgStorageCache());

  // 5. BullMQ workers (lazy-loaded after port is open)
  const tWorkers = performance.now();
  const workersReady = (await import("./jobs/index.js")).default;
  console.log(`  ⚙️  BullMQ workers:      ${ms(tWorkers)} (${workersReady.length} workers)`);

  // Wait for DB warmup + storage cache, then mark the pod as ready for traffic
  await dbReady;
  await storageCacheReady;
  markReady();
  console.log(`  🟢 Readiness probe:    READY — this replica can accept traffic\n`);
};

start();