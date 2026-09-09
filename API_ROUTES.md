# ERP Backend API Routes

> Base URL: `/api/v1` (all routes below are relative to this prefix)

**Total routes: 322** (319 API routes + 3 infra: `/health`, `/ready`, `/metrics`)

---

## Role Groups Reference

| Group | Roles |
|-------|-------|
| **ALL_STAFF** | SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST |
| **MANAGEMENT** | SUPER_ADMIN, ADMIN |
| **ORG_LEVEL** | SUPER_ADMIN |
| **USER_MANAGERS** | SUPER_ADMIN, ADMIN |
| **FINANCE** | SUPER_ADMIN, ADMIN |
| **ACADEMIC** | SUPER_ADMIN, ADMIN, TEACHER |
| **ADMISSIONS** | SUPER_ADMIN, ADMIN, RECEPTIONIST |
| **ATTENDANCE** | SUPER_ADMIN, ADMIN, RECEPTIONIST, TEACHER |
| **Public** | No auth required |
| **Parent** | Requires Parent portal JWT |
| **Student** | Requires Student portal JWT |
| **Any Portal** | Requires Parent OR Student portal JWT |

> `[...]` in the Role column = explicit role array (not a named group).

---

## Infra (3)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/health` | Public (Redis, socket, drain status) |
| 2 | GET | `/ready` | Public (k8s readiness probe) |
| 3 | GET | `/metrics` | Public (Prometheus scrape) |

---

## Auth (35)

### Staff Auth — Public

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/auth/login` | Public (email + password) |
| 2 | POST | `/auth/refresh` | Public (token rotation) |
| 3 | POST | `/auth/logout` | Public (refresh token in body) |
| 4 | POST | `/auth/forgot-password` | Public (temp password emailed) |

### Staff Auth — Protected

| # | Method | Route | Role |
|---|--------|-------|------|
| 5 | POST | `/auth/switch-branch` | Any authenticated staff |
| 6 | GET | `/auth/my-branches` | Any authenticated staff |
| 7 | GET | `/auth/me` | Any authenticated staff |
| 8 | PATCH | `/auth/me` | Any authenticated staff |
| 9 | POST | `/auth/me/avatar` | Any authenticated staff (image upload) |
| 10 | POST | `/auth/logout-all` | Any authenticated staff |
| 11 | POST | `/auth/change-password` | Any authenticated staff |

### User Management

| # | Method | Route | Role |
|---|--------|-------|------|
| 12 | POST | `/auth/users/import` | USER_MANAGERS (.xlsx bulk import) |
| 13 | POST | `/auth/users` | USER_MANAGERS |
| 14 | POST | `/auth/users/sample` | USER_MANAGERS (demo staff creator) |
| 15 | GET | `/auth/users/import-template` | USER_MANAGERS (.xlsx template download) |
| 16 | GET | `/auth/users` | USER_MANAGERS |
| 17 | GET | `/auth/users/export` | USER_MANAGERS (.xlsx export) |
| 18 | GET | `/auth/users/directory` | SUPER_ADMIN (unified platform directory) |
| 19 | GET | `/auth/users/all` | SUPER_ADMIN (platform-wide user list) |
| 20 | GET | `/auth/users/all/export` | SUPER_ADMIN (CSV export) |
| 21 | GET | `/auth/users/unassigned-admins` | SUPER_ADMIN (admins not assigned to branch) |
| 22 | GET | `/auth/users/:id` | USER_MANAGERS |
| 23 | PATCH | `/auth/users/:id` | USER_MANAGERS |
| 24 | DELETE | `/auth/users/:id` | USER_MANAGERS (soft-deactivate) |
| 25 | PATCH | `/auth/users/:id/reactivate` | USER_MANAGERS |
| 26 | POST | `/auth/users/:id/reset-password` | USER_MANAGERS |
| 27 | POST | `/auth/users/:id/assign-branch` | SUPER_ADMIN |

### Parent Portal Auth

| # | Method | Route | Role |
|---|--------|-------|------|
| 28 | POST | `/auth/parent/request-otp` | Public (WhatsApp OTP) |
| 29 | POST | `/auth/parent/verify-otp` | Public → returns parent JWT |
| 30 | POST | `/auth/parent/login` | Public (school code + phone + password) |
| 31 | GET | `/auth/parent/me` | Parent |

### Student Portal Auth

| # | Method | Route | Role |
|---|--------|-------|------|
| 32 | POST | `/auth/student/login` | Public (school code + roll number) |
| 33 | POST | `/auth/student/request-otp` | Public (OTP to parent WhatsApp) |
| 34 | POST | `/auth/student/verify-otp` | Public → returns student JWT |
| 35 | GET | `/auth/student/me` | Student (profile read-only) |

---

## Organizations (14)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/organizations/public/slugs` | Public (all org slugs) |
| 2 | GET | `/organizations/public/:slug` | Public (branded landing data) |
| 3 | POST | `/organizations/import-excel` | SUPER_ADMIN |
| 4 | GET | `/organizations/import-template` | SUPER_ADMIN |
| 5 | POST | `/organizations/logo` | SUPER_ADMIN |
| 6 | POST | `/organizations` | SUPER_ADMIN |
| 7 | GET | `/organizations` | SUPER_ADMIN |
| 8 | GET | `/organizations/overview` | SUPER_ADMIN |
| 9 | GET | `/organizations/health` | SUPER_ADMIN (org-level health audit) |
| 10 | GET | `/organizations/export` | SUPER_ADMIN |
| 11 | GET | `/organizations/:id/dashboard` | SUPER_ADMIN |
| 12 | GET | `/organizations/:id` | SUPER_ADMIN |
| 13 | PATCH | `/organizations/:id` | SUPER_ADMIN |
| 14 | DELETE | `/organizations/:id` | SUPER_ADMIN |

