# ── Stage 1: install deps + generate Prisma client ──────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_OPTIONS=--max-old-space-size=300

COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

COPY Backend/prisma ./prisma
COPY Backend/prisma.config.ts ./
# prisma.config.ts → src/config/env.js import karta hai (env file split)
COPY Backend/src/config ./src/config
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# ── Stage 2: production image ───────────────────────────────────────
FROM node:22-bookworm-slim AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Prisma 7 ships a WASM query compiler (query_compiler_fast_bg.wasm) — no Rust
# engine binaries and no CLI are needed at runtime. Copy only the generated
# client from the build stage instead of the whole @prisma tree, which drags in
# studio-core + dev + pglite + react-dom (~80 MB of dev-only code).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY Backend/prisma ./prisma
COPY Backend/src ./src

RUN mkdir -p logs uploads && chown -R appuser:appuser /app
USER appuser

ENV NODE_ENV=production
ENV PORT=5000
# suga.run 512MB memory limit me V8 ko khud GC karne pe majboor karo — OS kill
# na kare. Import workers disable karne ke liye DISABLE_IMPORT_WORKERS=1 bhi daal sakte ho.
# Suga free tier ki memory limit sach me 256 MiB hai — V8 ko chhota heap do.
ENV NODE_OPTIONS=--max-old-space-size=120
ENV DISABLE_IMPORT_WORKERS=1
# Disk-growth safeguards: suga 512MB container me logs/db junk explode na ho.
ENV LOG_TO_FILE=false
ENV LOG_FILE_RETENTION_DAYS=3
ENV AUDIT_LOG_RETENTION_DAYS=90
ENV NOTIFICATION_LOG_RETENTION_DAYS=30
# Cron + attendance automation school-local (PKT) time me chalein. Runtime TZ
# env se override ho sakta hai.
ENV TZ=Asia/Karachi
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Sentry.init() app modules se PEHLE chalna zaroori hai (express instrumentation),
# isliye --import flag. Detail: Backend/src/config/sentry.instrumentation.js
CMD ["node", "--import", "./src/config/sentry.instrumentation.js", "src/index.js"]
