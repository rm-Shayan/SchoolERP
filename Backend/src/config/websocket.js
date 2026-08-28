import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import prisma from "./db.js";
import redis from "./redis.js";
import Logger from "../lib/utils/logger.js";
import { corsOrigin } from "./cors.js";
import {
  onSocketConnect,
  onSocketDisconnect,
  updateRoomMetrics,
  collectRedisMetrics,
} from "./metrics.js";
import { trackEmitStart, trackEmitFlush, drainEmits } from "./emitBuffer.js";

const logger = new Logger("websocket");
let io;
let draining = false;

// ── Room authorization ────────────────────────────────────────────────
// section:{id} → class → schoolId DB lookup ka chhota cache (socket lifetime).
const SECTION_SCHOOL_CACHE = new Map(); // sectionId -> schoolId | null

async function sectionSchool(sectionId) {
  if (SECTION_SCHOOL_CACHE.has(sectionId)) return SECTION_SCHOOL_CACHE.get(sectionId);
  try {
    const s = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { class: { select: { schoolId: true } } },
    });
    const schoolId = s?.class?.schoolId || null;
    SECTION_SCHOOL_CACHE.set(sectionId, schoolId);
    return schoolId;
  } catch (_) {
    return null;
  }
}

/** Kya ye (authenticated) user is room ko join kar sakta hai? */
async function isRoomAllowed(user, room) {
  if (!user || typeof room !== "string") return false;

  // Import/worker progress rooms — sirf management (SUPER_ADMIN/ADMIN).
  // Students/parents/teachers ko import progress dikhane ki zaroorat nahi.
  if (room.startsWith("job:")) {
    return user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  }

  const schools = user.allowedSchoolIds || [];

  // Platform owner: apna room + monitoring ke liye sab schools/orgs.
  if (user.role === "SUPER_ADMIN") {
    return (
      room === "super_admins" ||
      room.startsWith("school:") ||
      room.startsWith("org:") ||
      room.startsWith("section:")
    );
  }

  if (room === "super_admins") return false; // kabhi nahi
  if (room.startsWith("school:")) {
    return schools.includes(room.slice("school:".length));
  }
  if (room.startsWith("org:")) {
    return Boolean(user.organizationId) && room === `org:${user.organizationId}`;
  }
  if (room.startsWith("section:")) {
    if (!schools.length) return false;
    const schoolId = await sectionSchool(room.slice("section:".length));
    return Boolean(schoolId) && schools.includes(schoolId);
  }
  return false;
}

/** Mark this replica as draining — /health returns 503 so LB routes away. */
export const setDraining = () => {
  draining = true;
  logger.logger.info("Replica entering draining mode — /health will return 503");
};

export const isDraining = () => draining;