---

## Schools (15)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/schools/branding` | Public (?code=SCH-XXX) |
| 2 | POST | `/schools` | SUPER_ADMIN |
| 3 | GET | `/schools` | SUPER_ADMIN, ADMIN |
| 4 | POST | `/schools/import-excel` | SUPER_ADMIN |
| 5 | GET | `/schools/export` | SUPER_ADMIN |
| 6 | GET | `/schools/import-template` | SUPER_ADMIN |
| 7 | POST | `/schools/logo` | SUPER_ADMIN, ADMIN |
| 8 | GET | `/schools/:id` | SUPER_ADMIN, ADMIN |
| 9 | GET | `/schools/:id/analytics` | SUPER_ADMIN, ADMIN (enrollment, attendance, fees) |
| 10 | PATCH | `/schools/:id` | SUPER_ADMIN, ADMIN |
| 11 | GET | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (status: custom/default) |
| 12 | PUT | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (set custom hashed password) |
| 13 | DELETE | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (reset to default code) |
| 14 | PATCH | `/schools/:id/admin` | SUPER_ADMIN (reassign branch admin) |
| 15 | DELETE | `/schools/:id` | SUPER_ADMIN |

---

## Academic (26)

### Academic Years

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/academic/schools/:schoolId/academic-years` | MANAGEMENT |
| 2 | GET | `/academic/academic-years/:id` | ALL_STAFF |
| 3 | GET | `/academic/schools/:schoolId/academic-years` | ALL_STAFF |
| 4 | PATCH | `/academic/academic-years/:id` | MANAGEMENT |
| 5 | DELETE | `/academic/academic-years/:id` | MANAGEMENT |

### Terms

| # | Method | Route | Role |
|---|--------|-------|------|
| 6 | POST | `/academic/academic-years/:academicYearId/terms` | MANAGEMENT |
| 7 | GET | `/academic/academic-years/:academicYearId/terms` | ALL_STAFF |
| 8 | PATCH | `/academic/terms/:id` | MANAGEMENT |
| 9 | DELETE | `/academic/terms/:id` | MANAGEMENT |

### Classes

| # | Method | Route | Role |
|---|--------|-------|------|
| 10 | POST | `/academic/schools/:schoolId/classes` | MANAGEMENT |
| 11 | GET | `/academic/classes/:id` | ALL_STAFF |
| 12 | GET | `/academic/schools/:schoolId/classes` | ALL_STAFF |
| 13 | PATCH | `/academic/classes/:id` | MANAGEMENT |
| 14 | DELETE | `/academic/classes/:id` | MANAGEMENT |

### Section Templates

| # | Method | Route | Role |
|---|--------|-------|------|
| 15 | GET | `/academic/schools/:schoolId/section-templates` | ALL_STAFF |
| 16 | POST | `/academic/schools/:schoolId/section-templates` | MANAGEMENT |
| 17 | PATCH | `/academic/section-templates/:id` | MANAGEMENT |
| 18 | DELETE | `/academic/section-templates/:id` | MANAGEMENT |

### Sections

| # | Method | Route | Role |
|---|--------|-------|------|
| 19 | POST | `/academic/classes/:classId/sections` | MANAGEMENT |
| 20 | GET | `/academic/classes/:classId/sections` | ALL_STAFF |
| 21 | PATCH | `/academic/sections/:id` | MANAGEMENT |
| 22 | DELETE | `/academic/sections/:id` | MANAGEMENT |

### Subjects

| # | Method | Route | Role |
|---|--------|-------|------|
| 23 | POST | `/academic/classes/:classId/subjects` | MANAGEMENT |
| 24 | GET | `/academic/classes/:classId/subjects` | ALL_STAFF |
| 25 | PATCH | `/academic/subjects/:id` | MANAGEMENT |
| 26 | DELETE | `/academic/subjects/:id` | MANAGEMENT |

---

## Students (12)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/students/platform` | SUPER_ADMIN (platform-wide directory) |
| 2 | POST | `/students/schools/:schoolId/import` | MANAGEMENT (.xlsx bulk import) |
| 3 | POST | `/students/schools/:schoolId` | MANAGEMENT + RECEPTIONIST |
| 4 | GET | `/students` | ALL_STAFF |
| 5 | GET | `/students/export` | ALL_STAFF (CSV) |
| 6 | GET | `/students/:id` | ALL_STAFF |
| 7 | PATCH | `/students/:id` | MANAGEMENT + RECEPTIONIST |
| 8 | DELETE | `/students/:id` | SUPER_ADMIN only (hard delete) |
| 9 | POST | `/students/:id/photo` | MANAGEMENT + RECEPTIONIST |
| 10 | PATCH | `/students/:id/status` | MANAGEMENT (graduate/dropout/transfer) |
| 11 | POST | `/students/:id/rollback` | MANAGEMENT (undo lifecycle → ACTIVE) |
| 12 | POST | `/students/:id/reissue-id` | MANAGEMENT (reissue QR/RFID) |

