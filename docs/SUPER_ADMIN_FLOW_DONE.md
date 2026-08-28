# Super Admin Flow — Kya Kya Hogya Hai (Completed)

> Super Admin flow mein jo cheezein **ban chuki hain aur code mein kaam kar rahi hain** —
> file/file verify kiya gaya. Ye checklist-style hai: jab koi TODO item complete ho to
> `SUPER_ADMIN_FLOW_TODO.md` se yahan move karo.

> **2026-08-17 — Org-level admin (ORG_ADMIN) concept REMOVE:** handover promotion
> (`_ensureOrgAdmin`), "Wahi admin manage kare" mode, aur Branch Switcher sab hata diye
> gaye. SUPER_ADMIN ab sirf platform owner hai; har branch ka apna ADMIN (Principal).
> Migration: `20260817000400_remove_org_admin_role`.

---

## ✅ Platform Setup

- [x] **Platform Super Admin seed** — `prisma/seed.js` se sirf 1 banta hai:
  `superadmin@schoolerp.com` (organizationId = `null`)
- [x] **Login** — `/admin/login` (email + password), tokens (access 15m + refresh 7d rotating),
  `getRoleHomePath` → `/admin/dashboard`
- [x] **Session security** — refresh token rotation, logout-all, password change par sab sessions revoke,
  block hone par sab sessions revoke

## ✅ Admin Console (Frontend)

- [x] **Dashboard** (`/admin/dashboard`) — platform stats: total orgs, branches, students,
  revenue, 12-month growth, status counts (active / blocked / partially-blocked / setup-pending)
- [x] **Organizations** (`/admin/organizations`) — list + grid view, status badges
  (SETUP_PENDING → ACTIVE, PARTIALLY_BLOCKED, BLOCKED), org filter, block/unblock
- [x] **Create Organization** (`/admin/organizations/new`) — single create with logo upload,
  admin assignment, credentials email (self-designation skip)
- [x] **Org Detail** (`/admin/organizations/:id`) — KPIs: branches, staff, students, revenue
  (ek response mein), Add Branch, block/unblock
- [x] **Branch Detail** (`/admin/organizations/:orgId/schools/:schoolId`) — branch info,
  admin reassign, block/unblock
- [x] **Branches** (`/admin/branches`) — saari branches, org filter, status badges, block/unblock
- [x] **Users** (`/admin/users`) — platform-wide directory, stats by role, filters
  (search/role/status/reason), profile modal, **Export CSV**, block/unblock with reason dialog
- [x] **Import Data** (`/admin/import`) — org bulk import + branch bulk import,
  **live progress** (WebSocket `job:{id}`)
- [x] **Activity Log** (`/admin/activity`) — full audit trail (kisne, kya, kab, IP, details)
- [x] **Settings** (`/admin/settings`) — profile, avatar upload, password change, account details

## ✅ Backend APIs (144 routes)

- [x] **Auth (21)** — login, refresh, me, logout(-all), change-password, users CRUD,
  parent OTP (request/verify/me), **student direct login + OTP + me**
- [x] **Organizations (7)** — CRUD + import-excel + export
- [x] **Schools/Branches (8)** — CRUD + import-excel + export + **admin reassign**
- [x] **Moderation** — block/unblock: organization (cascade), school, user, student, parent
- [x] **Baaki modules** — Academic (22), Students (8), Admissions (9), Fees (11), Homework (4),
  Exams (7), Conduct (4), Circulars (4), PTM (5), Timetable (6), Attendance (9),
  Activities (5), Notifications (2), Promotions (7), Substitutes (4)

## ✅ Core Flows (Code-Verified)

- [x] **Org creation** — SETUP_PENDING → default branch auto ("Main Campus", code `-01` unique) →
  ADMIN principal (bcrypt 12, auto password `hex+A1!`) → credentials email → cache bust + WS
