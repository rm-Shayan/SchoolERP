# ERP Backend API Routes

> Base URL: `/api/v1` (all routes below are relative to this prefix)

**Total routes: 217** (216 API routes + 1 health check)

---

## Role Groups Reference

| Group | Roles |
|-------|-------|
| **ALL_STAFF** | SUPER_ADMIN, ADMIN, TEACHER, GATE_STAFF, ACCOUNTANT, RECEPTIONIST |
| **MANAGEMENT** | SUPER_ADMIN, ADMIN |
| **ORG_LEVEL** | SUPER_ADMIN |
| **USER_MANAGERS** | SUPER_ADMIN, ADMIN |
| **FINANCE** | SUPER_ADMIN, ADMIN, ACCOUNTANT |
| **ACADEMIC** | SUPER_ADMIN, ADMIN, TEACHER |
| **ADMISSIONS** | SUPER_ADMIN, ADMIN, RECEPTIONIST |
| **ATTENDANCE** | SUPER_ADMIN, ADMIN, GATE_STAFF, TEACHER |
| **Public** | No auth required |
| **Parent** | Requires Parent portal token |
| **Student** | Requires Student portal token |

> `[...]` in the Role column = explicit role array (not a named group).

---

## Health Check (1)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/health` | Public |

---

## Auth (30)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/auth/login` | Public |
| 2 | POST | `/auth/refresh` | Public |
| 3 | GET | `/auth/me` | Any authenticated staff |
| 4 | PATCH | `/auth/me` | Any authenticated staff |
| 5 | POST | `/auth/me/avatar` | Any authenticated staff |
| 6 | POST | `/auth/logout` | Public (refresh token in body) |
| 7 | POST | `/auth/logout-all` | Any authenticated staff |
| 8 | POST | `/auth/forgot-password` | Public (temp password emailed) |
| 9 | POST | `/auth/change-password` | Any authenticated staff |
| 10 | POST | `/auth/users/import` | USER_MANAGERS (.xlsx bulk import) |
| 11 | POST | `/auth/users` | USER_MANAGERS |
| 12 | POST | `/auth/users/sample` | USER_MANAGERS (demo staff creator) |
| 13 | GET | `/auth/users/import-template` | USER_MANAGERS (.xlsx template download) |
| 14 | GET | `/auth/users` | USER_MANAGERS |
| 15 | GET | `/auth/users/export` | USER_MANAGERS |
| 16 | GET | `/auth/users/all` | SUPER_ADMIN only (platform-wide directory) |
| 17 | GET | `/auth/users/all/export` | SUPER_ADMIN only |
| 18 | GET | `/auth/users/:id` | USER_MANAGERS |
| 19 | PATCH | `/auth/users/:id` | USER_MANAGERS |
| 20 | DELETE | `/auth/users/:id` | USER_MANAGERS |
| 21 | PATCH | `/auth/users/:id/reactivate` | USER_MANAGERS |
| 22 | POST | `/auth/users/:id/reset-password` | USER_MANAGERS |
| 23 | POST | `/auth/parent/request-otp` | Public |
| 24 | POST | `/auth/parent/verify-otp` | Public |
| 25 | POST | `/auth/parent/login` | Public (phone + shared portal password/code) |
| 26 | GET | `/auth/parent/me` | Parent |
| 27 | POST | `/auth/student/login` | Public (roll no + shared portal password/code) |
| 28 | POST | `/auth/student/request-otp` | Public |
| 29 | POST | `/auth/student/verify-otp` | Public |
| 30 | GET | `/auth/student/me` | Student |

---

## Organizations (12)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/organizations/public/:slug` | Public (branded landing data) |
| 2 | POST | `/organizations/import-excel` | SUPER_ADMIN |
| 3 | GET | `/organizations/import-template` | SUPER_ADMIN |
| 4 | POST | `/organizations/logo` | SUPER_ADMIN |
| 5 | POST | `/organizations` | SUPER_ADMIN |
| 6 | GET | `/organizations` | SUPER_ADMIN |
| 7 | GET | `/organizations/overview` | SUPER_ADMIN |
| 8 | GET | `/organizations/export` | SUPER_ADMIN |
| 9 | GET | `/organizations/:id/dashboard` | SUPER_ADMIN |
| 10 | GET | `/organizations/:id` | SUPER_ADMIN |
| 11 | PATCH | `/organizations/:id` | SUPER_ADMIN |
| 12 | DELETE | `/organizations/:id` | SUPER_ADMIN |

