# School ERP — Pakistan

Multi-tenant school management platform. **Frontend:** Next.js 16 (Turbopack, App Router). **Backend:** Express + Prisma + Redis (PostgreSQL). **Real-time:** Socket.io. **Background jobs:** BullMQ.

## Architecture

```
Frontend (Next.js 16)                       Backend (Express)
  /admin/*          SUPER_ADMIN             ├─ 27 modules, 200+ REST endpoints
  /branch/*         ADMIN / RECEPTIONIST    ├─ Socket.io (real-time events)
  /teacher/*        TEACHER                 ├─ BullMQ (7 import queues)
  /parent/*         PARENT / STUDENT        ├─ node-cron (11 scheduled jobs)
  /o/[slug]/*       Org-branded routes      └─ Prisma (39 models)
        │                                        │
        └──────────── HTTP/WS ───────────────────┘
                             │
                   Redis  +  PostgreSQL
```

## Prerequisites

- Node.js >= 22
- PostgreSQL (17 recommended)
- Redis (local Docker or Upstash cloud)
- npm

## Quick Start

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env        # then fill in your values
npx prisma migrate deploy   # apply schema
npm run dev                 # starts on ${PORT} (default 3000, frontend expects 5000)
```

Seed a super admin (once):

```bash
npm run seed                # creates superadmin@schoolerp.com
```

Tests:

```bash
npm test                    # node --test (23 backend tests)
```

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.local.example .env.local   # if a template exists; else create
npm run dev                 # http://localhost:3000
```

Build & checks:

```bash
npm run build               # typecheck + production build (Next/Turbopack)
npm run lint                # oxlint
```

### 3. Docker (optional, full local stack)

```bash
cd Backend
docker compose up --build -d   # postgres + redis + backend + nginx
docker compose down
```

## Environment Variables

### Backend (`.env`) — see `Backend/.env.example`

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `REDIS_URL` | Redis connection (pub/sub, auth cache, queues) |
| `NODE_ENV` | `development` / `production` |
| `SMTP_*` | Email delivery (host, port, user, app password) |
| `API_URL` | Public backend base URL (for absolute `/uploads/...` links in emails) |
| `CLIENT_URL` | Comma-separated frontend origin whitelist for CORS |
| `MAX_IMAGE_UPLOAD_SIZE_MB` | Image upload limit (default 5MB) |
| `WA_*` | Optional WhatsApp Business Cloud API |
| `AUDIT_LOG_RETENTION_DAYS` | Audit log cleanup window (default 180) |

### Frontend (`.env.local`)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` |

## Role-Based Portals

| Role | Portal | Notes |
|---|---|---|
| `SUPER_ADMIN` | `/admin/*` | Platform owner — all orgs, branches, users |
| `ADMIN` | `/branch/*` | Branch head / Principal |
| `TEACHER` | `/o/[slug]/teacher/*` | Class teacher |
| `RECEPTIONIST` | `/branch/*` | Front desk — admissions, gate, student records |

## Testing

- **Backend:** `npm test` in `Backend/` (Node's built-in test runner)
- **Frontend:** Playwright (`Frontend/tests/`) — `npx playwright test`
- **CI:** `.github/workflows/playwright.yml`

## Documentation

- `PRD.md` — product requirements
- `MVP.md` — feature checklist & status
- `APPLICATION_FLOW.md` — end-to-end flow (auth, org creation, roles)
- `docs/` — per-role flow guides (SUPER_ADMIN, ORG_ADMIN, STAFF, STUDENT portals)

## Key Tech

Next.js 16 · React 19 · TypeScript 7 · Tailwind 4 · Redux Toolkit · Express 5 · Prisma 7 · PostgreSQL · Redis · Socket.io · BullMQ · node-cron · pdfkit · xlsx · prom-client
