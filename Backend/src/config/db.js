import { PrismaPg } from '@prisma/adapter-pg'
import pkg from '@prisma/client'
const { PrismaClient } = pkg

let connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const hasSslmode = /[?&]sslmode=/.test(connectionString);
  const hasDeprecatedSsl = /sslmode=(prefer|require|verify-ca)/.test(connectionString);
  const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

  if (isProd && hasDeprecatedSsl) {
   
    connectionString = connectionString.replace(
      /sslmode=(prefer|require|verify-ca)/,
      'sslmode=verify-full'
    );
  } else if (!isProd && !hasSslmode) {
    const sep = connectionString.includes('?') ? '&' : '?';
    connectionString += `${sep}sslmode=disable`;
  }
  
}

const adapter = new PrismaPg({
  connectionString,
  pool: {
    min: 2,
    max: 15,
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
