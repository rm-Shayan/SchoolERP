# Backend image — school ERP API. Redis ke saath private Docker network par chalta hai.
#
# Build:  docker build -t school-backend Backend
# Run:    docker compose up --build   (root docker-compose.yml handles Redis + network)

FROM node:22-bookworm-slim

WORKDIR /app

# 1) Dependencies pehle (layer caching ke liye)
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
RUN npm ci

# 2) Prisma client generate.
#    Dummy DATABASE_URL sirf build-time par prisma.config.ts ke liye hai — asli URL
#    runtime par compose se aata hai, image ke andar kabhi bake nahi hota.
COPY prisma ./prisma
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# 3) App source
COPY src ./src

# Runtime dirs (compose host se bind-mount karta hai — logs/uploads persist rehte hain)
RUN mkdir -p logs uploads

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Explicit SIGTERM — Docker sends SIGTERM on `docker stop` / `docker compose down`.
# The exec form CMD already passes signals to Node, but STOPSIGNAL makes it
# visible in `docker inspect` and ensures k8s/kompose respect it too.
STOPSIGNAL SIGTERM

# Health check: every 30s hit /health. Docker marks container unhealthy after
# 3 consecutive failures. During graceful shutdown /health returns 503 so Docker
# sees the container as unhealthy and stops routing traffic.
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Env vars (DATABASE_URL, REDIS_URL, SMTP, etc.) compose se aati hain — isliye
# `--env-file` ki zaroorat nahi; code mein dotenv.config() host env use karta hai.
CMD ["node", "src/index.js"]
