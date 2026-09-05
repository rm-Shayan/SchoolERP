# Super Admin Flow — Kya Kya Hogya Hai (Completed)

> Super Admin flow mein jo cheezein **ban chuki hain aur code mein kaam kar rahi hain** —
> file/file verify kiya gaya. Ye checklist-style hai: jab koi TODO item complete ho to
> `SUPER_ADMIN_FLOW_TODO.md` se yahan move karo.

> **2026-08-17 — Org-level admin (ORG_ADMIN) concept REMOVE:** handover promotion
> (`_ensureOrgAdmin`), "Wahi admin manage kare" mode, aur Branch Switcher sab hata diye
> gaye. SUPER_ADMIN ab sirf platform owner hai; har branch ka apna ADMIN (Principal).
> Migration: `20260817000400_remove_org_admin_role`.

---

## Platform Setup

- [x] **Platform Super Admin seed** — `prisma/seed.js` se sirf 1 banta hai:
  `superadmin@schoolerp.com` (organizationId = `null`)
- [x] **Login** — `/admin/login` (email + password), tokens (access 15m + refresh 7d rotating),
  `getRoleHomePath` → `/admin/dashboard`
- [x] **Session security** — refresh token rotation, logout-all, password change par sab sessions revoke,
  block hone par sab sessions revoke

## Admin Console (Frontend)

- [x] **Dashboard** (`/admin/dashboard`) — platform stats: total orgs, branches, students,
  revenue, 12-month growth, status counts (active / blocked / partially-blocked / setup-pending)
- [x] **Organizations** (`/admin/organizations`) — list + grid view, status badges
  (SETUP_PENDING → ACTIVE, PARTIALLY_BLOCKED, BLOCKED), org filter, block/unblock
- [x] **Create Organization** (`/admin/organizations/new`) — single create with logo upload,
  admin assignment, credentials email (self-designation skip)
- [x] **Org Detail** (`/admin/organizations/:id`) — KPIs: branches, staff, students, revenue
  (ek response mein), Add Branch, block/unblock
- [x] **Branch Detail** (`/admin/organizations/:orgId/schools/:schoolId`) — branch info,
  admin reassign, block/unblock, **branch logo upload/remove**
- [x] **Branches** (`/admin/branches`) — saari branches, org filter, status badges, block/unblock
- [x] **Users** (`/admin/users`) — platform-wide directory, stats by role, filters
  (search/role/status/reason), profile modal, **Export CSV**, block/unblock with reason dialog
- [x] **Import Data** (`/admin/import`) — org bulk import + branch bulk import,
  **live progress** (WebSocket `job:{id}`)
- [x] **Activity Log** (`/admin/activity`) — full audit trail (kisne, kya, kab, IP, details)
- [x] **Settings** (`/admin/settings`) — profile, avatar upload, password change, account details

## Branch CRUD UI (Session 1 Sep 2026)

- [x] **Add Branch modal** — org picker dropdown, branch name, code, address, phone, admin fields
- [x] **Edit Branch modal** — name, code, address, phone (all editable)
- [x] **Delete Branch** — confirmation dialog + delete
- [x] **Form validation** — required fields, inline errors, disabled submit while submitting
- [x] **Org/branch dropdown selectors** — notification form uses name selectors instead of ID input
- [x] **Logo fallback chain** — branch logo → org logo → initials (Logo component)

## School Health Page Redesign (Session 1 Sep 2026)

- [x] **Two-level view** — Level 1: Org cards grid with health summary; Level 2: Click org → all branches
- [x] **All branches shown** — not just issues, with colored status badges (red/amber/green)
- [x] **Health stats cards** — Total, Healthy, Blocked, Issues counts per org
- [x] **Health banner** — solid `#6D28D9` color (matching super admin portal theme)
- [x] **Org health detail** — branch list with logo, name, code, issue badges
- [x] **Back navigation** — from org detail back to all orgs view
- [x] **Health query fix** — `branchAccess` JSONB array checked for admin detection
- [x] **PostgreSQL fix** — `jsonb_array_elements_text()` instead of `unnest(jsonb)`

## Notification System (Session 1 Sep 2026)

- [x] **Portal notifications page** — list, unread-count, read, read-all
- [x] **Super admin self-notifications** — own actions visible (branch create/delete/block, org create/block)
- [x] **Announcement emails** — super admin announcements trigger portal notifications + email to target admins
- [x] **Notification form** — org/branch dropdown selectors (not manual ID input)
- [x] **Notification bell fix** — super admin loads notifications with `organizationId` param
- [x] **Email template** — `announcementEmail` template for maintenance/announcement emails
- [x] **Notification types** — SCHOOL_CREATED, SCHOOL_DELETED, ORG_CREATED, ORG_DELETED added

## Storage & SMTP (Session 1 Sep 2026)

