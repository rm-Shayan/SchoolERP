import { Registry, Gauge, Counter, collectDefaultMetrics } from "prom-client";
import { getRedisStats } from "./redisStats.js";

// --- Registry -----------------------------------------------------------
// Default registry collects Node.js process metrics (heap, GC, event loop).
// All socket metrics live here too so /metrics returns one unified payload.
const register = new Registry();
collectDefaultMetrics({ register });

// --- Socket.io Metrics --------------------------------------------------

/** Current number of connected WebSocket clients on this replica. */
const connectionsGauge = new Gauge({
  name: "socket_connections_current",
  help: "Current connected WebSocket clients on this replica",
  registers: [register],
});

/** Current number of active rooms on this replica. */
const roomsGauge = new Gauge({
  name: "socket_rooms_current",
  help: "Current active Socket.io rooms on this replica",
  registers: [register],
});

/** Total connections since process start. */
const connectionsTotal = new Counter({
  name: "socket_connections_total",
  help: "Total WebSocket connections since process start",
  registers: [register],
});

/** Total disconnections since process start. */
const disconnectionsTotal = new Counter({
  name: "socket_disconnections_total",
  help: "Total WebSocket disconnections since process start",
  registers: [register],
});

// --- Redis Metrics ----------------------------------------------------

/** 1 if node-redis (cache) is connected, 0 otherwise. */
const redisNodeConnected = new Gauge({
  name: "redis_node_connected",
  help: "1 if node-redis client is connected, 0 otherwise",
  registers: [register],
});

/** 1 if ioredis (BullMQ) is connected, 0 otherwise. */
const redisBullmqConnected = new Gauge({
  name: "redis_bullmq_connected",
  help: "1 if ioredis BullMQ client is connected, 0 otherwise",
  registers: [register],
});

/** Labeled gauge — exactly one label is 1, rest are 0.
 *  Shows the full ioredis lifecycle: wait → connect → ready → reconnecting → end.
 *  Use in Grafana: redis_bullmq_state{state="reconnecting"} == 1 */
const IOREDIS_STATES = ["wait", "connect", "ready", "reconnecting", "close", "end"];
const redisBullmqState = new Gauge({
  name: "redis_bullmq_state",
  help: "Current ioredis connection state (exactly one label is 1)",
  labelNames: ["state"],
  registers: [register],
});
// Pre-create all label combos so Prometheus always sees them
for (const s of IOREDIS_STATES) redisBullmqState.set({ state: s }, 0);

/** Total ioredis reconnection attempts since process start. */
const redisBullmqReconnects = new Counter({
  name: "redis_bullmq_reconnects_total",
  help: "Total ioredis reconnection attempts since process start",
  registers: [register],
});

/** Number of commands queued in ioredis pipeline. */
const redisBullmqQueueLength = new Gauge({
  name: "redis_bullmq_command_queue_length",
  help: "Number of commands waiting in ioredis pipeline",
  registers: [register],
});

let lastBullmqState = "wait";

/** Collect Redis stats — called on the same 15s timer as socket room metrics. */
export const collectRedisMetrics = () => {
  const { nodeRedis, bullmqRedis } = getRedisStats();
  redisNodeConnected.set(nodeRedis.connected ? 1 : 0);
  redisBullmqConnected.set(bullmqRedis.status === "ready" ? 1 : 0);
  redisBullmqQueueLength.set(bullmqRedis.commandQueueLength || 0);

  // Labeled state gauge — set current state to 1, all others to 0
  const state = bullmqRedis.status;
  for (const s of IOREDIS_STATES) {
    redisBullmqState.set({ state: s }, s === state ? 1 : 0);
  }

  // Track reconnection transitions
  if (state === "reconnecting" && lastBullmqState !== "reconnecting") {
    redisBullmqReconnects.inc();
  }
  lastBullmqState = state;
};

// --- Helpers called from websocket.js -----------------------------------

export const onSocketConnect = () => {
  connectionsGauge.inc();
  connectionsTotal.inc();
};

export const onSocketDisconnect = () => {
  connectionsGauge.dec();
  disconnectionsTotal.inc();
};

/**
 * Snapshot current room sizes from the Socket.io adapter and write gauges.
 * Called periodically (not on every join/leave) to keep cardinality low.
 * Expects `io.sockets.adapter.rooms` — a Map<string, Set<socketId>>.
 */
export const updateRoomMetrics = (roomsMap) => {
  let totalRooms = 0;
  // Reset per-room gauge — we re-set every cycle instead of tracking deltas
  // to avoid stale entries when rooms are fully emptied.
  const roomMembers = {};

  for (const [room, members] of roomsMap) {
    // Skip internal rooms (each socket gets an ID-based room automatically)
    if (members.size <= 1) continue;
    totalRooms++;
    roomMembers[room] = members.size;
  }

  roomsGauge.set(totalRooms);
  return roomMembers;
};

// --- Express handler for /metrics ---------------------------------------

export const metricsHandler = async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
};
