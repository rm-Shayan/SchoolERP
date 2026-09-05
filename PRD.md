# School ERP Platform — Product Requirements Document (PRD)

## 1. Product Overview

**School ERP** is a **multi-tenant SaaS platform** for managing school operations across organizations with multiple branches/campuses. It provides role-based dashboards for platform owners, school administrators, teachers, receptionists, parents, and students — with real-time attendance via QR/RFID scanning, fee management, exam results, and communication tools.

**Architecture:** Next.js 16 (Turbopack) frontend + Express/Node.js backend + Prisma (PostgreSQL) + Redis + Socket.io + BullMQ workers.

---

## 2. Target Users & Roles

| Role | Scope | Description |
|------|-------|-------------|
| **SUPER_ADMIN** | Platform-wide | SaaS operator — manages organizations, branches, users, health monitoring, imports |
| **ADMIN** | Single branch | Principal / Branch Head — manages students, staff, academics, fees, exams, attendance |
| **TEACHER** | Assigned sections | Class/subject teacher — marks attendance, manages homework, gives conduct remarks |
| **RECEPTIONIST** | Single branch | Front desk — student CRUD, admissions, real-time gate attendance scanning, attendance records/live view, leave, announcements, notifications |
| **PARENT** | Own children | Views child's attendance, fees, homework, results, sends leave requests |
| **STUDENT** | Own data | Views own attendance, homework, timetable, exam results, study materials |

### 2.1 Portal Tabs (14 tabs)

| Tab | Parent View | Student View |
|-----|-------------|--------------|
| Overview | All linked children (aggregated) | Own data only |
| Attendance | All children, monthly | Own, monthly |
| Fees | All children | Own |
| Homework | All child sections | Own section |
| Materials | All child sections | Own section |
| Notices | School-wide circulars | School-wide |
| Results | All children | Own |
| Exams | All child classes, date sheet PDF | Own class |
| Timetable | All child sections, PDF download | Own section |
| Conduct | All children | Own |
| PTM | Upcoming scheduled sessions | Upcoming scheduled |
| Leave | All children (request + list) | Resolves via parent |
| Notifications | Realtime inbox (WS) | Realtime inbox (WS) |
| Profile | Parent profile + children | Student profile |

### 2.2 Role Access Matrix

| Action / Module | SUPER_ADMIN | ADMIN | RECEPTIONIST | TEACHER | PARENT | STUDENT |
|---|---|---|---|---|---|---|
| Organizations CRUD | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Branch/School CRUD | ✅ | ✅ (own) | ❌ | ❌ | ❌ | ❌ |
| Students — view | ✅ | ✅ | ✅ | ✅ (own sections) | ✅ (own child) | ✅ (own) |
| Students — create/edit/photo/status | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Students — delete/import/reissue-ID | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admissions pipeline | ✅ | ✅ | ✅ | ❌ | ✅ (submit) | ❌ |
| Academic setup (years/classes/sections) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Teaching assignments / promotions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gate scanner / student attendance | ✅ | ✅ | ✅ | ✅ (own section) | ✅ (view child) | ✅ (view own) |
| Staff attendance | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| Fee structures / collection | ✅ | ✅ | ❌ | ❌ | ✅ (view/pay child) | ✅ (view own) |
| Fee records (read) | ✅ | ✅ | ✅ (read-only) | ❌ | ✅ | ✅ |
| Exams — schedule/results entry | ✅ | ✅ | ✅ (view) | ✅ (own class entry) | ✅ (view child) | ✅ (view own) |
| Exam stats / result card | ✅ | ✅ | ✅ (view) | ✅ (view) | ✅ (view child) | ✅ (view own) |
| Homework — post | ✅ | ✅ | ❌ | ✅ (own class) | ✅ (view child) | ✅ (view own) |
| Study Materials — CRUD | ✅ | ✅ | ❌ | ✅ (own) | ✅ (view child) | ✅ (view own) |
| Timetable | ✅ | ✅ | ❌ | ✅ (own) | ✅ (view child) | ✅ (view own) |
| Conduct remarks — give | ✅ | ✅ | ❌ | ✅ | ✅ (view child) | ✅ (view own) |
| Conduct — list by teacher/school | ✅ | ✅ | ❌ | ✅ (own) | ❌ | ❌ |
| PTM — manage | ✅ | ✅ | ❌ | ✅ (own sessions) | ✅ (view) | ✅ (view) |
| Circulars / broadcasts | ✅ | ✅ | ✅ (view) | ✅ (view) | ✅ (view) | ✅ (view) |
| Leave — approve | ✅ | ✅ | ❌ | ❌ | ✅ (request) | ✅ (request) |
| Staff leave — request | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Staff leave — approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings (SMTP/storage/branding) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Platform health / audit / imports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Send announcements (portal + email) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Teacher dashboard stats | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Student platform directory | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Multi-Tenancy Model