export const initWebSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  // --- Redis Pub/Sub adapter for multi-replica support ---
  // When running multiple backend replicas, Socket.io events emitted
  // on one replica must reach clients connected to other replicas.
  // The adapter publishes every room broadcast to Redis so all
  // replicas receive it and relay it to their local sockets.
  try {
    const subClient = redis.duplicate();
    await subClient.connect();
    io.adapter(createAdapter(redis, subClient));
    logger.logger.info("Socket.io Redis adapter attached — multi-replica broadcast enabled");
  } catch (err) {
    // Fallback: without Redis adapter, broadcasts stay local to this
    // replica. This is fine for single-instance / dev environments.
    logger.logger.error(`Redis adapter unavailable, running in local-only mode: ${err.message}`);
  }

  // --- Metrics: poll room sizes + Redis stats every 15s (avoids stale gauges) ---
  const METRICS_INTERVAL_MS = 15_000;
  const metricsTimer = setInterval(() => {
    if (io) updateRoomMetrics(io.sockets.adapter.rooms);
    collectRedisMetrics();
  }, METRICS_INTERVAL_MS);
  // Prevent timer from keeping process alive during graceful shutdown
  metricsTimer.unref();

  // ── Handshake authentication: JWT zaroori, user socket.data par attach ──
  // Teen token types supported: staff / parent / student. Har user ke liye
  // allowedSchoolIds set banta hai — room guard isi se decide karta hai.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.tokenType === "staff") {
        const u = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, organizationId: true, schoolId: true, isActive: true },
        });
        if (!u || !u.isActive) return next(new Error("Unauthorized"));
        socket.data.user = {
          kind: "staff",
          id: u.id,
          role: u.role,
          organizationId: u.organizationId,
          allowedSchoolIds: [u.schoolId].filter(Boolean),
        };
      } else if (decoded.tokenType === "student") {
        socket.data.user = {
          kind: "student",
          id: decoded.studentId,
          role: "STUDENT",
          organizationId: null,
          allowedSchoolIds: [decoded.schoolId].filter(Boolean),
        };
      } else if (decoded.tokenType === "parent") {
        const parent = await prisma.parent.findUnique({
          where: { id: decoded.parentId },
          select: { students: { select: { schoolId: true } } },
        });
        if (!parent) return next(new Error("Unauthorized"));
        socket.data.user = {
          kind: "parent",
          id: decoded.parentId,
          role: "PARENT",
          organizationId: null,
          allowedSchoolIds: [
            ...new Set(parent.students.map((s) => s.schoolId).filter(Boolean)),
          ],
        };
      } else {
        return next(new Error("Invalid token type"));
      }
      next();
    } catch (_) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    onSocketConnect();
    const authUser = socket.data.user;
    logger.logger.info(
      `WebSocket Client Connected: ${socket.id} (${authUser?.role || "?"})`
    );

    // Join room per school/organization — SIRF apne rooms. Multi-tenant
    // isolation: koi client doosri branch/school/org ka room join nahi kar
    // sakta, aur super_admins sirf platform owner ke liye hai.
    socket.on("join_room", async (room) => {
      if (!(await isRoomAllowed(authUser, room))) {
        logger.logger.warn(
          `[Room Guard] ${authUser?.role}:${authUser?.id} denied room "${room}"`
        );
        return;
      }
      socket.join(room);
      logger.logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("leave_room", (room) => {
      if (typeof room === "string") {
        socket.leave(room);
        logger.logger.info(`Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on("disconnect", () => {
      onSocketDisconnect();
      logger.logger.info(`WebSocket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

export const emitToRoom = (room, event, data) => {
  if (!io) return;
  trackEmitStart();
  io.to(room).emit(event, data);
  trackEmitFlush(room, io);
};

/** Return Socket.io + adapter status for the health endpoint. */
export const getSocketStatus = async () => {
  if (!io) return { adapter: "uninitialized", clients: 0, rooms: 0, redisPing: null };

  const adapter = io.sockets.adapter;
  const isRedis = !!(adapter.pubClient && adapter.subClient);
  let redisPing = null;
  if (isRedis) {
    try { await adapter.pubClient.ping(); redisPing = "pong"; }
    catch (err) { redisPing = err.message; }
  }

  return {
    adapter: isRedis ? "redis" : "local",
    clients: io.engine.clientsCount,
    rooms: adapter.rooms.size,
    redisPing,
  };
};

/**
 * Gracefully shut down Socket.io + Redis adapter.
 * 1. Broadcast server_shutdown so clients reconnect elsewhere.
 * 2. Stop accepting new connections (io.close).
 * 3. Wait for all in-flight emits to flush to connected clients.
 * 4. Close Redis adapter pub/sub connections.
 */
export const closeWebSocket = async () => {
  if (!io) return;
  logger.logger.info("Shutting down Socket.io server…");

  try {
    // Tell clients to reconnect to another replica
    io.emit("server_shutdown");

    // Close Socket.io — stops accepting new connections + HTTP upgrade.
    // Existing sockets stay open briefly so we can flush pending emits.
    await new Promise((resolve) => io.close(resolve));
    logger.logger.info("Socket.io server closed — draining pending emits");

    // Wait for buffered packets to hit the wire before killing connections
    await drainEmits();

    // Now close the Redis adapter connections
    const adapter = io.sockets.adapter;
    if (adapter.subClient) await adapter.subClient.quit();
    if (adapter.pubClient) await adapter.pubClient.quit();
    logger.logger.info("Redis adapter connections closed");
  } catch (err) {
    logger.logger.error(`Error closing Socket.io: ${err.message}`);
  }
};