- [x] **"Delivered" cycle** — pehli login par `markDeliveredOnLogin()` → ACTIVE (UI: Delivered)
- [x] **Bulk org import** — BullMQ worker, duplicate skip, self-designation skip, live progress
- [x] **Branch creation — ek hi mode** ("Naya Principal banao"): naya ADMIN + creds email
  (duplicate email check pehle). "Wahi admin manage kare" (org-level handover) **remove** ho chuka
- [x] **Branch admin reassign** — purana principal deactivate → naya ADMIN create + creds email
- [x] **Branch Switcher REMOVE** — org-level admin exist nahi karta, isliye component delete
  (`frontend/src/layouts/parts/BranchSwitcher.tsx` gaya); data isolation via `lib/scope.js`
- [x] **Blocking matrix** — org (cascade + sessions revoke), branch (org → PARTIALLY_BLOCKED),
  user (hierarchy guardrails), student/parent (branch scope); sab **reversible**
- [x] **Org delete** — background worker, transaction (children → parents), SUPER_ADMIN detach,
  logo cleanup, cache clear
- [x] **Branch delete** — transaction subtree delete, logo guard (single-branch sync)

## ✅ Emails

- [x] **Direct SMTP (Redis-free)** — `email.queue.js`: 3 attempts, backoff, kabhi throw nahi
- [x] **Templates** — orgCredentials, adminCredentials (principal/org-admin), staffCredentials, OTP
- [x] **Branded login links** — `/o/{slug}` (org) + `/login?code={schoolCode}` (branch) →
  login screen school naam/logo DB se load karta hai
- [x] **Self-designation skip** — khud ki email par credentials email nahi jati

## ✅ Background Jobs & Schedulers

- [x] **BullMQ queues** — organization-import, organization-delete, school-import, staff-import,
  student-import (`drainDelay: 15` — Upstash quota save)
- [x] **Auto-absent job** — 8:30 AM Mon–Sat: unscanned students → ABSENT + parent email + WS
- [x] **Fee reminder job** — 9:00 AM daily: overdue sweep (OVERDUE) + reminders email

## ✅ Caching & Realtime

- [x] **Redis caches** — `orgs:all`, `org:{id}`, `superadmin:overview` (120s),
  `schools:all`, `schools:org:{id}`, `school:{id}`, `attendance:daily:{schoolId}:{date}`
  — har mutation par bust
- [x] **WebSocket rooms** — `super_admins`, `org:{id}`, `school:{id}`, `job:{jobId}` —
  status pills, badges, import progress, gate live view realtime update

## ✅ Audit Trail

- [x] Har action log: CREATE/UPDATE/DELETE org, school, staff, ASSIGN_SCHOOL_ADMIN,
  BLOCK/UNBLOCK (org/school/user/student/parent), LOGIN/LOGOUT, PARENT/STUDENT_LOGIN
  — actor + entity + IP + details

## ✅ Slug / Branded Login (Super Admin Side)

- [x] **Slug display on org UI** — OrganizationsTable (table view), OrganizationsGrid
  (dashboard), OrgHeader (detail) — `/o/{org.slug}` link + search by slug
- [x] **Slug on grid cards** — `OrgCard` (admin/organizations grid) par `Code: X · /o/{slug}`
  dikhta hai + **Copy link** button (clipboard + toast)
- [x] **Copy login link button** — `OrgHeader` (org detail) mein "Copy Link" button →
  `https://{domain}/o/{slug}` (Copied! state + toast)