```
Organization (tenant)
  +-- School / Branch (campus)
       +-- Users (staff: ADMIN, TEACHER, RECEPTIONIST)
       +-- Students
       +-- Parents
       +-- Academic Year -> Terms -> Classes -> Sections -> Subjects
       +-- Teaching Assignments (Teacher -> Class/Section/Subject)
       +-- All domain data (fees, attendance, exams, etc.)
       +-- Per-tenant secrets (SMTP, Cloudinary) via OrgSecrets
```

- **Tenant isolation:** All queries scoped by `schoolId`; platform-wide queries by `organizationId`.
- **Branded URLs:** `/o/{slug}/branch/*` and `/o/{slug}/teacher/*` keep org context in URL.
- **Org branding:** Logo, theme color, school code for login resolution.
- **Per-tenant secrets:** SMTP config, Cloudinary credentials stored in `OrgSecrets`.
- **Tenant-first failover:** Branch SMTP -> Org SMTP -> Platform SMTP; Branch Cloudinary -> Org Cloudinary -> Platform Cloudinary.
- **Credential verification skip:** `SKIP_CREDENTIAL_VERIFICATION=true` env var skips SMTP/Cloudinary verification in dev/test.

---

## 4. Core Feature Modules

### 4.1 Authentication & Authorization
- **Staff login:** school code + email/username/phone + password → JWT access/refresh token rotation
- **Parent login (2 methods):** Direct (school code + phone + portal password) or OTP (WhatsApp)
- **Student login (2 methods):** Direct (school code + roll number + portal password) or OTP (via parent WhatsApp)
- **Portal JWT:** parent (30 days, type: parent, studentIds[], sectionIds[]) / student (30 days, type: student, sectionIds[])
- **authenticateAnyPortal** middleware: accepts both parent + student JWTs on `/portal/*` routes
- **Staff login also accepts portal password** (bcrypt → portal password → school code fallback)
- Role-based route guards per portal (admin/branch/teacher/parent/student)
- Redis-cached auth snapshots (5-min TTL) with block enforcement
- Branch switching for multi-branch admins
- Forgot password, change password, logout-all-devices

### 4.2 Organization & Branch Management (Super Admin)
- Full CRUD for organizations and branches (schools)
- **Branch CRUD UI:** Add/Edit/Delete modals with organization picker, form validation
- **Logo fallback chain:** Branch logo -> Org logo -> Initials (used across all portals)
- Platform overview dashboard (total orgs, branches, students, staff, revenue)
- **Org analytics:** Enrollment trends, attendance rate, fee collection charts per org
- **Branch analytics:** Per-branch enrollment, attendance, fee summary
- **Branch settings page:** SMTP/Cloudinary config per branch with org name (immutable) + branch dropdown
- **Staff avatar fallback:** Org logo when staff/principal has no photo
- **School health audit — two-level view:**
  - Level 1: Organization cards showing health summary (healthy/issue counts)
  - Level 2: Click org card to see all branches with health status
  - All branches shown (not just issues), with colored status badges
  - Health banner with solid `#6D28D9` color matching portal theme