---

## Schools (14)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/schools/branding` | Public (?code=SCH-XXX) |
| 2 | POST | `/schools` | SUPER_ADMIN (branch creation is platform-level) |
| 3 | GET | `/schools` | SUPER_ADMIN, ADMIN |
| 4 | POST | `/schools/import-excel` | SUPER_ADMIN |
| 5 | GET | `/schools/export` | SUPER_ADMIN |
| 6 | GET | `/schools/import-template` | SUPER_ADMIN |
| 7 | POST | `/schools/logo` | SUPER_ADMIN, ADMIN |
| 8 | GET | `/schools/:id` | SUPER_ADMIN, ADMIN |
| 9 | PATCH | `/schools/:id` | SUPER_ADMIN, ADMIN |
| 10 | GET | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (status: custom/default) |
| 11 | PUT | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (set custom hashed password) |
| 12 | DELETE | `/schools/:id/portal-password` | SUPER_ADMIN, ADMIN (reset to default code) |
| 13 | PATCH | `/schools/:id/admin` | SUPER_ADMIN |
| 14 | DELETE | `/schools/:id` | SUPER_ADMIN |

---

## Academic (26)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/academic/schools/:schoolId/academic-years` | MANAGEMENT |
| 2 | GET | `/academic/academic-years/:id` | ALL_STAFF |
| 3 | GET | `/academic/schools/:schoolId/academic-years` | ALL_STAFF |
| 4 | PATCH | `/academic/academic-years/:id` | MANAGEMENT |
| 5 | DELETE | `/academic/academic-years/:id` | MANAGEMENT |
| 6 | POST | `/academic/academic-years/:academicYearId/terms` | MANAGEMENT |
| 7 | GET | `/academic/academic-years/:academicYearId/terms` | ALL_STAFF |
| 8 | PATCH | `/academic/terms/:id` | MANAGEMENT |
| 9 | DELETE | `/academic/terms/:id` | MANAGEMENT |
| 10 | POST | `/academic/schools/:schoolId/classes` | MANAGEMENT |
| 11 | GET | `/academic/classes/:id` | ALL_STAFF |
| 12 | GET | `/academic/schools/:schoolId/classes` | ALL_STAFF |
| 13 | PATCH | `/academic/classes/:id` | MANAGEMENT |
| 14 | DELETE | `/academic/classes/:id` | MANAGEMENT |
| 15 | GET | `/academic/schools/:schoolId/section-templates` | ALL_STAFF |
| 16 | POST | `/academic/schools/:schoolId/section-templates` | MANAGEMENT |
| 17 | PATCH | `/academic/section-templates/:id` | MANAGEMENT |
| 18 | DELETE | `/academic/section-templates/:id` | MANAGEMENT |
| 19 | POST | `/academic/classes/:classId/sections` | MANAGEMENT |
| 20 | GET | `/academic/classes/:classId/sections` | ALL_STAFF |
| 21 | PATCH | `/academic/sections/:id` | MANAGEMENT |
| 22 | DELETE | `/academic/sections/:id` | MANAGEMENT |
| 23 | POST | `/academic/classes/:classId/subjects` | MANAGEMENT |
| 24 | GET | `/academic/classes/:classId/subjects` | ALL_STAFF |
| 25 | PATCH | `/academic/subjects/:id` | MANAGEMENT |
| 26 | DELETE | `/academic/subjects/:id` | MANAGEMENT |

---

