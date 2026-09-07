# MVP.md — School ERP Platform

## Status: MVP ACHIEVED (with polish items below)

Based on full codebase audit (31 Aug 2026) + session updates (1 Sep 2026) + portal routes audit (2 Sep 2026) + lifecycle updates (7 Sep 2026), this project has **all core modules implemented** — both backend (28 modules, 322 endpoints, 40+ data models) and frontend (500+ components, 4 role-based portals). The platform is functional end-to-end. Build passes, backend tests pass, lint fixed (oxlint), and hardening (security headers, CORS, rate limits) is in place.

---

## MVP Feature Checklist

### Multi-Tenancy & Platform Management
- [x] Organization CRUD (create, edit, delete, logo upload)
- [x] Branch/School CRUD (create, edit, delete, assign admin)
- [x] Org-scoped branding (theme color, logo, slug-based URLs)
- [x] Platform overview dashboard (orgs, branches, students, staff, revenue)
- [x] School health audit — two-level view (org cards → branch details)
- [x] Org health filter with per-org branch health detail
- [x] All branches shown in health view (not just issues)
- [x] Health banner with solid `#6D28D9` color
- [x] Block/unblock (orgs, branches, users, students, parents)
- [x] Bulk import via Excel (orgs, branches, staff, students, admissions, timetables)
- [x] Activity/audit log with filters + CSV export
- [x] Platform-wide user directory
- [x] Org public landing page (ISR, branded)
- [x] Branch CRUD UI (Add/Edit/Delete modals with org picker)
- [x] Logo fallback chain: branch logo → org logo → initials
- [x] Org analytics dashboard (enrollment, attendance, fees charts)
- [x] Branch analytics (per-branch enrollment, attendance, fee summary)
- [x] Branch settings page (`/admin/branch-settings`) — SMTP/Cloudinary config per branch
- [x] SMTP/Cloudinary forms with org name (immutable) + branch dropdown
- [x] Staff avatar fallback: org logo when no user photo

### Authentication & Authorization
- [x] Staff login (school code + email + password)
- [x] Parent login (school code + phone + password / OTP)
- [x] Student login (school code + roll number / OTP)
- [x] JWT access + refresh token rotation
- [x] Role-based route guards (SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST)
- [x] Branch switching for multi-branch admins
- [x] Forgot password / change password
- [x] Logout all devices
- [x] Redis auth cache with block enforcement

### Student Management
- [x] Student CRUD (create, edit, delete, photo upload)
- [x] Section assignment with class/section hierarchy
- [x] Roll number + identifier code (QR/RFID) generation
- [x] Student status lifecycle (ACTIVE, GRADUATED, DROPPED_OUT, TRANSFERRED_OUT)
- [x] Transfer Certificate (TC) generation — formal PDF with school header, student details, reason, conduct, signatures
- [x] Lifecycle rollback — reactivate GRADUATED/DROPPED_OUT/TRANSFERRED_OUT students back to ACTIVE
- [x] Bulk graduate / bulk dropout for last-class sections
- [x] PromotionRecord audit trail for all lifecycle changes (including REACTIVATED)
- [x] Parent portal auto-deactivation on student lifecycle exit, auto-reactivation on rollback
- [x] Bulk import via Excel
- [x] Student ID card PDF (2-sided)
- [x] CSV export
- [x] Org-scoped student listing for teachers

### Admissions
- [x] Public admission form (org-branded)
- [x] Inquiry → Test → Review → Approve → Enroll pipeline
- [x] Funnel analytics
- [x] Advance fee collection
- [x] Document upload
- [x] Admission slip PDF
- [x] Bulk import inquiries

### Attendance
- [x] QR/RFID gate scanner with real-time WebSocket
- [x] Offline sync buffer + bulk upload
- [x] Section bulk marking (teacher/receptionist)
- [x] Manual override (admin)
- [x] Staff attendance (check-in/out, bulk, monthly, export, import, template)
- [x] Auto LATE → ABSENT cron job (every 15 min, Mon-Sat 7am-6pm)
- [x] Parent late/absent email alerts
- [x] Monthly matrix view (calendar heatmap + day off banner + matrix legend)
- [x] Off-days/holidays (POST/DELETE) + weekly off config (PUT)
- [x] Attendance archive (yearly rollup — manual + auto-archive cron)
- [x] Student yearly summaries endpoint

### Fee Management
- [x] Fee structures with line items
- [x] Monthly voucher generation (auto + manual)
- [x] Payment recording (full/partial, allocation by head)
- [x] Receipt + voucher PDFs (A5 format)
- [x] QR scan payment at desk
- [x] Due day management
- [x] Late fee calculation cron
- [x] Fee reminder emails
- [x] Fee trends chart
- [x] Bulk print vouchers
- [x] Yearly fee summaries