- **Health query improvement:** `branchAccess` JSON array checked for admin detection (not just `schoolId`)
- Branch detail page (admin assignment, logo, SMTP, portal access)
- Block/unblock organizations, branches, users, students, parents
- Bulk import via Excel (BullMQ workers with real-time progress)
- Activity/audit log with filters + CSV export

### 4.3 Student Management
- Student CRUD with section assignment, photo upload
- Roll number, identifier code (QR/RFID), parent linkage
- Bulk import via Excel with progress tracking
- Student status lifecycle: ACTIVE -> GRADUATED / DROPPED_OUT / TRANSFERRED_OUT
- Student ID card PDF generation (front + back, 2-sided)
- Export students to CSV
- Platform-wide student directory (super admin)
- Org-scoped student listing for teachers (assigned sections only)
- **Receptionist:** full create/edit/photo/status access; delete, Excel import, ID reissue are ADMIN-only

### 4.4 Admissions Pipeline
- Public admission form (org-branded, `/o/{slug}/admission`)
- Inquiry intake -> Test scheduling -> Review -> Approval -> Enrollment
- Funnel analytics (stage counts, conversion rates)
- Advance fee collection during admission
- Document upload (B-form, birth certificate, etc.)
- Auto-enrollment into class/section upon approval
- Admission slip PDF generation
- Bulk import admission inquiries
- **Receptionist:** owns the full admission pipeline at the front desk (inquiry -> test -> approve -> advance fee -> enroll)

### 4.5 Attendance System
- **QR/RFID Gate Scanner:** Real-time scan processing (O(1) upsert), WebSocket broadcast to portal
- **Offline sync:** Client-side buffer -> bulk sync when online
- **Section bulk marking:** Teacher/receptionist marks entire section at once
- **Manual override:** Admin overrides individual records
- **Staff attendance:** Daily check-in/out, bulk mark, monthly view, export, import (.xlsx), template download
- **Auto LATE/ABSENT:** Cron jobs auto-mark based on configurable cutoff times (every 15 min, Mon-Sat 7am-6pm)
- **Parent alerts:** Late/absent notifications via email
- **Monthly matrix view:** Calendar heatmap with per-student attendance percentages, day off banner, matrix legend
- **Off-days/holidays:** Configurable per-branch (POST/DELETE /attendance/off-days) + weekly off days (PUT /attendance/weekly-off)
- **Attendance archive:** Yearly rollup (AttendanceYearSummary) — manual archive + auto-archive cron
- **Student yearly summaries:** `GET /attendance/students/:studentId/yearly-summaries` for archived data
- **School model fields:** `offDays` (JSON array of {date, reason}) + `weeklyOff` (JSON array of weekday indices 0-6)
- **Receptionist:** gate scanning, offline sync, section bulk mark, daily/monthly reports, manual override, record delete/update, staff attendance — all assigned (part of `ATTENDANCE` role group)

### 4.6 Fee Management
- **Fee structures:** Year-aware fee definitions with line items (tuition, transport, etc.)
- **Monthly voucher generation:** Auto (1st of month cron) or manual bulk generate
- **Payment recording:** Full/partial payments with allocation across fee heads
- **Receipt & voucher PDFs:** Multiple formats (A5 voucher, receipt)
- **QR scan payment:** Scan voucher QR at desk for quick payment
- **Due day management:** Configurable per-branch due dates
- **Late fee calculation:** Daily cron adds late charges
- **Fee reminders:** Daily email reminders (due + overdue)
- **Fee trends chart:** Monthly collection visualization
- **Bulk print:** Multiple vouchers in one PDF
- **Yearly fee summaries:** Rollup archive for old data

### 4.7 Academic Setup
- Academic years with term management
- Class -> Section -> Subject hierarchy
- Section templates (reusable section name pools per branch)
- Teaching assignments (Teacher -> Class/Section/Subject mapping)

