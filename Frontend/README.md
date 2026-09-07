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

## Responsiveness QA checklist

### Login screens

- [ ] `/login` (staff/parent/student/admin hub)
  - [ ] 320px → form stacks vertically, School Code first, then Email/Username, then Password
  - [ ] 320px → tabs wrap or truncate gracefully without clipping labels
  - [ ] 320px → mobile header logo/brand visible above the form
  - [ ] 320px → submit button full width
  - [ ] 375px–768px → tab labels readable, inputs not cramped
  - [ ] 768px+ → brand panel stays readable, form stays centered
- [ ] `/admin/login` (super admin)
  - [ ] 320px → Remember me + Forgot password row stacks vertically
  - [ ] 320px → email/password inputs full width
  - [ ] 768px+ → Remember me + Forgot password align horizontally
- [ ] Branded theme color resolves correctly at all widths
- [ ] Back to school page link visible on mobile under branded hub pages### Admin / super-admin portal

- [ ] `/admin/*`
  - [ ] 320px → navbar height smaller, hamburger button reachable, logo touches edges without clipping
  - [ ] 320px → navbar title truncated if long, subtitle not clipped
  - [ ] 320px → notification bell + user menu still reachable, notification dropdown not wider than screen
  - [ ] 320px → notification dropdown max-height leaves room for mobile tap targets
- [ ] `/admin/login`
  - [ ] 320px → Remember me + Forgot password stack vertically
  - [ ] 320px → email/password inputs full width
- [ ] `/admin/settings` and other admin pages
  - [ ] 320px → main content padding smaller, max-width wrapper still centers
  - [ ] 768px+ → sidebar collapsed/uncollapsed layout smooth

### Teacher portal

- [ ] `/teacher/dashboard`
  - [ ] 320px → stat cards 2-col, timetable card full width, upcoming PTMs full width
  - [ ] 320px → recent homework card not overflowing horizontally
  - [ ] 768px+ → timetable + PTMs side-by-side
- [ ] `/teacher/attendance`
  - [ ] 320px → class/section/date toolbar wraps, Save button still reachable
  - [ ] 320px → attendance table scrolls horizontally with sticky first column
  - [ ] 320px → mark action bar wraps, “All Present / All Absent” buttons visible
  - [ ] 320px → monthly comparison table scrolls horizontally
- [ ] `/teacher/homework`
  - [ ] 320px → homework cards stack 1-col
  - [ ] 768px → homework cards 2-col
  - [ ] 320px → New Homework modal fits screen with bottom padding reserved for mobile nav
- [ ] `/teacher/students`
  - [ ] 320px → filter row collapses to full-width inputs
  - [ ] 320px → student count aligns right without overlapping
  - [ ] 320px → roster table scrolls horizontally
  - [ ] 320px → pagination usable
- [ ] `/teacher/timetable` (day/week toggle)
  - [ ] 320px → day nav buttons reachable
  - [ ] 320px → week overview cards stack vertically
  - [ ] 320px → day view slot cards stack vertically
- [ ] `/teacher/notifications`, `/teacher/exams`, `/teacher/announcements`, `/teacher/ptm`
  - [ ] 320px → list items readable, no clipping
  - [ ] 320px → any action buttons full width where appropriate

### Parent / student portal
- [ ] Mobile sidebar
  - [ ] 320px → sidebar overlays content, full height, dismiss on backdrop tap
  - [ ] 320px → nav group labels readable, child selector fits
  - [ ] 320px → child selector text not clipped
- [ ] Mobile bottom nav
  - [ ] 320px → 4 primary tabs + More reachable, icons/labels not clipped
  - [ ] 360–380px → bottom nav not overflowing
  - [ ] Safe-area inset respected on iPhone notch devices
- [ ] Portal top bar
  - [ ] 320px → title + subtitle take available width, user menu icon reachable
  - [ ] 320px → notification bell still visible
- [ ] Overview tab
  - [ ] 320px → attendance ring + fee status stack vertically
  - [ ] 320px → quick stat cards 2-col
- [ ] Attendance tab
  - [ ] 320px → month nav reachable, summary cards 4-col down to 320px
  - [ ] 320px → calendar grid visible, legend wraps
- [ ] Fees tab
  - [ ] 320px → summary cards 2-col, fee rows readable
  - [ ] 320px → fee row child/parent info not clipped
- [ ] Homework / notices / results / timetable tabs
  - [ ] 320px → cards/rows stack vertically, no horizontal clipping
  - [ ] 320px → action buttons full width where appropriate

### General

- [ ] No horizontal page scroll at 320px, 375px, 768px, 1024px, 1440px
- [ ] Focus states visible on mobile tap targets (≥ 44px where sensible)
- [ ] Loading skeletons match layout at each width
- [ ] Modal dialogs leave room for mobile bottom nav

## Screenshots

Capture these at 320px, 375px, 768px, and 1024px widths:

### Login

| Screen | 320px | 375px | 768px | 1024px |
|---|---|---|---|---|
| `/login` branded hub (staff tab) | TODO | TODO | TODO | TODO |
| `/login` branded hub (parent tab) | TODO | TODO | TODO | TODO |
| `/login` branded hub (student tab) | TODO | TODO | TODO | TODO |
| `/login` branded hub (admin tab) | TODO | TODO | TODO | TODO |
| `/admin/login` | TODO | TODO | TODO | TODO |

### Teacher portal

| Screen | 320px | 375px | 768px | 1024px |
|---|---|---|---|---|
| `/teacher/dashboard` | TODO | TODO | TODO | TODO |
| `/teacher/attendance` (mark view) | TODO | TODO | TODO | TODO |
| `/teacher/attendance` (monthly comparison) | TODO | TODO | TODO | TODO |
| `/teacher/homework` | TODO | TODO | TODO | TODO |
| `/teacher/homework` New Homework modal | TODO | TODO | TODO | TODO |
| `/teacher/students` | TODO | TODO | TODO | TODO |
| `/teacher/timetable` (day view) | TODO | TODO | TODO | TODO |
| `/teacher/timetable` (week view) | TODO | TODO | TODO | TODO |

### Parent / student portal

| Screen | 320px | 375px | 768px | 1024px |
|---|---|---|---|---|
| Parent portal sidebar open | TODO | TODO | TODO | n/a |
| Parent portal bottom nav | TODO | TODO | n/a | n/a |
| Parent portal top bar | TODO | TODO | TODO | TODO |
| Parent portal overview | TODO | TODO | TODO | TODO |
| Parent portal attendance | TODO | TODO | TODO | TODO |
| Parent portal fees | TODO | TODO | TODO | TODO |
| Parent portal settings (parent account) | TODO | TODO | TODO | TODO |
| Parent portal settings (student account) | TODO | TODO | TODO | TODO |
| Student portal overview | TODO | TODO | TODO | TODO |

Replace each `TODO` with a screenshot file reference or inline image after QA runs.