---

## Admissions (19)

### Public

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/admissions/public/classes` | Public |
| 2 | POST | `/admissions/public/inquiry` | Public |

### Authenticated

| # | Method | Route | Role |
|---|--------|-------|------|
| 3 | POST | `/admissions/schools/:schoolId/import` | ADMISSIONS (.xlsx bulk import) |
| 4 | POST | `/admissions/schools/:schoolId` | ADMISSIONS |
| 5 | GET | `/admissions` | ADMISSIONS |
| 6 | GET | `/admissions/export` | ADMISSIONS (CSV) |
| 7 | GET | `/admissions/funnel` | ADMISSIONS (dashboard counts) |
| 8 | PATCH | `/admissions/:id/status` | ADMISSIONS (stage progression) |
| 9 | PATCH | `/admissions/:id` | ADMISSIONS (edit details) |
| 10 | DELETE | `/admissions/:id` | ADMISSIONS |
| 11 | POST | `/admissions/:id/photo` | ADMISSIONS |
| 12 | POST | `/admissions/:id/documents` | ADMISSIONS (B-form / birth cert upload) |
| 13 | DELETE | `/admissions/:id/documents/:docId` | ADMISSIONS |
| 14 | POST | `/admissions/:id/approve` | ADMISSIONS (advance-fee slip PDF + email) |
| 15 | POST | `/admissions/:id/advance-fee` | ADMISSIONS (record advance fee receipt) |
| 16 | POST | `/admissions/:id/enroll` | ADMISSIONS (enroll → Student + QR ID) |
| 17 | GET | `/admissions/:id` | ADMISSIONS (single applicant detail) |
| 18 | GET | `/admissions/:id/slip` | ADMISSIONS (admission slip PDF) |
| 19 | POST | `/admissions/:id/send-slip` | ADMISSIONS (email admission slip) |

---

## Fees (25)

### Fee Structures

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/fees/schools/:schoolId/structures` | FINANCE |
| 2 | GET | `/fees/schools/:schoolId/structures` | FINANCE |
| 3 | GET | `/fees/structures` | FINANCE (query-param filters) |
| 4 | GET | `/fees/structures/:id` | FINANCE |
| 5 | PUT | `/fees/structures/:id` | FINANCE |
| 6 | DELETE | `/fees/structures/:id` | FINANCE |

