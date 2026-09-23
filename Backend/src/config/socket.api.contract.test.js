import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_SRC = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.resolve(__dirname, '../../../Frontend/src');

// ─── Helpers ─────────────────────────────────────────────────────
function collectFilePaths(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFilePaths(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

function concat(dir, ext) {
  return collectFilePaths(dir, ext)
    .map((f) => fs.readFileSync(f, 'utf-8'))
    .join('\n');
}

function extractEvents(src, pattern) {
  const events = new Set();
  const re = new RegExp(pattern, 'g');
  let m;
  while ((m = re.exec(src)) !== null) events.add(m[2]);
  return events;
}

// ─── Socket event contract ───────────────────────────────────────
describe('Socket event contract — frontend listened ⇄ backend emitted', () => {
  const backendSrc = concat(BACKEND_SRC, '.js');
  const frontendSrc = concat(FRONTEND_SRC, '.ts') + concat(FRONTEND_SRC, '.tsx');

  // Backend emits via: emitToRoom(room, "event", payload) | io.to(room).emit("event", ...)
  // Also used: io.emit("server_shutdown")
  const backendEvents = extractEvents(
    backendSrc,
    /emitToRoom\([^,]+,\s*(['"`])([a-z_]+:[a-z_]+|[a-z_]+)(['"`])/i,
  ).add('server_shutdown');

  // Frontend listens via: socket.on('<event>', ...)
  const frontendEvents = extractEvents(frontendSrc, /socket\.on\((['"`])([a-z_]+:[a-z_]+|[a-z_]+)\1/);

  const listenable = ['connect', 'disconnect', 'connect_error'];
  const expected = [...frontendEvents].filter((e) => !listenable.includes(e));

  it('every event the frontend listens for is emitted by the backend', () => {
    const missing = expected.filter((e) => !backendEvents.has(e));
    assert.deepEqual(missing, [], `Frontend listens but backend never emits: ${missing.join(', ')}`);
  });

  it('gate scan flow events are wired (app → portal → super admin)', () => {
    for (const e of ['gate_scan_event', 'portal:attendance_marked', 'portal:homework_broadcast', 'portal:circular_created', 'portal_notification_created', 'portal_notifications_deleted', 'portal_notifications_read', 'portal_all_read']) {
      assert.ok(backendEvents.has(e), `backend must emit "${e}"`);
    }
  });
});

// ─── Health / readiness contract ─────────────────────────────────
describe('Core infra endpoints — registered in app', () => {
  const appSrc = fs.readFileSync(path.join(BACKEND_SRC, 'app.js'), 'utf-8');

  it('health, ready, metrics endpoints exist', () => {
    for (const r of ['/health', '/ready', '/metrics']) {
      assert.ok(appSrc.includes(`app.get("${r}"`), `app.get("${r}") should exist`);
    }
  });

  it('API v1 router is mounted with global limiter', () => {
    assert.ok(/app\.use\("\/api\/v1",\s*globalLimiter,\s*timingMiddleware,\s*routes\)/.test(appSrc), 'v1 router must mount with limiter');
  });
});

// ─── Key auth routes — smoke registration ────────────────────────
describe('Auth API — expected registrations', () => {
  const authSrc = fs.readFileSync(path.join(BACKEND_SRC, 'modules/auth/auth.routes.js'), 'utf-8');
  const expected = [
    { method: 'post', path: '/login' },
    { method: 'post', path: '/refresh' },
    { method: 'post', path: '/logout' },
    { method: 'get', path: '/me' },
  ];
  it('login/refresh/logout/me routes are registered', () => {
    for (const r of expected) {
      const re = new RegExp(`router\\.${r.method}\\(\\s*["']${r.path.replace('/', '\\/')}`, 'i');
      assert.ok(re.test(authSrc), `route ${r.method.toUpperCase()} ${r.path} must exist`);
    }
  });
});

// ─── Attendance / QR scan API — smoke registration ───────────────
describe('Attendance (QR scan) API — expected registrations', () => {
  const src = fs.readFileSync(path.join(BACKEND_SRC, 'modules/attendance/attendance.routes.js'), 'utf-8');
  const expected = [
    { method: 'post', path: '/scan' },
    { method: 'post', path: '/sync' },
    { method: 'get', path: '/devices' },
    { method: 'get', path: '/daily' },
    { method: 'get', path: '/students/:studentId/yearly-summaries' },
  ];
  it('QR scan + devices + reports routes are registered', () => {
    for (const r of expected) {
      const escaped = r.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\/', '/');
      const re = new RegExp(`router\\.${r.method}\\(\\s*["']${escaped}`, 'i');
      assert.ok(re.test(src), `route ${r.method.toUpperCase()} ${r.path} must exist`);
    }
  });
  it('scan route requires attendance role + QR schema validation', () => {
    assert.ok(/validate\(scanQrSchema\)/.test(src), 'scan route must validate with scanQrSchema');
    assert.ok(/authorize\(ROLE_GROUPS\.ATTENDANCE\)/.test(src), 'scan route must be role protected');
  });
});

// ─── Student API — smoke registration ────────────────────────────
describe('Student API — expected registrations', () => {
  const src = fs.readFileSync(path.join(BACKEND_SRC, 'modules/student/student.routes.js'), 'utf-8');
  const expected = [
    { method: 'post', path: '/' },
    { method: 'get', path: '/stats' },
    { method: 'get', path: '/:id' },
  ];
  it('create + stats + detail routes are registered', () => {
    for (const r of expected) {
      const escaped = r.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\/', '/');
      const re = new RegExp(`router\\.${r.method}\\(\\s*["']${escaped}`, 'i');
      assert.ok(re.test(src), `route ${r.method.toUpperCase()} ${r.path} must exist`);
    }
  });
});

// ─── Socket auth + room guard — source contract ──────────────────
describe('Socket auth + room guard contract', () => {
  const ws = fs.readFileSync(path.join(BACKEND_SRC, 'config/websocket.js'), 'utf-8');
  const client = fs.readFileSync(path.join(FRONTEND_SRC, 'lib/socket.ts'), 'utf-8');

  it('handshake requires JWT token', () => {
    assert.ok(/if \(!token\) return next\(new Error\("Authentication required"\)\)/.test(ws), 'missing token must be rejected');
  });

  it('handles staff / student / parent token types', () => {
    assert.match(ws, /decoded\.tokenType === "staff"/);
    assert.match(ws, /decoded\.tokenType === "student"/);
    assert.match(ws, /decoded\.tokenType === "parent"/);
  });

  it('room guard denies cross-tenant joins', () => {
    assert.match(ws, /room\.startsWith\("school:"\)/);
    assert.match(ws, /room\.startsWith\("org:"\)/);
    assert.match(ws, /room\.startsWith\("section:"\)/);
    assert.match(ws, /if \(room === "super_admins"\) return false/);
  });

  it('frontend joins school/org rooms on connect', () => {
    assert.ok(client.includes("emit('join_room'"), 'client must emit join_room');
    assert.ok(client.includes('`school:${schoolId}`'), 'client must join school:<id> room');
    assert.ok(client.includes('`org:${organizationId}`'), 'client must join org:<id> room');
  });
});