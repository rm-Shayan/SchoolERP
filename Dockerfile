# Root-level Dockerfile
# Some platforms (Suga) build from repo root and look for ./Dockerfile.
# This delegates to the real backend Dockerfile inside Backend/.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force
COPY Backend/prisma ./prisma
COPY Backend/prisma.config.ts ./
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

FROM node:22-bookworm-slim AS production
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
# Build stage se sirf node_modules copy karte hain (prisma generate production me run hoga)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY Backend/prisma ./prisma
COPY Backend/prisma.config.ts ./
RUN npx prisma generate
COPY Backend/package.json ./
COPY Backend/src ./src
RUN mkdir -p logs uploads && chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node src/index.js"]