### Monthly Generation & Due Day

| # | Method | Route | Role |
|---|--------|-------|------|
| 7 | POST | `/fees/generate-monthly` | FINANCE |
| 8 | GET | `/fees/schools/:schoolId/due-day` | FINANCE |
| 9 | PUT | `/fees/schools/:schoolId/due-day` | FINANCE |

### Fee Records

| # | Method | Route | Role |
|---|--------|-------|------|
| 10 | PATCH | `/fees/records/:id/due-date` | FINANCE (extend due date) |
| 11 | GET | `/fees/records/export` | FINANCE (CSV) |
| 12 | GET | `/fees/records/bulk-vouchers` | FINANCE (class PDF) |
| 13 | GET | `/fees/records/summary` | FINANCE (month summary) |
| 14 | GET | `/fees/records/bulk` | FINANCE (all students, one query) |
| 15 | GET | `/fees/records` | FINANCE |
| 16 | GET | `/fees/records/:id` | FINANCE |
| 17 | GET | `/fees/students/:studentId/yearly-summaries` | FINANCE |

### Payments & Documents

| # | Method | Route | Role |
|---|--------|-------|------|
| 18 | POST | `/fees/records/:id/payments` | FINANCE |
| 19 | GET | `/fees/records/:id/receipt` | FINANCE |
| 20 | GET | `/fees/records/:id/voucher` | FINANCE |
| 21 | GET | `/fees/records/:id/voucher-a5` | FINANCE (A5 format) |
| 22 | POST | `/fees/records/:id/scan` | FINANCE (QR scan → mark paid) |
| 23 | POST | `/fees/records/:id/remind` | FINANCE (resend reminder) |

### Reminders & Due Charges

| # | Method | Route | Role |
|---|--------|-------|------|
| 24 | POST | `/fees/reminders` | FINANCE (bulk reminder send) |
| 25 | POST | `/fees/calculate-due-charges` | FINANCE (late fee calculation) |

---

## Attendance (19)

### Gate Scan & Sync

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/attendance/scan` | ATTENDANCE (QR/RFID/manual scan) |
| 2 | POST | `/attendance/sync` | SUPER_ADMIN, ADMIN, RECEPTIONIST (bulk offline sync) |

### Device Management

| # | Method | Route | Role |
|---|--------|-------|------|
| 3 | POST | `/attendance/devices` | SUPER_ADMIN, ADMIN, RECEPTIONIST |
| 4 | GET | `/attendance/devices` | ATTENDANCE |

### Bulk & Staff

| # | Method | Route | Role |
|---|--------|-------|------|
| 5 | POST | `/attendance/section-bulk` | SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST |
| 6 | GET | `/attendance/staff` | SUPER_ADMIN, ADMIN, RECEPTIONIST |

### Off Days & Weekly Off

| # | Method | Route | Role |
|---|--------|-------|------|
| 7 | GET | `/attendance/off-days` | SUPER_ADMIN, ADMIN |
| 8 | POST | `/attendance/off-days` | SUPER_ADMIN, ADMIN |
| 9 | DELETE | `/attendance/off-days/:date` | SUPER_ADMIN, ADMIN |
| 10 | PUT | `/attendance/weekly-off` | SUPER_ADMIN, ADMIN (set off weekdays) |

### Manual Override & Reports

| # | Method | Route | Role |
|---|--------|-------|------|
| 11 | POST | `/attendance/override` | SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST |
| 12 | GET | `/attendance/daily` | ALL_STAFF (live dashboard) |
| 13 | GET | `/attendance/monthly` | SUPER_ADMIN, ADMIN, RECEPTIONIST |
| 14 | GET | `/attendance/students/:studentId` | ALL_STAFF |
| 15 | GET | `/attendance/students/:studentId/yearly-summaries` | ALL_STAFF |

### Record Management

| # | Method | Route | Role |
|---|--------|-------|------|
| 16 | PUT | `/attendance/:id` | SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST |
| 17 | DELETE | `/attendance/:id` | SUPER_ADMIN, ADMIN, RECEPTIONIST |

### Archive

| # | Method | Route | Role |
|---|--------|-------|------|
| 18 | POST | `/attendance/archive` | SUPER_ADMIN, ADMIN (summarize + delete raw) |
| 19 | POST | `/attendance/archive/auto` | SUPER_ADMIN (auto-archive across all schools) |

### Phantom Cleanup (old timezone-bug artifacts)

| # | Method | Route | Role |
|---|--------|-------|------|
| 20 | GET | `/attendance/phantoms?dateFrom&dateTo` | SUPER_ADMIN, ADMIN (preview only — deletes nothing) |
| 21 | POST | `/attendance/phantoms/cleanup` | SUPER_ADMIN, ADMIN (body `{ ids: [...] }` — re-verified server-side) |

---

## Homework (5)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/homework` | ACADEMIC (post + email to parents) |
| 2 | GET | `/homework` | ALL_STAFF |
| 3 | GET | `/homework/:id` | ALL_STAFF |
| 4 | PUT | `/homework/:id` | ACADEMIC (teacher own only) |
| 5 | DELETE | `/homework/:id` | ACADEMIC (teacher own only) |