- [x] **View Public Page button** — shared `parts/PublicPageButton.tsx`: `/o/{slug}`
  new tab + `stopPropagation`; OrganizationsGrid card, OrgCard, OrganizationsTable row,
  OrgHeader par laga (public page bante hi yahi landing kholegi — ORG_ADMIN #0)
- [x] **Slug login URL** — `/o/:slug` → `/login?org={slug}` → branded login
  (DB se logo, name, orgName, themeColor via `GET /schools/branding`)
- [x] **Subdomain support** — `{orgslug}.domain.com` → branded login (`EntryRouter`)

## ✅ Console Features (Recently Added)

- [x] **Create User (console)** — Users page par "Create User" button + modal: branch
  selector + role + name/email/password/phone (`POST /auth/users`), backend fix se org
  school se derive hota hai (platform SUPER_ADMIN ke liye)
- [x] **Settings — Platform tab** — `/admin/settings` mein 3rd tab: notification delivery
  summary (total/sent/delivered/failed) + by-channel (`GET /notifications/status`)
- [x] **Notification Logs page** — `/admin/notifications` (nav link): logs table
  (recipient/branch/channel/status/message) + channel/status filters + pagination
  (`GET /notifications/logs`)

## ✅ Per-Org Theming

- [x] **`Organization.themeColor`** — schema + migration (`20260814120000_add_org_theme_color`)
- [x] **Backend** — `getBranding()` org themeColor return (fallback `#2563eb`); create/update
  accept karta hai; DTO included
- [x] **Frontend** — org create form + EditOrgModal color picker; branded login org color use

## ✅ Email Attachments

- [x] **`email.service.js` attachments support** — nodemailer attachments + mock print
- [x] **Admission approve** → `admission-slip-*.pdf` attach
- [x] **Admission enroll** → `student-id-*.pdf` (QR ID card) attach
- [x] **Fee payment** → `fee-receipt-*.pdf` attach
- [x] `notification.service.js` — `attachments` pass-through (`notifyParent` → `_sendEmail` → `queueEmail`)

## ✅ Student/Parent Portal

- [x] **Student portal** — login (School Code + Roll Number / OTP) + dashboard + 10 tabs
  (attendance, fees, homework, circulars, timetable, exam, activities, profile, documents, notifications)
- [x] **Parent portal** — login (WhatsApp OTP / Roll No) + dashboard + realtime updates
- [x] **Mobile-responsive** — both portals fully responsive (375px → desktop)

## ✅ Staff Attendance & Leave

- [x] **Staff attendance** — daily + monthly views, CRUD (mark present/absent/late/leave),
  import/export (Excel), `StaffAttendance` schema extended with new fields
- [x] **Staff leave** — self-service request + admin approval (`/branch/leave`) + realtime WS
  updates; leave status: PENDING → APPROVED/REJECTED

## ✅ Singleton Password Login

- [x] **Staff singleton password** — staff can now use portal password (not just OTP) for login;
  `POST /auth/student/login` + `POST /auth/parent/login` both support singleton password

## ✅ Socket Fixes (Realtime)

- [x] **Parent portal realtime** — token fix (WS auth token passthrough) + event listeners
  working (`notification_created`, `notification_status_updated`)
- [x] **Student portal realtime** — same token fix + event listeners wired

## ✅ Cloudinary Branch-Level

- [x] **School documents** never use platform-level env Cloudinary credentials —
  each branch uses its own Cloudinary config (org-level or branch-level)
- [x] **Branch logo upload/remove** uses branch-scoped Cloudinary credentials

## ✅ OrgSecrets Unified Table

- [x] **OrgSecrets** unified table — SMTP credentials + Cloudinary credentials stored
  per-org/per-branch (replaces env-only approach for multi-tenant isolation)

## ✅ DB Schema Changes

- [x] **ScanDevice + AttendanceScan** merged — single model for gate scan data
- [x] **StaffAttendance** extended — new fields for daily/monthly views, leave tracking
- [x] **Migration applied** — schema changes deployed alongside feature code

## ✅ Documentation

- [x] `APPLICATION_FLOW.md` — end-to-end flow (English/Roman)
- [x] `APPLICATION_FLOW_URDU.md` — Roman Urdu version
- [x] `APPLICATION_FLOW_DEEP.md` — **deep, code-verified** version (ab sirf 1 SUPER_ADMIN —
  org-level concept remove ho chuka, section updates 2026-08-17)
- [x] `docs/SUPER_ADMIN_FLOW.md` — yeh flow file
- [x] `API_ROUTES.md` — 144 routes ka full map