## Students (10)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/students/schools/:schoolId/import` | MANAGEMENT |
| 2 | POST | `/students/schools/:schoolId` | MANAGEMENT |
| 3 | GET | `/students` | ALL_STAFF |
| 4 | GET | `/students/export` | ALL_STAFF |
| 5 | GET | `/students/:id` | ALL_STAFF |
| 6 | PATCH | `/students/:id` | MANAGEMENT |
| 7 | DELETE | `/students/:id` | SUPER_ADMIN only |
| 8 | POST | `/students/:id/photo` | MANAGEMENT |
| 9 | PATCH | `/students/:id/status` | MANAGEMENT |
| 10 | POST | `/students/:id/reissue-id` | MANAGEMENT |

---

## Admissions (18)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/admissions/public/classes` | Public |
| 2 | POST | `/admissions/public/inquiry` | Public |
| 3 | POST | `/admissions/schools/:schoolId/import` | ADMISSIONS |
| 4 | POST | `/admissions/schools/:schoolId` | ADMISSIONS |
| 5 | GET | `/admissions` | ADMISSIONS |
| 6 | GET | `/admissions/export` | ADMISSIONS |
| 7 | GET | `/admissions/funnel` | ADMISSIONS |
| 8 | PATCH | `/admissions/:id/status` | ADMISSIONS |
| 9 | PATCH | `/admissions/:id` | ADMISSIONS |
| 10 | DELETE | `/admissions/:id` | ADMISSIONS |
| 11 | POST | `/admissions/:id/photo` | ADMISSIONS |
| 12 | POST | `/admissions/:id/documents` | ADMISSIONS |
| 13 | DELETE | `/admissions/:id/documents/:docId` | ADMISSIONS |
| 14 | POST | `/admissions/:id/approve` | ADMISSIONS |
| 15 | POST | `/admissions/:id/advance-fee` | ADMISSIONS |
| 16 | POST | `/admissions/:id/enroll` | ADMISSIONS |
| 17 | GET | `/admissions/:id` | ADMISSIONS |
| 18 | GET | `/admissions/:id/slip` | ADMISSIONS |

---

## Fees (23)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/fees/schools/:schoolId/structures` | FINANCE |
| 2 | GET | `/fees/schools/:schoolId/structures` | FINANCE |
| 3 | GET | `/fees/structures` | FINANCE |
| 4 | GET | `/fees/structures/:id` | FINANCE |
| 5 | PUT | `/fees/structures/:id` | FINANCE |
| 6 | DELETE | `/fees/structures/:id` | FINANCE |
| 7 | POST | `/fees/generate-monthly` | FINANCE |
| 8 | GET | `/fees/schools/:schoolId/due-day` | FINANCE |
| 9 | PUT | `/fees/schools/:schoolId/due-day` | FINANCE |
| 10 | PATCH | `/fees/records/:id/due-date` | FINANCE |
| 11 | GET | `/fees/records/export` | FINANCE |
| 12 | GET | `/fees/records/summary` | FINANCE |
| 13 | GET | `/fees/records` | FINANCE |
| 14 | GET | `/fees/records/:id` | FINANCE |
| 15 | GET | `/fees/students/:studentId/yearly-summaries` | FINANCE |
| 16 | POST | `/fees/records/:id/payments` | FINANCE |
| 17 | GET | `/fees/records/:id/receipt` | FINANCE |
| 18 | GET | `/fees/records/:id/voucher` | FINANCE |
| 19 | GET | `/fees/records/:id/voucher-a5` | FINANCE |
| 20 | POST | `/fees/records/:id/scan` | FINANCE |
| 21 | POST | `/fees/records/:id/remind` | FINANCE |
| 22 | POST | `/fees/reminders` | FINANCE |
| 23 | POST | `/fees/calculate-due-charges` | FINANCE |

---

## Homework (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/homework` | ACADEMIC |
| 2 | GET | `/homework` | ALL_STAFF |
| 3 | GET | `/homework/:id` | ALL_STAFF |
| 4 | DELETE | `/homework/:id` | MANAGEMENT |

---