---

## Exams (10)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/exams/schools/:schoolId` | ACADEMIC |
| 2 | GET | `/exams/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/exams/:id` | ALL_STAFF |
| 4 | GET | `/exams/:id/date-sheet` | ALL_STAFF (PDF download) |
| 5 | DELETE | `/exams/:id` | MANAGEMENT |
| 6 | PUT | `/exams/:id` | MANAGEMENT |
| 7 | POST | `/exams/:id/results` | ACADEMIC (enter results) |
| 8 | POST | `/exams/:id/publish` | MANAGEMENT |
| 9 | GET | `/exams/:examId/students/:studentId` | ALL_STAFF |
| 10 | GET | `/exams/:examId/students/:studentId/card` | ALL_STAFF (result card) |

---

## Conduct (8)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/conduct/remarks` | ACADEMIC |
| 2 | GET | `/conduct/remarks/mine` | ALL_STAFF (teacher's own) |
| 3 | GET | `/conduct/remarks/school` | ACADEMIC |
| 4 | GET | `/conduct/remarks/students/:id` | ALL_STAFF |
| 5 | GET | `/conduct/remarks/sections/:sectionId` | ALL_STAFF |
| 6 | GET | `/conduct/remarks/:id` | ALL_STAFF |
| 7 | PATCH | `/conduct/remarks/:id` | ACADEMIC |
| 8 | DELETE | `/conduct/remarks/:id` | ACADEMIC |

---

## Circulars (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/circulars/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/circulars/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/circulars/:id` | ALL_STAFF |
| 4 | DELETE | `/circulars/:id` | MANAGEMENT |

---

## PTM (5)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/ptm/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/ptm/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/ptm/:id` | ALL_STAFF |
| 4 | PATCH | `/ptm/:id` | MANAGEMENT |
| 5 | DELETE | `/ptm/:id` | MANAGEMENT |

---

## Timetable (12)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/timetable/sections/:sectionId/import` | ACADEMIC (.xlsx import) |
| 2 | GET | `/timetable/sections/:sectionId/export` | ALL_STAFF (.xlsx export) |
| 3 | GET | `/timetable/sections/:sectionId/pdf` | ALL_STAFF |
| 4 | GET | `/timetable/teachers/:teacherId/pdf` | ALL_STAFF |
| 5 | POST | `/timetable/sections/:sectionId` | ACADEMIC (create slot) |
| 6 | GET | `/timetable/sections/:sectionId` | ALL_STAFF |
| 7 | PATCH | `/timetable/sections/:sectionId/reorder` | ACADEMIC |
| 8 | GET | `/timetable/teachers/:teacherId` | ALL_STAFF |
| 9 | GET | `/timetable/slots/:id` | ALL_STAFF |
| 10 | PATCH | `/timetable/slots/:id` | ACADEMIC |
| 11 | DELETE | `/timetable/slots/:id` | MANAGEMENT |
| 12 | DELETE | `/timetable/sections/:sectionId/slots` | ACADEMIC (clear all) |

---

## Activities (5)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/activities/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/activities/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/activities/:id` | ALL_STAFF |
| 4 | PATCH | `/activities/:id` | MANAGEMENT |
| 5 | DELETE | `/activities/:id` | MANAGEMENT |

---

## Notifications (8)

### Email Logs

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/notifications/status` | MANAGEMENT (delivery status) |
| 2 | GET | `/notifications/logs` | ALL_STAFF |

### Portal (In-App) Notifications

| # | Method | Route | Role |
|---|--------|-------|------|
| 3 | GET | `/notifications/portal` | ALL_STAFF |
| 4 | GET | `/notifications/portal/unread-count` | ALL_STAFF |
| 5 | POST | `/notifications/portal/mark-read` | ALL_STAFF |
| 6 | POST | `/notifications/portal/mark-all-read` | ALL_STAFF |
| 7 | POST | `/notifications/portal/delete` | ALL_STAFF |

### Super Admin Send

| # | Method | Route | Role |
|---|--------|-------|------|
| 8 | POST | `/notifications/portal/send` | SUPER_ADMIN (send to org admin) |

---

## Promotions (10)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/promotions/bulk-promote` | MANAGEMENT (year-end bulk) |
| 2 | POST | `/promotions/repeat` | MANAGEMENT (individual repeat) |
| 3 | POST | `/promotions/transfer-section` | MANAGEMENT (mid-year transfer) |
| 4 | POST | `/promotions/graduate` | MANAGEMENT (end-of-year graduation) |
| 5 | POST | `/promotions/dropout` | MANAGEMENT (withdrawal) |
| 6 | POST | `/promotions/bulk-graduate` | MANAGEMENT (bulk graduation) |
| 7 | POST | `/promotions/bulk-dropout` | MANAGEMENT (bulk dropout) |
| 8 | GET | `/promotions` | ALL_STAFF (history with filters) |
| 9 | GET | `/promotions/export` | ALL_STAFF (CSV) |
| 10 | GET | `/promotions/:id` | ALL_STAFF (single record detail) |

---

## Moderation (10)

### Organization

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/moderation/organizations/:id/block` | SUPER_ADMIN |
| 2 | POST | `/moderation/organizations/:id/unblock` | SUPER_ADMIN |

### Branch / School

| # | Method | Route | Role |
|---|--------|-------|------|
| 3 | POST | `/moderation/schools/:id/block` | SUPER_ADMIN |
| 4 | POST | `/moderation/schools/:id/unblock` | SUPER_ADMIN |

### User / Staff

| # | Method | Route | Role |
|---|--------|-------|------|
| 5 | POST | `/moderation/users/:id/block` | MANAGEMENT |
| 6 | POST | `/moderation/users/:id/unblock` | MANAGEMENT |

### Student

| # | Method | Route | Role |
|---|--------|-------|------|
| 7 | POST | `/moderation/students/:id/block` | MANAGEMENT |
| 8 | POST | `/moderation/students/:id/unblock` | MANAGEMENT |

### Parent

| # | Method | Route | Role |
|---|--------|-------|------|
| 9 | POST | `/moderation/parents/:id/block` | MANAGEMENT |
| 10 | POST | `/moderation/parents/:id/unblock` | MANAGEMENT |

---

## Audit Logs (2)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/audit-logs/export` | MANAGEMENT (CSV) |
| 2 | GET | `/audit-logs` | MANAGEMENT (with filters) |

---

## Leave — Student (7)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/leave/request` | ADMIN, TEACHER, PARENT, SUPER_ADMIN |
| 2 | GET | `/leave` | ADMIN, SUPER_ADMIN (all requests) |
| 3 | POST | `/leave` | ADMIN, SUPER_ADMIN (create on behalf) |
| 4 | PATCH | `/leave/:id` | ADMIN, SUPER_ADMIN |
| 5 | DELETE | `/leave/:id` | ADMIN, SUPER_ADMIN |
| 6 | PATCH | `/leave/:id/review` | ADMIN, SUPER_ADMIN (approve/reject) |
| 7 | GET | `/leave/check/:studentId` | Any authenticated staff |

---

## Teaching Assignments (5)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/teaching-assignments/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/teaching-assignments/schools/:schoolId/me` | ALL_STAFF (own assignments) |
| 3 | GET | `/teaching-assignments/schools/:schoolId/dashboard-stats` | ALL_STAFF |
| 4 | GET | `/teaching-assignments/schools/:schoolId` | ALL_STAFF (all assignments) |
| 5 | DELETE | `/teaching-assignments/:id` | MANAGEMENT |

---

## Portal (17)

> All portal routes require either a **Parent** or **Student** JWT via `authenticateAnyPortal`.
> Routes are served at `/api/v1/portal/*`.

### Profile Management

| # | Method | Route | Role | Description |
|---|--------|-------|------|-------------|
| 1 | PATCH | `/portal/me` | Any Portal | Update profile (name, phone, etc.) |
| 2 | POST | `/portal/me/avatar` | Any Portal | Upload profile photo |

### Dashboard & Data

| # | Method | Route | Role | Description |
|---|--------|-------|------|-------------|
| 3 | GET | `/portal/overview` | Any Portal | Aggregated dashboard: attendance, fees, homework, circulars, study material counts |
| 4 | GET | `/portal/attendance` | Any Portal | Monthly attendance summary (?month=&year=) |
| 5 | GET | `/portal/fees` | Any Portal | Fee records + summary (total charged, paid, outstanding) |
| 6 | GET | `/portal/homework` | Any Portal | Recent homework broadcasts for child's section |
| 7 | GET | `/portal/circulars` | Any Portal | School circulars (PARENTS + ALL audience) |
| 8 | GET | `/portal/results` | Any Portal | Exam results across all exams |
| 9 | GET | `/portal/timetable` | Any Portal | Weekly timetable slots for child's section |
| 10 | GET | `/portal/timetable/pdf` | Any Portal | Download timetable as PDF |
| 11 | GET | `/portal/conduct` | Any Portal | Conduct remarks from teachers |
| 12 | GET | `/portal/ptm` | Any Portal | Upcoming PTM sessions (scheduled, future) |
| 13 | GET | `/portal/leave` | Any Portal | Leave requests for this parent's children |
| 14 | POST | `/portal/leave` | Any Portal | Submit leave request (studentId, dateFrom, dateTo, reason) |
| 15 | GET | `/portal/exams` | Any Portal | Exam date sheets for child's classes |
| 16 | GET | `/portal/exams/:examId/date-sheet` | Any Portal | Download exam date sheet as PDF |
| 17 | GET | `/portal/study-material` | Any Portal | Study materials for child's section |

### Portal Data Access Rules

| Data | Parent View | Student View |
|------|-------------|--------------|
| Overview | All linked children | Own data only |
| Attendance | All linked children | Own only |
| Fees | All linked children | Own only |
| Homework | All child sections | Own section only |
| Circulars | School-wide | School-wide |
| Results | All linked children | Own only |
| Timetable | All child sections | Own section only |
| Conduct | All linked children | Own only |
| PTM | School/section/student scoped | School/section/student scoped |
| Leave | All linked children (create + list) | Resolves via parent (create + list) |
| Exams | All child classes | Own class only |
| Study Material | All child sections | Own section only |

> **Note:** The Portal module also serves `GET /auth/student/me` internally (student profile read-only).

---

## SMTP Settings (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/smtp/settings` | SUPER_ADMIN, ADMIN (?organizationId=&schoolId=) |
| 2 | PUT | `/smtp/settings` | SUPER_ADMIN, ADMIN (upsert) |
| 3 | DELETE | `/smtp/settings` | SUPER_ADMIN, ADMIN |
| 4 | POST | `/smtp/settings/test-send` | SUPER_ADMIN, ADMIN |

---

## Storage Settings (3)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/storage/settings` | SUPER_ADMIN, ADMIN (?organizationId=) |
| 2 | PUT | `/storage/settings` | SUPER_ADMIN, ADMIN (upsert Cloudinary config) |
| 3 | DELETE | `/storage/settings` | SUPER_ADMIN, ADMIN |

---

## Staff Leave (8)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/staff-leave/request` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN |
| 2 | GET | `/staff-leave/my` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN (own leaves) |
| 3 | GET | `/staff-leave` | ADMIN, SUPER_ADMIN (all staff leaves) |
| 4 | POST | `/staff-leave` | ADMIN, SUPER_ADMIN (create on behalf) |
| 5 | PATCH | `/staff-leave/my/:id` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN (update own) |
| 6 | DELETE | `/staff-leave/my/:id` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN (delete own) |
| 7 | DELETE | `/staff-leave/:id` | ADMIN, SUPER_ADMIN (delete any) |
| 8 | PATCH | `/staff-leave/:id/review` | ADMIN, SUPER_ADMIN (approve/reject) |

---

## Staff Attendance (11)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/staff-attendance/mark` | ADMIN, SUPER_ADMIN (single mark) |
| 2 | POST | `/staff-attendance/checkin` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN (QR scan) |
| 3 | POST | `/staff-attendance/bulk` | ADMIN, SUPER_ADMIN, RECEPTIONIST (bulk mark) |
| 4 | GET | `/staff-attendance/daily` | ADMIN, SUPER_ADMIN, RECEPTIONIST |
| 5 | GET | `/staff-attendance/monthly` | ADMIN, SUPER_ADMIN, RECEPTIONIST |
| 6 | DELETE | `/staff-attendance/:id` | ADMIN, SUPER_ADMIN, RECEPTIONIST |
| 7 | PUT | `/staff-attendance/:id` | ADMIN, SUPER_ADMIN, RECEPTIONIST |
| 8 | GET | `/staff-attendance/export` | ADMIN, SUPER_ADMIN, RECEPTIONIST (Excel/CSV) |
| 9 | POST | `/staff-attendance/import` | ADMIN, SUPER_ADMIN (.xlsx import) |
| 10 | GET | `/staff-attendance/download-template` | ADMIN, SUPER_ADMIN |
| 11 | GET | `/staff-attendance/my` | ADMIN, TEACHER, RECEPTIONIST, SUPER_ADMIN (own attendance) |

---

## Documents (6)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/documents/fee-voucher/:id` | ALL_STAFF (PDF) |
| 2 | GET | `/documents/admission-slip/:id` | ALL_STAFF (PDF) |
| 3 | GET | `/documents/student-id-card/:id` | ALL_STAFF (PDF) |
| 4 | GET | `/documents/staff-id-card/:id` | ALL_STAFF (PDF) |
| 5 | GET | `/documents/staff/:id/qr` | ALL_STAFF (QR code) |
| 6 | POST | `/documents/tc/:id` | MANAGEMENT (Transfer Certificate PDF) |

---

## Study Material (5)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/study-material` | ACADEMIC |
| 2 | GET | `/study-material` | ALL_STAFF |
| 3 | GET | `/study-material/:id` | ALL_STAFF |
| 4 | PUT | `/study-material/:id` | ACADEMIC (teacher own only) |
| 5 | DELETE | `/study-material/:id` | ACADEMIC (teacher own only) |

---

## Route Count Summary

| Section | Count |
|---------|-------|
| Infra | 3 |
| Auth | 35 |
| Organizations | 14 |
| Schools | 15 |
| Academic | 26 |
| Students | 12 |
| Admissions | 19 |
| Fees | 25 |
| Attendance | 19 |
| Homework | 5 |
| Exams | 10 |
| Conduct | 8 |
| Circulars | 4 |
| PTM | 5 |
| Timetable | 12 |
| Activities | 5 |
| Notifications | 8 |
| Promotions | 10 |
| Moderation | 10 |
| Audit Logs | 2 |
| Leave (Student) | 7 |
| Teaching Assignments | 5 |
| **Portal** | **17** |
| SMTP Settings | 4 |
| Storage Settings | 3 |
| Staff Leave | 8 |
| Staff Attendance | 11 |
| Documents | 6 |
| Study Material | 5 |
| **Total** | **322** |
