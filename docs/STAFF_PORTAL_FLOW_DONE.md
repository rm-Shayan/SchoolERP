# Staff Portal Flow — Done (Code-Verified Log)

> Design: `docs/STAFF_PORTAL_FLOW.md` • Pending: `docs/STAFF_PORTAL_FLOW_TODO.md`

---

## ✅ Teacher Portal

| # | Item | Status |
|---|---|---|
| 1 | **Teacher layout + role gate** — `TeacherLayout.tsx`, non-TEACHER → `/login` | ✅ Done |
| 2 | **Login routing** — TEACHER → `{base}/teacher/dashboard`; branded `/o/{slug}/teacher/*` | ✅ Done |
| 3 | **Section Attendance** — roster load, default PRESENT, per-student toggle, `POST /attendance/section-bulk` | ✅ Done |
| 4 | **Homework broadcast + parent email** — create modal → backend har student ke parent ko email | ✅ Done |
| 5 | **Conduct Remarks + parent email** — form → POSITIVE/NEGATIVE/NEUTRAL → parent email | ✅ Done |
| 6 | **My Timetable** — weekly grid (Period × Days), `GET /timetable/teacher/:id` | ✅ Done |
| 7 | **Exams & Results** — year select + exam list + `listMine` (sirf apni assignments) → results upload | ✅ Done |
| 8 | **Announcements** — circulars (TEACHERS/ALL), read-only | ✅ Done |
| 9 | **My Leave (Self-Service)** — `/teacher/leave`, create + list own leave requests | ✅ Done |

---

## ✅ Receptionist — Admissions

| # | Item | Status |
|---|---|---|
| 10 | **AdmissionsPage** — pipeline summary, filters, table, pagination | ✅ Done |
| 11 | **Inquiry modal** — new applicant create | ✅ Done |
| 12 | **Admission actions** — schedule test, pass/fail, approve, enroll, reject | ✅ Done |
| 13 | **Admission import** — Excel bulk import | ✅ Done |
| 14 | **Pipeline stages** — INQUIRY → TEST_SCHEDULED → PASSED/FAILED → FORM_SUBMITTED → APPROVED → FEE_PENDING → ENROLLED | ✅ Done |
| 15 | **PDF attachments** — admission slip, student ID card, fee receipt (email mein attach) | ✅ Done |

---

## ✅ Accountant — Fees (Backend Ready)

| # | Item | Status |
|---|---|---|
| 16 | **Fee Structures** — class-wise fee define (line items) | ✅ Backend Done |
| 17 | **Fee Records** — student-wise fee status (PAID/PARTIAL/UNPAID/OVERDUE) | ✅ Backend Done |
| 18 | **Fee Collection** — payment record + receipt PDF + parent email | ✅ Backend Done |
| 19 | **Monthly fee generation** — auto-bulk records for active students | ✅ Backend Done |
| 20 | **Overdue sweep scheduler** — daily: past-due → OVERDUE + reminder emails | ✅ Backend Done |

---

## ✅ Branch Portal (Shared — ADMIN/RECEPTIONIST/ACCOUNTANT)

| # | Item | Status |
|---|---|---|
| 21 | **Branch layout** — `BranchLayout.tsx` + `schoolAdminLinks` sidebar | ✅ Done |
| 22 | **Staff management** — list, add (TEACHER/RECEPTIONIST), edit, password reset, import | ✅ Done |
| 23 | **Teaching assignments** — teacher-grouped cards, assign/remove | ✅ Done |
| 24 | **RBAC enforced** — MANAGEMENT (ADMIN only), FINANCE (ACCOUNTANT), ADMISSIONS (RECEPTIONIST) | ✅ Done |
| 25 | **Branch isolation** — `assertSchoolAccess` har service par | ✅ Done |

---

## ✅ Staff Attendance (NEW)

| # | Item | Status |
|---|---|---|
| 26 | **StaffAttendance model** — date, status (PRESENT/ABSENT/LATE/LEAVE/HALF_DAY), checkIn, checkOut, leaveType, dateTo, reason, reviewedBy, reviewedAt | ✅ Done |
| 27 | **Daily view** — Staff list, mark attendance per person, edit/delete buttons | ✅ Done |
| 28 | **Monthly view** — Ledger grid (staff × dates), color-coded status cells | ✅ Done |
| 29 | **Bulk mark API** — `POST /staff-attendance` (multiple staff at once) | ✅ Done |
| 30 | **Update/Delete API** — `PUT /staff-attendance/:id`, `DELETE /staff-attendance/:id` | ✅ Done |
| 31 | **Excel import** — Bulk attendance upload via Excel | ✅ Done |
| 32 | **CSV export** — Attendance data download as CSV | ✅ Done |
| 33 | **Staff attendance edit modal** — Edit individual records from UI | ✅ Done |
| 34 | **Section attendance detail page** — Pagination support, section-wise detail | ✅ Done |

---

## ✅ Staff Leave (NEW)

| # | Item | Status |
|---|---|---|
| 35 | **Staff leave statuses** — PENDING_LEAVE, APPROVED_LEAVE, REJECTED_LEAVE | ✅ Done |
| 36 | **Create leave request** — `POST /staff-leave` (teacher self-service) | ✅ Done |
| 37 | **List leave requests** — `GET /staff-leave` (apni requests) | ✅ Done |
| 38 | **Admin review** — `PATCH /staff-leave/:id/review` (approve/reject) | ✅ Done |
| 39 | **Realtime events** — `staff_leave_request_created`, `staff_leave_request_reviewed` WebSocket events | ✅ Done |
| 40 | **Portal notifications** — Realtime notifications (NO email for staff leave) | ✅ Done |
| 41 | **Teacher "My Leave" page** — `/teacher/leave` self-service link | ✅ Done |

---

## ✅ Login & Auth (NEW)

| # | Item | Status |
|---|---|---|
| 42 | **Singleton portal password** — Check order: (1) individual bcrypt, (2) portal password, (3) school code | ✅ Done |

---

## ✅ Backend Ready (UI Baad Mein)

| # | Item | Status |
|---|---|---|
| 43 | **Substitute engine** — assign with free-slot overlap + WebSocket + delete | ✅ Backend Done |
| 44 | **Leave module** — parent request + review API | ✅ Backend Done |

---

## ⚠️ Known Gaps (TODO)

| # | Item | Status |
|---|---|---|
| 45 | `/teacher/dashboard` placeholder (TODO #1) | ⚠️ Pending |
| 46 | `ACCOUNTANT` routing missing in `getRoleHomePath` (TODO #2) | ⚠️ Pending |
| 47 | Accountant not in seed script (TODO #3) | ⚠️ Pending |