### 4.8 Exams & Results
- **Exam Paper model:** Per-class, per-subject papers with date, start/end time, max marks, room number; optional section scope (NULL = whole class)
- Exam schedule creation with date sheets
- **Exam stats:** Total exams, upcoming, completed, active terms count
- Per-exam, per-student result entry (marks per paper)
- Result publishing with portal visibility
- **Student result card:** `GET /exams/:examId/students/:studentId/card` — formatted result card
- **Exam date sheet PDF:** `GET /portal/exams/:examId/date-sheet` — portal downloadable PDF
- **Teacher exam view:** Assigned section papers with stats
- Exam cleanup cron (year-end)

### 4.9 Homework
- Teachers post homework with class/section/subject
- Homework broadcast to parent portal
- Branch-level homework tracking
- Year-end cleanup cron

### 4.10 Study Materials
- Teachers and admins upload study materials (documents, videos, images, links)
- Material types: DOCUMENT, VIDEO, IMAGE, LINK
- Optional section and subject assignment
- Admin can CRUD any material; teachers can CRUD own only
- Parent/student portal: view study materials for their sections
- **Receptionist excluded:** no access to study materials
- Portal notification on material creation
- WebSocket real-time updates for new materials

### 4.11 Timetable
- Section-level timetable with time slots
- Teacher timetable view
- Excel import/export
- PDF generation (section + teacher)
- Drag-and-drop reorder

### 4.11 Conduct Remarks
- Teachers give behavior/conduct remarks to students
- Remark types: POSITIVE, NEGATIVE, NEUTRAL
- **List by teacher:** `GET /conduct/remarks/mine` — teacher's own remarks
- **List by school:** `GET /conduct/remarks/school` — all remarks in school (ACADEMIC role)
- Student history view, section view, staff view
- **Branch conduct remarks page** for admin management
- **Teacher remarks history page** with undo support
- Conduct cleanup cron (year-end)

### 4.12 PTM (Parent-Teacher Meetings)
- Session scheduling with class range, audience, teacher assignment
- Teacher PTM view with upcoming sessions
- Status tracking: SCHEDULED -> IN_PROGRESS -> COMPLETED -> CANCELLED

### 4.13 Announcements & Communication
- **Circulars:** School-wide or audience-targeted notices
- **Circulars with `eventDate`:** Event-type announcements (Sports Day, Annual Day) stored in Circular table with optional `eventDate` field
- **Activities:** Activity detection/logging table (separate from Circulars)
- **Broadcasts:** One-way messages to parents/staff
- **Portal notifications:** Real-time via WebSocket
- **Email notifications:** Fee reminders, late alerts, admission confirmations
- **Super admin self-notifications:** Branch create/delete/block, org create/block/unblock trigger notifications visible to the super admin
- **Super admin announcements:** Send to org/school admins via portal notifications + email delivery
- **Notification form:** Org/branch dropdown selectors (not manual ID input)
- **Notification logs:** Full audit trail of all communications

### 4.14 Leave Management
- **Student leave:** Parent requests -> Admin reviews (APPROVED/REJECTED)
- **Staff leave:** Staff requests -> Admin reviews
- Leave conflict checking (student already on leave)
- WebSocket real-time updates
- **Receptionist:** can view/handle student leave; staff leave approval stays with ADMIN

### 4.15 Student Promotions
- Year-end student movement: promote, repeat, transfer section, graduate, dropout
- Bulk promote with section mapping
- **Section capacity enforcement:** `assertSectionHasSeat` / `assertSectionHasSeats` — race-safe (SELECT FOR UPDATE) capacity check on student enrollment and bulk promotions
- Promotion history tracking
- Export promotion records