## Exams (8)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/exams/schools/:schoolId` | ACADEMIC |
| 2 | GET | `/exams/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/exams/:id` | ALL_STAFF |
| 4 | DELETE | `/exams/:id` | MANAGEMENT |
| 5 | POST | `/exams/:id/results` | ACADEMIC |
| 6 | POST | `/exams/:id/publish` | MANAGEMENT |
| 7 | GET | `/exams/:examId/students/:studentId` | ALL_STAFF |
| 8 | GET | `/exams/:examId/students/:studentId/card` | ALL_STAFF (result card) |

---

## Conduct (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/conduct/remarks` | ACADEMIC |
| 2 | GET | `/conduct/remarks/students/:id` | ALL_STAFF |
| 3 | GET | `/conduct/remarks/sections/:sectionId` | ALL_STAFF |
| 4 | GET | `/conduct/remarks/:id` | ALL_STAFF |

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

> Sessions support audience scopes: WHOLE_SCHOOL, CLASS_RANGE (by class order),
> SECTIONS (specific sections), STUDENT (single student). Teachers are stored as a
> many-to-many (`teacherIds[]`).

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/ptm/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/ptm/schools/:schoolId` | ALL_STAFF |
| 3 | GET | `/ptm/:id` | ALL_STAFF |
| 4 | PATCH | `/ptm/:id` | MANAGEMENT |
| 5 | DELETE | `/ptm/:id` | MANAGEMENT |

---

## Timetable (6)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/timetable/sections/:sectionId` | ACADEMIC |
| 2 | GET | `/timetable/sections/:sectionId` | ALL_STAFF |
| 3 | GET | `/timetable/teachers/:teacherId` | ALL_STAFF |
| 4 | GET | `/timetable/slots/:id` | ALL_STAFF |
| 5 | PATCH | `/timetable/slots/:id` | ACADEMIC |
| 6 | DELETE | `/timetable/slots/:id` | MANAGEMENT |

---

## Attendance (11)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/attendance/scan` | ATTENDANCE |
| 2 | POST | `/attendance/sync` | [SUPER_ADMIN, ADMIN, RECEPTIONIST] |
| 3 | POST | `/attendance/devices` | [SUPER_ADMIN, ADMIN, RECEPTIONIST] |
| 4 | GET | `/attendance/devices` | ATTENDANCE |
| 5 | POST | `/attendance/section-bulk` | [SUPER_ADMIN, ADMIN, TEACHER] |
| 6 | GET | `/attendance/staff` | [SUPER_ADMIN, ADMIN] |
| 7 | POST | `/attendance/override` | [SUPER_ADMIN, ADMIN, TEACHER] |
| 8 | GET | `/attendance/daily` | ALL_STAFF |
| 9 | GET | `/attendance/monthly` | [SUPER_ADMIN, ADMIN] |
| 10 | GET | `/attendance/students/:studentId` | ALL_STAFF |
| 11 | GET | `/attendance/students/:studentId/yearly-summaries` | ALL_STAFF |

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

## Notifications (2)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/notifications/status` | MANAGEMENT |
| 2 | GET | `/notifications/logs` | ALL_STAFF |

---

## Promotions (8)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/promotions/bulk-promote` | MANAGEMENT |
| 2 | POST | `/promotions/repeat` | MANAGEMENT |
| 3 | POST | `/promotions/transfer-section` | MANAGEMENT |
| 4 | POST | `/promotions/graduate` | MANAGEMENT |
| 5 | POST | `/promotions/dropout` | MANAGEMENT |
| 6 | GET | `/promotions` | ALL_STAFF |
| 7 | GET | `/promotions/export` | ALL_STAFF |
| 8 | GET | `/promotions/:id` | ALL_STAFF |

---

## Substitutes (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/substitutes/assign` | MANAGEMENT |
| 2 | GET | `/substitutes/available` | ACADEMIC |
| 3 | GET | `/substitutes` | ALL_STAFF |
| 4 | DELETE | `/substitutes/:id` | MANAGEMENT |

---

