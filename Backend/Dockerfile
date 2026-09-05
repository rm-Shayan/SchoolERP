# ─── School ERP Backend ──────────────────────────────────────────────
# Optimized for Render Free Plan (512 MB RAM, external Postgres + Redis)
#
# Build:  docker build -t school-backend .
# Run:    docker run -p 3000:3000 --env-file .env school-backend
# ─────────────────────────────────────────────────────────────────────

# ── Stage 1: Build (needs devDeps for prisma) ──
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force
COPY prisma ./prisma
COPY prisma.config.ts ./
# Dummy URL — sirf build-time par prisma schema parse ke liye.
# Runtime par asli DATABASE_URL (Neon) environment se aata hai.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# ── Stage 2: Production (prod deps + prisma CLI + generated client) ──
FROM node:22-bookworm-slim AS production
WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Prisma CLI + generated client from build stage (needed for migrate deploy at runtime)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.bin ./node_modules/.bin
COPY --from=build /app/node_modules/prisma ./node_modules/prisma

# App source
COPY package.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN mkdir -p logs uploads && chown -R appuser:appuser /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node src/index.js"]