### 4.16 Staff Management
- Staff CRUD with role assignment (ADMIN/TEACHER/RECEPTIONIST)
- Branch assignment for admins
- **Unassigned admin listing:** `GET /auth/users/unassigned-admins` (SUPER_ADMIN)
- **Admin branch assignment:** `POST /auth/users/:id/assign-branch` (SUPER_ADMIN)
- Staff ID card generation
- Staff attendance (check-in/out, bulk mark, monthly view, import, template download)
- **Staff leave self-service:** `POST /staff-leave/request`, `GET /staff-leave/my`, `PATCH /staff-leave/my/:id`, `DELETE /staff-leave/my/:id`
- Staff leave admin: list all, create on behalf, review (approve/reject)
- **Staff attendance daily report** with Redis cache (5 min TTL)
- Bulk import via Excel
- Password reset, reactivation
- **Teacher dashboard stats:** `GET /teaching-assignments/schools/:schoolId/dashboard-stats` — assignments, upcoming PTMs, homework count, timetable slots

### 4.17 Parent/Student Portal
- **14-tab dashboard:** Overview, Attendance, Fees, Homework, Materials, Notices, Results, Exams, Timetable, Conduct, PTM, Leave, Notifications, Profile
- **Login (2 methods):** Direct (school code + phone/roll + portal password) or OTP (WhatsApp)
- **Parent:** sees all linked children via sibling selector; student JWT payload includes `studentIds[]`, `sectionIds[]`
- **Student:** sees own data only (no sibling selector); JWT payload includes `sectionIds[]`
- **Portal authentication:** `authenticateAnyPortal` middleware accepts both parent and student JWTs on all `/portal/*` routes
- **15 portal API routes** (`/api/v1/portal/*`): overview, attendance, fees, homework, circulars, results, timetable, conduct, PTM, leave (GET+POST), exams, exam date sheet PDF, timetable PDF, study materials
- **PDF downloads:** timetable PDF, exam date sheet PDF
- **Leave requests:** parent/student submits → validates student belongs to portal → checks overlapping approved leaves → notifies school admin via portal notification + WebSocket `leave_request_created`
- **Portal notifications:** realtime inbox via WebSocket (`portal_notification_created`, `portal_all_read`)
- **Org-branded portal pages** with theme color

### 4.18 Documents & PDF Generation
- Fee vouchers (A5 format)
- Payment receipts
- Student ID cards (2-sided PDF)
- Staff ID cards with QR
- Admission slips
- Exam result cards
- Student/staff QR codes