## Moderation (10)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/moderation/organizations/:id/block` | SUPER_ADMIN only (ORG_LEVEL) |
| 2 | POST | `/moderation/organizations/:id/unblock` | SUPER_ADMIN only |
| 3 | POST | `/moderation/schools/:id/block` | SUPER_ADMIN only |
| 4 | POST | `/moderation/schools/:id/unblock` | SUPER_ADMIN only |
| 5 | POST | `/moderation/users/:id/block` | MANAGEMENT |
| 6 | POST | `/moderation/users/:id/unblock` | MANAGEMENT |
| 7 | POST | `/moderation/students/:id/block` | MANAGEMENT |
| 8 | POST | `/moderation/students/:id/unblock` | MANAGEMENT |
| 9 | POST | `/moderation/parents/:id/block` | MANAGEMENT |
| 10 | POST | `/moderation/parents/:id/unblock` | MANAGEMENT |

---

## Audit Logs (1)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/audit-logs` | MANAGEMENT |

---

## Leave (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/leave/request` | [SUPER_ADMIN, ADMIN, TEACHER] |
| 2 | GET | `/leave` | [SUPER_ADMIN, ADMIN] |
| 3 | PATCH | `/leave/:id/review` | [SUPER_ADMIN, ADMIN] |
| 4 | GET | `/leave/check/:studentId` | Any authenticated |

---

## Teaching Assignments (4)

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | POST | `/teaching-assignments/schools/:schoolId` | MANAGEMENT |
| 2 | GET | `/teaching-assignments/schools/:schoolId/me` | ALL_STAFF (own assignments) |
| 3 | GET | `/teaching-assignments/schools/:schoolId` | ALL_STAFF |
| 4 | DELETE | `/teaching-assignments/:id` | MANAGEMENT |

---

## Storage Settings (3)

Per-tenant Cloudinary credentials (media storage). Row mojood = org apne
account par upload karta hai; row absent = platform (Super Admin) fallback.
Creds save se pehle real Cloudinary API ping se verify hoti hain.

| # | Method | Route | Role |
|---|--------|-------|------|
| 1 | GET | `/storage/settings?organizationId=` | MANAGEMENT |
| 2 | PUT | `/storage/settings` `{ organizationId?, cloudName, apiKey, apiSecret? }` | MANAGEMENT |
| 3 | DELETE | `/storage/settings?organizationId=` | MANAGEMENT |

---

## Summary

| Module | Count |
|--------|-------|
| Health Check | 1 |
| Auth | 30 |
| Organizations | 12 |
| Schools | 14 |
| Academic | 26 |
| Students | 10 |
| Admissions | 18 |
| Fees | 23 |
| Homework | 4 |
| Exams | 8 |
| Conduct | 4 |
| Circulars | 4 |
| PTM | 5 |
| Timetable | 6 |
| Attendance | 11 |
| Activities | 5 |
| Notifications | 2 |
| Promotions | 8 |
| Substitutes | 4 |
| Moderation | 10 |
| Audit Logs | 1 |
| Leave | 4 |
| Teaching Assignments | 4 |
| Storage Settings | 3 |
| **TOTAL** | **217** |

---

## Routes by Role

| Role / Group | Routes |
|--------------|--------|
| Public (no auth) | 16 |
| Parent portal token | 1 |
| Student portal token | 1 |
| Any authenticated staff (authenticate only) | 6 |
| ALL_STAFF (all 6 roles) | 40 |
| MANAGEMENT (SUPER_ADMIN, ADMIN) | 55 |
| USER_MANAGERS (SUPER_ADMIN, ADMIN) | 11 |
| SUPER_ADMIN only | 24 |
| FINANCE (SUPER_ADMIN, ADMIN, ACCOUNTANT) | 23 |
| ACADEMIC (SUPER_ADMIN, ADMIN, TEACHER) | 7 |
| ADMISSIONS (SUPER_ADMIN, ADMIN, RECEPTIONIST) | 16 |
| ATTENDANCE (SUPER_ADMIN, ADMIN, GATE_STAFF, TEACHER) | 2 |
| Explicit role arrays `[...]` | 15 |
| **TOTAL** | **217** |
