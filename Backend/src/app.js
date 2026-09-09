import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import Logger from "./lib/utils/logger.js"; 
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import "./services/storage.service.js"; // side-effect: ensures upload dirs exist
// BullMQ workers lazy-loaded in index.js AFTER server.listen()
// so the HTTP port opens fast. Workers connect to Redis in background.

import routes from "./routes/index.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import { timingMiddleware } from "./middlewares/timing.middleware.js";
import { securityHeaders } from "./middlewares/security.middleware.js";
import { corsOrigin } from "./config/cors.js";
import { getSocketStatus, isDraining } from "./config/websocket.js";
import { metricsHandler } from "./config/metrics.js";
import { isReady } from "./config/readiness.js";
import { getRedisStats, getRedisInfo } from "./config/redisStats.js";
import { requestContextMiddleware } from "./lib/requestContext.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Trust first proxy — required for express-rate-limit to read X-Forwarded-For
// accurately. Without this, rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// when a reverse proxy (nginx, load balancer) forwards client IPs.
app.set('trust proxy', 1);

// 1. Logger instance Initialization
const appLogger = new Logger("app-service");

// 2. Compression — gzip/deflate all responses (JSON, text, HTML).
// Cuts bandwidth ~60-70% and reduces response latency dramatically.
app.use(compression({
  level: 6, // good balance between speed and compression ratio
  threshold: 1024, // only compress responses > 1KB
  filter: (req, res) => {
    // skip compression for image uploads (already compressed)
    if (req.headers['content-type']?.startsWith('multipart/')) return false;
    return compression.filter(req, res);
  },
}));

// 3. CORS Setup
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
    credentials: true,
  }),
);

// 4. Body Parsers — limit JSON body to 10MB (prevents memory abuse)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4b. Security response headers (nosniff, frame-deny, no-store cache, etc.)
app.use(securityHeaders);

// 5. Static files — locally uploaded student photos (Cloudinary fallback)
// Cache static assets for 7 days (images don't change often)
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  maxAge: '7d',
  immutable: true,
}));

// 6. Morgan HTTP Logger — 'combined' in production (minimal), 'dev' in dev
// Skip logging for health checks and static assets to reduce overhead
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: appLogger.stream,
    skip: (req) => req.url === '/health' || req.url === '/metrics' || req.url.startsWith('/uploads/'),
  }),
);

// 7. Request-scoped tenant context (ALS) — auth middleware isme
//    organizationId likhta hai; storage.service isi se tenant resolve
//    karta hai (har call site par explicit orgId pass karne ki zaroorat nahi).
app.use(requestContextMiddleware);

// 7b. Cache-Control headers for GET API responses — browser + CDN can cache
//     non-authenticated reads (public data, dashboards). Auth routes set
//     no-store explicitly.
app.use("/api/v1", (req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=30");
  }
  next();
});

// 8. API Routes Setup — timing middleware wraps all API routes
app.use("/api/v1", globalLimiter, timingMiddleware, routes);

// 8. Health Check Route — Socket.io, Redis connections, INFO stats.
//    Returns 503 during shutdown draining so LB stops routing here.
//    Query param ?info=1 to include Redis server INFO (~1-2ms network call).
app.get("/health", async (req, res) => {
  const socket = await getSocketStatus();
  const redisStats = getRedisStats();
  const redisOk = socket.adapter === "redis" && socket.redisPing === "pong";

  // Redis INFO is a network call — only when explicitly requested
  const includeInfo = req.query.info === "1" || req.query.info === "true";
  const redisInfo = includeInfo ? await getRedisInfo() : undefined;

  if (isDraining()) {
    res.set("Retry-After", "5");
    return res.status(503).json({
      status: "DRAINING",
      timestamp: new Date(),
      socket,
      redis: { ...redisStats, info: redisInfo, adapter: redisOk ? "connected" : "unavailable" },
    });
  }

  const statusCode = socket.adapter === "uninitialized" ? 503 : 200;
  res.status(statusCode).json({
    status: statusCode === 200 ? "OK" : "DEGRADED",
    timestamp: new Date(),
    socket,
    redis: { ...redisStats, info: redisInfo, adapter: redisOk ? "connected" : "unavailable" },
  });
});

// 9. Readiness Probe — returns 200 only after DB + workers are fully started.
//    k8s readinessProbe: traffic only sent to pods where /ready returns 200.
app.get("/ready", (_req, res) => {
  if (isReady()) {
    return res.status(200).json({ status: "READY", timestamp: new Date() });
  }
  res.status(503).json({ status: "NOT_READY", timestamp: new Date() });
});

// 10. Prometheus Metrics — scrape endpoint for Grafana / Prometheus
app.get("/metrics", metricsHandler);

// 11. 404 — koi route nahi mila to clean JSON message (HTML page nahi)
app.use(notFoundHandler);

// 12. Global Error Handler Middleware
app.use(errorHandler);


export default app;