### 4.19 Portal Password Management
- Branch admin **Settings → Portal Access** manages shared parent/student portal password
- `GET /schools/:id/portal-password` → status (custom/default)
- `PUT /schools/:id/portal-password` → set/update custom hashed password
- `DELETE /schools/:id/portal-password` → reset to default (school code)
- Default password = school code (when admin hasn't set custom)

### 4.20 Storage & SMTP Configuration
- Per-tenant Cloudinary or local disk storage with **org name (immutable) + branch dropdown** in forms
- Staff/principal avatar fallback: **org logo shows when user has no photo**
- Per-tenant Cloudinary or local disk storage
- **Per-tenant storage resolution:** Branch Cloudinary -> Org Cloudinary -> Platform Cloudinary
- Per-tenant SMTP with tenant-first failover chain
- **Per-tenant SMTP resolution:** Branch PRIMARY -> Org PRIMARY -> Org SECONDARY -> Platform env
- Platform-wide email fallback
- Test email sending
- **Credential verification skip:** `SKIP_CREDENTIAL_VERIFICATION=true` env var for dev/test
- **Organization ID tracking:** All uploads correctly pass `organizationId` for tenant resolution
- **Announcement emails:** Super admin announcements trigger email delivery to all target admins

### 4.20 Analytics & Branch Settings
- **Org analytics dashboard:** Enrollment trends, attendance rate, fee collection summary
- **Branch analytics:** Per-branch enrollment trends, attendance rate, fee collection
- **Branch settings page:** `/admin/branch-settings` — all branches SMTP/Cloudinary at one place

### 4.21 Platform Infrastructure
- **WebSocket (Socket.io):** Redis pub/sub adapter, room-based isolation, JWT auth
- **Background jobs (BullMQ):** 7 import queues with progress tracking
- **Cron jobs (node-cron):** 11 scheduled jobs (late mark, fee reminders, auto vouchers, cleanup, archive)
- **Rate limiting:** Login (20/15min), OTP (10/15min), sensitive ops (30/15min), global (300/min)
- **Email outbox:** Durable PendingEmail table with retry worker
- **Metrics:** Prometheus endpoint (`/metrics`)
- **Readiness check:** `/ready` endpoint
- **Graceful shutdown:** Drain emits -> close WS -> stop workers -> quit Redis -> disconnect Prisma

### 4.21 Receptionist Front-Desk Role (Detailed)

**Role intent:** Front desk / gate operator. Handles day-to-day student & admission operations and attendance at the branch, but is **excluded from financial, academic-structure, and HR management** (those stay with ADMIN/Principal).

**What RECEPTIONIST CAN do:**

| Area | Ability | Backend routes granted |
|------|---------|-----------------------|
| **Student management** | Create, edit, update photo, change status (no delete, no Excel import, no ID reissue) | `POST /students/schools/:schoolId`, `PATCH /students/:id`, `POST /students/:id/photo`, `PATCH /students/:id/status` |
| **Student read** | View full student list, filter by section/class/status, search | `GET /students` |
| **Admissions** | Full pipeline: inquiry, schedule test, pass/fail, approve, record advance fee, enroll, reject | `ADMISSIONS` group = ADMIN + RECEPTIONIST |
| **Attendance (students)** | Gate scan, offline sync, section bulk mark, daily report, monthly report, manual override, delete record, update record | `ATTENDANCE` group = ADMIN + RECEPTIONIST + TEACHER |
| **Staff attendance** | Bulk mark, daily, monthly, check-in/out, delete/update record, export | `staffAttendance` — RECEPTIONIST added |
| **Leave** | View & handle student leave | `ALL_STAFF` |
| **Announcements / Notifications** | View circulars, portal notifications | `ALL_STAFF` |

**What RECEPTIONIST CANNOT do (ADMIN-only):**

| Area | Why |
|------|-----|
| Delete students / import students / reissue ID | Destructive/bulk ops reserved for ADMIN |
| Staff management (create/edit/delete users) | HR is ADMIN-only |
| Academic setup (years, terms, classes, sections) | Structure changes are ADMIN-only |
| Fee structures & fee collection | Financial control is ADMIN-only (read-only fee records view allowed) |
| Teaching assignments, promotions | Academic decisions reserved for ADMIN |
| Settings (SMTP, storage, branch profile, branding) | ADMIN-only |
| Freedom to view finance/exams/results beyond read | Management-only actions |

**Practical front-desk workflows:**
1. **Student admission at desk:** New inquiry -> schedule test -> mark result -> approve -> record advance fee -> enroll -> generate QR ID card -> parent email sent automatically.
2. **Student checkout/check-in:** Open gate scanner, scan student's QR/RFID (or type roll number), see live scan result with fee status; offline scans buffer and sync later.
3. **Student record update:** Parent reports phone change -> receptionist updates parent contact fields on the student record.
4. **New student photo:** Upload student photo at ID-card photo session.
5. **Serialize daily attendance:** Receptionist marking whole class/section at once (section bulk) before/after school.

**Role guard:** `branch` portal allows `['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN']`; content-level permissions enforced per route/action on the backend via role groups.

---

## 5. Data Model Summary

**40 Prisma models** covering:

| Domain | Models |
|--------|--------|
| Multi-tenancy | Organization, School, AcademicYear, Term |
| People | User, Parent, Student, Applicant, ApplicantDocument |
| Academics | Class, Section, SectionTemplate, Subject, TeacherAssignment |
| Attendance | AttendanceRecord, AttendanceYearSummary, StaffAttendance |
| Fees | FeeStructure, FeeLineItem, FeeRecord, FeePayment, FeeYearSummary |
| Exams | Exam, ExamPaper, ExamResult |
| Communication | Circular (with optional `eventDate`), HomeworkBroadcast, NotificationLog, PendingEmail |
| Study Materials | StudyMaterial (DOCUMENT/VIDEO/IMAGE/LINK, optional section/subject assignment) |
| Staff Leave | StaffLeave (staff leave requests with review) |
| Leave | LeaveRequest (student leave requests) |
| Other | ConductRemark, PTMSession, TimetableSlot, PromotionRecord, Activity (logging), AuditLog, OrgSecrets, OtpCode, RefreshToken |

---

## 6. API Surface

**28 backend modules** with **312 REST endpoints** under `/api/v1`:

| Module | Endpoint count | Key operations |
|--------|---------------|----------------|
| auth | 30 | Login, register, import, parent/student OTP |
| organization | 14 | CRUD, overview, health (with branchAccess check), branches-health, import/export |
| school | 15 | CRUD, branding, portal password, **analytics** |
| student | 11 | CRUD, import, photo, ID card |
| admission | 16 | Pipeline, enroll, advance fee, import |
| fee | 23 | Structures, records, payments, vouchers, reminders |
| attendance | 17 | Scan, sync, bulk mark, reports, archive |
| academic | 24 | Years, terms, classes, sections, subjects |
| exam | 10 | Schedule, results, publish |
| timetable | 12 | CRUD, import/export, PDF |
| portal | 15 | Parent/student unified dashboard (overview, attendance, fees, homework, circulars, results, timetable, conduct, PTM, leave, exams, study-material) |
| study-material | 5 | CRUD for admin/teacher, portal view for parent/student |
| notifications | 8 | Email logs, portal notifications, unread count, mark read, delete, send from super admin |
| smtp | 4 | Settings CRUD + test send |
| storage | 3 | Settings CRUD |
| staff-leave | 8 | Staff leave request, list, create, update, delete, review |
| staff-attendance | 11 | Mark, check-in, bulk, daily/monthly reports, export, import, template |
| documents | 5 | Fee voucher, admission slip, student ID, staff ID, staff QR |
| leave | 7 | Student leave request, list, create, update, delete, review, check |
| teaching-assignments | 5 | Assign, list, list-me, dashboard-stats, remove |
| moderation | 10 | Block/unblock orgs, schools, users, students, parents |
| homework | 5 | CRUD + broadcast to parents |
| conduct | 8 | Remarks CRUD, by student/section/teacher/school |
| circulars | 4 | Publish, list, get, delete |
| ptm | 5 | Session scheduling, CRUD |
| timetable | 12 | CRUD, import/export, PDF, reorder, clear |
| activities | 5 | CRUD per school |
| promotions | 7 | Bulk promote, repeat, transfer, graduate, dropout, list, export |
| audit | 2 | List, export CSV |
| exam | 10 | Create, list, get, delete, update, enter results, publish, student result, result card |
| infra | 3 | /health, /ready, /metrics |

---

## 7. Non-Functional Requirements

- **Performance:** Debounced search (150-300ms), `useMemo`/`useCallback` for lists, lazy-loaded pages, virtualized lists
- **Responsiveness:** Mobile (375px) to desktop, scrollable tables on mobile, hamburger nav
- **File size limit:** Max 150 lines per frontend file
- **Form validation:** Client-side required on all forms, inline error display
- **Security:** Tenant isolation on all queries, JWT rotation, block enforcement, rate limiting
- **Code quality:** TypeScript strict, ESLint/oxlint, no inline `new Date()` in render

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, Redux Toolkit, RTK Query |
| Backend | Node.js 22, Express.js, Prisma ORM, PostgreSQL |
| Cache/Queue | Redis (ioredis), BullMQ (7 queues) |
| Real-time | Socket.io with Redis pub/sub |
| Storage | Cloudinary + local disk fallback (tenant-first resolution) |
| Email | Nodemailer with tenant-first SMTP chain + announcement emails |
| PDF | PDFKit |
| Auth | JWT (access + refresh rotation), bcrypt |
| Scheduling | node-cron (11 jobs) |
| Build | Turbopack (frontend), ES Modules (backend) |