- [x] **SKIP_CREDENTIAL_VERIFICATION** — env var for dev/test (skips SMTP/Cloudinary verification)
- [x] **Platform Cloudinary fallback** — when tenant has no creds, platform Cloudinary used
- [x] **Organization ID tracking** — all uploads correctly pass `organizationId` for tenant resolution
- [x] **Tenant-first failover** — Branch Cloudinary → Org Cloudinary → Platform Cloudinary
- [x] **SMTP failover** — Branch PRIMARY → Org PRIMARY → Org SECONDARY → Platform env
- [x] **Non-blocking branch creation** — SMTP/Cloudinary failures don't block branch create
- [x] **Warnings in toast** — credential issues shown as warnings, not errors

## Circular & Activity (Session 1 Sep 2026)

- [x] **Circular `eventDate`** — optional field for event-type announcements (Sports Day, Annual Day)
- [x] **Activity table preserved** — kept for activity detection/logging (separate from Circulars)
- [x] **ActivityService** — CRUD endpoints exist for activity logging

## Backend APIs (220+ routes)

- [x] **Auth (30)** — login, refresh, me, logout(-all), change-password, users CRUD,
  parent OTP (request/verify/me), student direct login + OTP + me
- [x] **Organizations (14)** — CRUD + import-excel + export + **health** + **branches-health**
- [x] **Schools/Branches (14)** — CRUD + import-excel + export + **admin reassign**
- [x] **Portal Notifications (5)** — list, unread-count, read, read-all, **send-from-super-admin**
- [x] **SMTP Settings (3)** — GET/PUT/DELETE per-tenant
- [x] **Storage Settings (3)** — GET/PUT/DELETE per-tenant
- [x] **Moderation (10)** — block/unblock: organization (cascade), school, user, student, parent
- [x] **Academic (26)** — Years, terms, classes, sections, subjects, templates
- [x] **Students (10)** — CRUD, import, photo, status, ID card
- [x] **Admissions (18)** — Pipeline, enroll, advance fee, import
- [x] **Fees (23)** — Structures, records, payments, vouchers, reminders
- [x] **Attendance (11)** — Scan, sync, bulk mark, reports, archive
- [x] **Activities (5)** — CRUD for activity detection/logging
- [x] **Circulars (4)** — with optional `eventDate` field
- [x] **Baaki modules** — Homework (4), Exams (8), Conduct (4), PTM (5), Timetable (6),
  Promotions (8), Substitutes (4)

## Core Flows (Code-Verified)

- [x] **Org creation** — SETUP_PENDING → default branch auto ("Main Campus", code `-01` unique) →
  ADMIN principal (bcrypt 12, auto password `hex+A1!`) → credentials email → cache bust + WS
- [x] **"Delivered" cycle** — pehli login par `markDeliveredOnLogin()` → ACTIVE (UI: Delivered)
- [x] **Bulk org import** — BullMQ worker, duplicate skip, self-designation skip, live progress
- [x] **Branch creation — ek hi mode** ("Naya Principal banao"): naya ADMIN + creds email
  (duplicate email check pehle). "Wahi admin manage kare" (org-level handover) **remove** ho chuka
- [x] **Branch admin reassign** — purana principal deactivate → naya ADMIN create + creds email
- [x] **Branch Switcher REMOVE** — org-level admin exist nahi karta, isliye component delete
- [x] **Blocking matrix** — org (cascade + sessions revoke), branch (org → PARTIALLY_BLOCKED),
  user (hierarchy guardrails), student/parent (branch scope); sab **reversible**
- [x] **Org delete** — background worker, transaction (children → parents), SUPER_ADMIN detach,
  logo cleanup, cache clear
- [x] **Branch delete** — transaction subtree delete, logo guard (single-branch sync)
- [x] **Branch CRUD UI** — Add/Edit/Delete modals with org picker, form validation

## Emails

- [x] **Direct SMTP (Redis-free)** — `email.queue.js`: 3 attempts, backoff, kabhi throw nahi
- [x] **Templates** — orgCredentials, adminCredentials (principal/org-admin), staffCredentials, OTP,
  **announcementEmail** (maintenance/announcement)
- [x] **Branded login links** — `/o/{slug}` (org) + `/login?code={schoolCode}` (branch)
- [x] **Self-designation skip** — khud ki email par credentials email nahi jati
- [x] **Announcement emails** — super admin announcements → email to all target admins

## Background Jobs & Schedulers

- [x] **BullMQ queues** — organization-import, organization-delete, school-import, staff-import,
  student-import (`drainDelay: 15` — Upstash quota save)
- [x] **Auto-absent job** — 8:30 AM Mon–Sat: unscanned students → ABSENT + parent email + WS
- [x] **Fee reminder job** — 9:00 AM daily: overdue sweep (OVERDUE) + reminders email