### Academic Setup
- [x] Academic years + terms
- [x] Class → Section → Subject hierarchy
- [x] Section templates
- [x] Teaching assignments

### Exams & Results
- [x] Exam schedule with date sheets
- [x] Exam Paper model (per-class, per-subject papers with date, time, marks, room)
- [x] Exam stats (total, upcoming, completed, terms)
- [x] Per-student result entry (marks per paper)
- [x] Result publishing
- [x] Student result card (GET /exams/:examId/students/:studentId/card)
- [x] Exam date sheet PDF (portal downloadable)
- [x] Teacher exam view for assigned sections
- [x] Exam cleanup cron (year-end)

### Homework
- [x] Teacher post homework (class/section/subject)
- [x] Broadcast to parent portal
- [x] Branch-level tracking

### Study Materials
- [x] Admin CRUD for study materials (DOCUMENT/VIDEO/IMAGE/LINK types)
- [x] Teacher CRUD for own study materials
- [x] Optional section and subject assignment
- [x] Parent/student portal view (Materials tab)
- [x] Receptionist excluded from study materials
- [x] Portal notifications for new materials

### Timetable
- [x] Section-level timetable slots
- [x] Teacher timetable view
- [x] Excel import/export
- [x] PDF generation (section + teacher)
- [x] Reorder slots

### Conduct Remarks
- [x] Teacher gives remarks (POSITIVE/NEGATIVE/NEUTRAL)
- [x] List by teacher (GET /conduct/remarks/mine)
- [x] List by school (GET /conduct/remarks/school)
- [x] Student history, section view, staff view
- [x] Branch conduct remarks page for admin
- [x] Teacher remarks history page with undo
- [x] Conduct cleanup cron (year-end)

### PTM (Parent-Teacher Meetings)
- [x] Session scheduling
- [x] Teacher PTM view
- [x] Status tracking

### Announcements & Notifications
- [x] Circulars (school-wide / audience-targeted)
- [x] Circulars support `eventDate` field for event-type announcements
- [x] Activities table (activity detection/logging)
- [x] Real-time portal notifications (WebSocket)
- [x] Super admin self-notifications for actions (branch create/delete/block, org create/block)
- [x] Super admin announcements → portal notifications + email to target admins
- [x] Notification form with org/branch dropdown selectors
- [x] Super admin notification list shows own actions

### Leave Management
- [x] Student leave (parent request → admin review)
- [x] Staff leave (staff request → admin review)
- [x] Conflict checking + real-time updates

### Student Promotions
- [x] Promote, repeat, transfer section, graduate, dropout
- [x] Bulk promote with section mapping
- [x] Bulk graduate / bulk dropout for last-class sections
- [x] Section capacity enforcement (race-safe SELECT FOR UPDATE)
- [x] History tracking with REACTIVATED action for rollbacks
- [x] Export promotion records

### Staff Management
- [x] Staff CRUD with role assignment
- [x] Branch assignment + unassigned admin listing + admin branch assignment
- [x] Staff ID card
- [x] Staff attendance (mark, check-in, bulk, daily/monthly reports, export, import, template)
- [x] Staff leave (self-service request/my/update/delete + admin create/review)
- [x] Staff attendance daily report with Redis cache
- [x] Bulk import

### Receptionist (Front-Desk Role)
- [x] Dedicated receptionist nav links (Front Desk, Finance, Attendance, Academics, Communication groups)
- [x] Student management — create, edit, photo upload
- [x] Student read access (list, filter by section/class/status, search)
- [x] Admission pipeline — inquiry → test → approve → advance fee → enroll
- [x] Gate scanner (QR/RFID) + offline sync
- [x] Section bulk attendance marking
- [x] Daily/monthly attendance reports
- [x] Manual attendance override + record delete/update
- [x] Staff attendance (bulk, daily, monthly, check-in/out, export)
- [x] View student leave + announcements + notifications
- [x] Exclusions enforced: no student delete/import/ID-reissue, no staff mgmt, no academic setup, no fee structures/collection, no settings, no TC/rollback/lifecycle changes

