import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import * as Sentry from "@sentry/node";
import path from "path";
import { fileURLToPath } from "url";

import Logger from "./lib/utils/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import { timingMiddleware } from "./middlewares/timing.middleware.js";
import { securityHeaders } from "./middlewares/security.middleware.js";
import { corsOrigin } from "./config/cors.js";
import { getSocketStatus, isDraining } from "./config/websocket.js";
import { metricsHandler } from "./config/metrics.js";
import { isReady } from "./config/readiness.js";
import { getRedisStats, getRedisInfo } from "./config/redisStats.js";
import { requestContextMiddleware } from "./lib/requestContext.js";
import initMonitoring from "./config/monitoring.js";
import routes from "./routes/index.js";
import "./services/storage.service.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

initMonitoring();

// Trust first proxy — required for express-rate-limit to read X-Forwarded-For
// accurately. Without this, rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// when a reverse proxy (nginx, load balancer) forwards client IPs.
app.set("trust proxy", 1);

const appLogger = new Logger("app-service");
const skipHttpLogging = (req) =>
  req.url === "/health" ||
  req.url === "/metrics" ||
  req.url.startsWith("/uploads/");

const apiCacheHeaders = (req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=30");
  }
  next();
};

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["content-type"]?.startsWith("multipart/")) return false;
      return compression.filter(req, res);
    },
  }),
);

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(securityHeaders);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "7d",
    immutable: true,
  }),
);

app.use(
  morgan(isProduction ? "combined" : "dev", {
    stream: appLogger.stream,
    skip: skipHttpLogging,
  }),
);

app.use(requestContextMiddleware);
app.use("/api/v1", apiCacheHeaders);
app.use("/api/v1", globalLimiter, timingMiddleware, routes);

app.get("/health", async (req, res) => {
  const socket = await getSocketStatus();
  const redisStats = getRedisStats();
  const redisOk = socket.adapter === "redis" && socket.redisPing === "pong";
  const includeInfo = req.query.info === "1" || req.query.info === "true";
  const redisInfo = includeInfo ? await getRedisInfo() : undefined;

  if (isDraining()) {
    res.set("Retry-After", "5");
    return res.status(503).json({
      status: "DRAINING",
      timestamp: new Date(),
      socket,
      redis: {
        ...redisStats,
        info: redisInfo,
        adapter: redisOk ? "connected" : "unavailable",
      },
    });
  }

  const statusCode = socket.adapter === "uninitialized" ? 503 : 200;
  return res.status(statusCode).json({
    status: statusCode === 200 ? "OK" : "DEGRADED",
    timestamp: new Date(),
    socket,
    redis: {
      ...redisStats,
      info: redisInfo,
      adapter: redisOk ? "connected" : "unavailable",
    },
  });
});

app.get("/ready", (_req, res) => {
  if (isReady()) {
    return res.status(200).json({ status: "READY", timestamp: new Date() });
  }
  return res.status(503).json({ status: "NOT_READY", timestamp: new Date() });
});

app.get("/metrics", metricsHandler);

// Sentry error middleware must be registered after all controllers,
// but before any custom error-handling middleware.
Sentry.setupExpressErrorHandler(app);

app.get("/debug-sentry", (_req, _res) => {
  Sentry.logger.info("User triggered test error", {
    action: "test_error_endpoint",
  });
  Sentry.metrics.count("test_counter", 1);
  throw new Error("My first Sentry error!");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