## Caching & Realtime

- [x] **Redis caches** — `orgs:all`, `org:{id}`, `superadmin:overview` (120s),
  `schools:all`, `schools:org:{id}`, `school:{id}`, `attendance:daily:{schoolId}:{date}`
  — har mutation par bust
- [x] **WebSocket rooms** — `super_admins`, `org:{id}`, `school:{id}`, `job:{jobId}` —
  status pills, badges, import progress, gate live view realtime update## Audit Trail

- [x] Har action log: CREATE/UPDATE/DELETE org, school, staff, ASSIGN_SCHOOL_ADMIN,
  BLOCK/UNBLOCK (org/school/user/student/parent), LOGIN/LOGOUT, PARENT/STUDENT_LOGIN
  — actor + entity + IP + details
- [x] **Audit Log CSV Export** — Activity Log page par Export CSV button, current filters apply
- [x] **Audit Log Service Fix** — empty string values stripped before API call (Zod validation fix)
- [x] **Audit Log Backend** — `GET /audit-logs` + `GET /audit-logs/export` (MANAGEMENT role)


- [x] Har action log: CREATE/UPDATE/DELETE org, school, staff, ASSIGN_SCHOOL_ADMIN,
  BLOCK/UNBLOCK (org/school/user/student/parent), LOGIN/LOGOUT, PARENT/STUDENT_LOGIN
  — actor + entity + IP + details

## Slug / Branded Login (Super Admin Side)


- [x] **Slug display on org UI** — OrganizationsTable, OrganizationsGrid, OrgHeader — `/o/{org.slug}` link
- [x] **Slug on grid cards** — `OrgCard` par `Code: X · /o/{slug}` + **Copy link** button
- [x] **Copy login link button** — `OrgHeader` mein "Copy Link" button → clipboard
- [x] **View Public Page button** — shared `parts/PublicPageButton.tsx`: `/o/{slug}` new tab
- [x] **Slug login URL** — `/o/:slug` → `/login?org={slug}` → branded login
- [x] **Subdomain support** — `{orgslug}.domain.com` → branded login (`EntryRouter`)

## Console Features

- [x] **Create User (console)** — Users page par "Create User" button + modal
- [x] **Settings — Platform tab** — notification delivery summary
- [x] **Notification Logs page** — `/admin/notifications` — logs table + filters + pagination
- [x] **Branch CRUD modals** — Add/Edit/Delete branches from branch cards

## Per-Org Theming

- [x] **`Organization.themeColor`** — schema + migration
- [x] **Backend** — `getBranding()` org themeColor return (fallback `#2563eb`)
- [x] **Frontend** — org create form + EditOrgModal color picker; branded login org color use

## Email Attachments

- [x] **`email.service.js` attachments support** — nodemailer attachments + mock print
- [x] **Admission approve** → `admission-slip-*.pdf` attach
- [x] **Admission enroll** → `student-id-*.pdf` (QR ID card) attach
- [x] **Fee payment** → `fee-receipt-*.pdf` attach

## Student/Parent Portal

- [x] **Student portal** — login + dashboard + 10 tabs + realtime + mobile-responsive
- [x] **Parent portal** — login + dashboard + realtime updates
- [x] **Mobile-responsive** — both portals fully responsive (375px → desktop)

## Staff Attendance & Leave

- [x] **Staff attendance** — daily + monthly views, CRUD, import/export
- [x] **Staff leave** — self-service request + admin approval + realtime WS updates

## Singleton Password Login

- [x] **Staff singleton password** — staff can now use portal password for login

## Socket Fixes (Realtime)

- [x] **Parent portal realtime** — token fix + event listeners working
- [x] **Student portal realtime** — same token fix + event listeners wired

## Cloudinary Branch-Level

- [x] **School documents** use branch-scoped Cloudinary credentials
- [x] **Branch logo upload/remove** uses branch-scoped Cloudinary credentials
- [x] **Platform fallback** — when tenant has no creds, platform Cloudinary used

## OrgSecrets Unified Table

- [x] **OrgSecrets** unified table — SMTP + Cloudinary credentials per-org/per-branch

## DB Schema Changes

- [x] **ScanDevice + AttendanceScan** merged — single model
- [x] **StaffAttendance** extended — new fields
- [x] **Migration applied** — schema changes deployed

## Documentation

- [x] `APPLICATION_FLOW.md` — end-to-end flow
- [x] `APPLICATION_FLOW_URDU.md` — Roman Urdu version
- [x] `APPLICATION_FLOW_DEEP.md` — deep, code-verified version
- [x] `docs/SUPER_ADMIN_FLOW.md` — super admin flow
- [x] `API_ROUTES.md` — 220+ routes documented
- [x] `MVP.md` — MVP checklist updated
- [x] `PRD.md` — product requirements updated
