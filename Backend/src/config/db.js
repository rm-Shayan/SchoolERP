import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

let connectionString = process.env.DATABASE_URL;

// SSL mode handling:
// - Production: 'require' → 'verify-full' (explicit, future-proof against pg v9.0.0
//   where 'require' will adopt weaker libpq semantics). Certificate verification
//   is expected to be configured in production (e.g. Neon, Supabase, RDS).
// - Development: If no sslmode in URL → append 'sslmode=disable' for local PG
//   setups that don't have SSL configured. If sslmode is already set explicitly
//   (e.g. 'disable'), respect it.
if (connectionString) {
  const hasSslmode = /[?&]sslmode=/.test(connectionString);
  const hasDeprecatedSsl = /sslmode=(prefer|require|verify-ca)/.test(connectionString);
  const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

  if (isProd && hasDeprecatedSsl) {
    // Production — normalize deprecated modes to explicit verify-full
    // (cert verification expected in prod: Neon, Supabase, RDS, etc.)
    connectionString = connectionString.replace(
      /sslmode=(prefer|require|verify-ca)/,
      'sslmode=verify-full'
    );
  } else if (!isProd && !hasSslmode) {
    // Local dev, no sslmode in URL at all — append disable for local PG
    const sep = connectionString.includes('?') ? '&' : '?';
    connectionString += `${sep}sslmode=disable`;
  }
  // If sslmode is already set (whether require, disable, verify-full, etc.),
  // respect the user's explicit choice in ALL environments.
}

// Connection pool tuned for Neon's *pooled* endpoint (the DATABASE_URL uses
// `-pooler...aws.neon.tech`, so Neon's PgBouncer owns the backend pool):
// - min: 2 — keep a couple of warm client connections. With min: 0 the client
//   pool shrank to 0 after 60s idle and EVERY new request paid a ~2s TLS
//   reconnect through AWS (the root cause of "all APIs are slow"). The pooled
//   endpoint tolerates this far better than the old direct endpoint did.
// - idleTimeoutMillis: 30s — recycle idle connections *before* Neon's pooler
//   kills them, so we never checkout a dead socket ("Server has closed the
//   connection") yet always have a warm connection during active use.
// - max: 10 concurrent queries. keepAlive keeps NAT/firewalls from killing sockets.
const adapter = new PrismaPg({
  connectionString,
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  },
});

const prisma = new PrismaClient({
  adapter,
  // Log slow queries (>300ms) in development only
  log: process.env.NODE_ENV === 'development'
    ? [{ level: 'query', emit: 'event' }, { level: 'warn', emit: 'stdout' }, { level: 'error', emit: 'stdout' }]
    : [{ level: 'error', emit: 'stdout' }],
});

export default prisma;