### Parent/Student Portal
- [x] Tabbed dashboard (14 tabs: Overview, Attendance, Fees, Homework, Materials, Notices, Results, Exams, Timetable, Conduct, PTM, Leave, Notifications, Profile)
- [x] Sibling selector (parent only — student sees own data)
- [x] Real-time attendance events via WebSocket
- [x] Leave request submission (POST /portal/leave)
- [x] Portal notifications inbox (realtime via WS)
- [x] PDF downloads (timetable PDF, exam date sheet PDF)
- [x] Direct login (school code + phone/roll + portal password)
- [x] OTP login (WhatsApp OTP for parent, student OTP via parent WhatsApp)
- [x] authenticateAnyPortal middleware (parent + student JWT both accepted on /portal/* routes)
- [x] Portal exam sheet tab with date sheet PDF
- [x] PortalErrorBoundary for all portal tabs

### Documents & PDF
- [x] Fee vouchers, receipts, ID cards, admission slips, result cards, QR codes
- [x] Transfer Certificate (TC) — formal A4 PDF with school header, student details, reason, conduct, fee clearance, signatures, stamp area

### Storage & Email
- [x] Per-tenant Cloudinary with platform fallback
- [x] Per-tenant SMTP with tenant-first failover chain
- [x] `SKIP_CREDENTIAL_VERIFICATION` env var for dev/test
- [x] Storage service: org ID correctly passed in all upload paths
- [x] Each org uses its own SMTP/Cloudinary credentials

### Infrastructure
- [x] WebSocket (Socket.io + Redis pub/sub)
- [x] BullMQ background jobs (7 import queues)
- [x] 11 cron jobs (late mark, attendance alerts, fees, due charges, auto voucher, homework cleanup, conduct cleanup, exam cleanup, attendance archive, data cleanup, pending email retry)
- [x] Rate limiting
- [x] Email outbox with retry
- [x] Prometheus metrics
- [x] Graceful shutdown
- [x] Request-scoped tenant context (AsyncLocalStorage)
- [x] Error boundaries (admin, branch, teacher, parent portals)
- [x] API request dedup + service-level caching
- [x] Subject color utilities for timetable

---

## Known Issues & Polish Items

### Build & Lint (Resolved)
- [x] `npm run lint` — fixed: `next lint` (removed in Next 16) → **oxlint** (`Frontend/package.json` + `oxlint` devDependency). Runs with 0 errors (warnings only).
- [x] `npm run build` — passes clean (typecheck + production build, 100+ routes). The two pre-existing `CreateUserModal`/`useCreateUserForm` TS errors are resolved.

### Testing
- [x] Backend unit tests exist — `node --test`, 23 tests passing (`staffAttendance.test.js`, `logoSync.test.js`), `npm test` script in `Backend/package.json`
- [x] Frontend E2E tests exist — Playwright (`tests/*.spec.ts`, `playwright.config.ts`, `@playwright/test` devDependency)
- [ ] Broader test coverage — only 2 backend suites + a couple of E2E specs; critical paths (auth, fee payment, gate scan) not yet covered

### DevOps & Deployment
- [x] CI/CD — GitHub Actions workflow (`.github/workflows/playwright.yml`)
- [x] Docker — backend `Dockerfile` + root `docker-compose.yml` (postgres + redis + backend + nginx) + `.dockerignore`
- [x] Env templates — production `Backend/.env.example` (all required vars documented)
- [ ] Kubernetes manifests / production deployment config (compose is local-dev only)

### Documentation
- [x] PRD.md (product requirements — updated with portal routes, exam papers, teacher dashboard)
- [x] MVP.md (this file — updated with all audit findings)
- [x] API_ROUTES.md (322 routes documented — 29 sections)
- [x] AGENTS.md (project rules for AI agents)
- [x] APPLICATION_FLOW.md (complete application flow — updated with portal routes)
- [x] APPLICATION_FLOW_DEEP.md (code-verified deep flow — updated with roles, portal routes)
- [x] Flow docs (docs/SUPER_ADMIN_FLOW.md, ORG_ADMIN_FLOW.md, etc.)
- [x] README.md — setup instructions, env vars, dev workflow (Frontend/README.md)
- [ ] API documentation (Swagger/OpenAPI) — not yet generated
- [ ] Developer onboarding guide — partial (covered by README + flow docs)

### UX Polish
- [ ] No loading states for some async operations
- [ ] No error boundary coverage for all feature pages
- [ ] Mobile responsiveness not fully verified on all pages
- [ ] No keyboard shortcuts or accessibility (a11y) audit
- [ ] No dark mode support

### Security Hardening
- [x] CORS origin whitelist — `CLIENT_URL` env allowlist + dev-locked origins (`Backend/src/config/cors.js`)
- [x] Request body size limits — 10MB JSON/urlencoded (`app.js`)
- [x] Rate limiting — global limiter on all `/api/v1` routes (`rateLimit.middleware.js`)
- [x] Security response headers — nosniff, frame-deny, referrer-policy, permissions-policy, no-store cache for API responses (`security.middleware.js`)
- [ ] CSP (Content-Security-Policy) — not set on backend (JSON API + `/uploads`, no HTML served)
- [ ] SQL injection testing (Prisma mitigates, but untested)

---

## Session Updates (1 Sep 2026)

### Super Admin Portal — Completed Features

1. **Branch CRUD UI** — Add/Edit/Delete modals with org picker, form validation
2. **Logo Fallback Chain** — branch logo → org logo → initials (Logo component)
3. **SMTP/Cloudinary Non-blocking** — `SKIP_CREDENTIAL_VERIFICATION=true` for dev/test
4. **School Health Redesign** — two-level view (org cards → branch details with all branches)
5. **Health Banner** — solid `#6D28D9` color matching super admin portal theme
6. **Notification Modal Fix** — super admin notifications load with `organizationId` param
7. **Storage Service Fix** — platform Cloudinary fallback, `organizationId` correctly passed
8. **Self-Notifications** — super admin gets notifications for own actions (create/delete/block)
9. **Announcement Emails** — admin announcements now trigger both portal notifications + email
10. **Notification Form** — org/branch dropdowns instead of manual ID input
11. **Circular + Activity** — `eventDate` added to Circular; Activity table kept for logging
12. **Health Query Fix** — `branchAccess` array checked for admin detection (PostgreSQL `jsonb_array_elements_text`)
13. **Banner Styling** — all headers (School, Org, Health) use solid `#6D28D9` color
14. **Audit Log CSV Export** — Export CSV button on Activity Log page with current filter applied
15. **Audit Log Service Fix** — params serialization fix (empty string values stripped before API call to prevent Zod validation errors)
16. **Org Analytics Dashboard** — Enrollment trends, attendance rate, fee collection charts on org detail page
17. **Branch Analytics** — Per-branch enrollment, attendance, fee analytics on branch detail page
18. **Branch Settings Page** — Dedicated `/admin/branch-settings` page for SMTP/Cloudinary config per branch
19. **SMTP/Cloudinary Org Form** — Org name immutable + branch dropdown selector on org detail page
20. **Staff Avatar Fallback** — Org logo shows when staff/principal has no photo (user photo → org logo → initials)
21. **Hydration Fix** — `<div>` inside `<p>` nesting error in StaffMobileCards fixed
16. **Org Analytics Dashboard** — Enrollment trends, attendance rate, fee collection charts on org detail page
17. **Branch Analytics** — Per-branch enrollment, attendance, fee analytics on branch detail page
18. **Branch Settings Page** — Dedicated `/admin/branch-settings` page for SMTP/Cloudinary config per branch
19. **SMTP/Cloudinary Org Form** — Org name immutable + branch dropdown selector on org detail page
20. **Staff Avatar Fallback** — Org logo shows when staff/principal has no photo (user photo → org logo → initials)

---

## Recommended Next Steps (Post-MVP)

1. **Expand test coverage** — auth flow, attendance scan, fee payment, gate E2E
2. **API docs** — Swagger/OpenAPI spec for backend endpoints
3. **Production deployment config** — Kubernetes manifests / platform deployment
4. **Advanced security** — backend CSP (if HTML ever served), security audit, secrets rotation
5. **Performance audit** — Lighthouse scores, bundle analysis, image optimization
6. **Accessibility audit** — keyboard nav, screen-reader, ARIA
7. **Dark mode** — UI theme toggle
8. **Kubernetes manifests** — production deploy

---

## Architecture Summary

```
+-----------------------------------------------------------+
|  Frontend (Next.js 16 + Turbopack)                        |
|  +-- /admin/*      -> SUPER_ADMIN portal                  |
|  +-- /branch/*     -> ADMIN / RECEPTIONIST portal         |
|  +-- /teacher/*    -> TEACHER portal                      |
|  +-- /parent/*     -> PARENT / STUDENT portal             |
|  +-- /o/[slug]/*   -> Org-branded routes                  |
+-----------------------------------------------------------+
|  Backend (Express + Prisma + Redis)                        |
|  +-- 28 modules, 322 REST endpoints                       |
|  +-- Socket.io (real-time events)                         |
|  +-- BullMQ (7 import workers)                            |
|  +-- node-cron (11 scheduled jobs)                        |
+-----------------------------------------------------------+
|  Data (PostgreSQL + Redis)                                 |
|  +-- 40 Prisma models                                     |
|  +-- Redis (auth cache, sessions, real-time, queues)      |
+-----------------------------------------------------------+
```

---

## Last Updated
07 September 2026 — Student lifecycle (TC, rollback, bulk graduate/dropout), receptionist portal, access control hardening. 322 API routes across 28 modules, 14 portal tabs, 40+ Prisma models.
