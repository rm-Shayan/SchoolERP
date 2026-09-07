
This document tracks completed tasks and architectural changes implemented in the Backend codebase.

## Completed Tasks

### 1. Database Schema Extensions for Admissions Pipeline
According to the requirements in `prd.md`, the school needs a pipeline to track applicants through several stages (inquiry, test, form, approval, fees, enrollment). We added:
- **`AdmissionStatus` Enum**:
  Tracks stages: `INQUIRY`, `TEST_SCHEDULED`, `TEST_PASSED`, `TEST_FAILED`, `FORM_SUBMITTED`, `APPROVED`, `FEE_PENDING`, `ENROLLED`, `REJECTED`.
- **`Applicant` Model**:
  Stores applicant details including first/last name, class details, parent name, contact numbers (including WhatsApp for communication), status, and advance fee requirements.
- **Relations**:
  Linked `Applicant` to the existing `School` (multi-branch isolated database setup) and `Class` models.

### 2. Prisma v7 Datasource Config Fix
- Handled Prisma v7 configuration constraints by adjusting the datasource in `schema.prisma` to remove the `url = env("DATABASE_URL")` property, since database connections in Prisma v7 are managed directly via `prisma.config.ts`.

### 3. Database Migration Applied
- Created and executed a new Prisma migration:
  ```bash
  npx prisma migrate dev --name init_admission_pipeline
  ```
- Successfully synchronized the Neon PostgreSQL cloud database with the updated database schema.

### 4. Complete Auth & Organization Modules — Pakistani School Local Market Enhancements

#### Role Structure (Tailored for Pakistani Schools)
```
SUPER_ADMIN   → Organization/Group Owner (sees all campuses)
ADMIN         → Branch Head = Principal + Admin (combined, as is common in Pakistani schools)
TEACHER       → Class Teacher
GATE_STAFF    → Gate Watchman / RFID Card Scanner
ACCOUNTANT    → Fee & Finance Officer
RECEPTIONIST  → Front Desk / Inquiry Staff (replaces standalone PRINCIPAL)
```

#### New Enterprise Features Implemented:

1. **Email Credential Dispatching (Nodemailer)**:
   - Super Admin account creation & Bulk import automatically trigger email credential delivery to newly assigned admins/staff via Nodemailer (`src/services/email.service.js`).
   - Mocking fallback active in dev mode when SMTP environment credentials are absent.

2. **Redis Integration for High Performance / Low Latency**:
   - `src/config/redis.js` configured with auto-connection and logging.
   - Cached Organization read queries (`getAllOrganizations`, `getOrganizationById`) to achieve low latency.
   - Cache invalidation implemented on Organization creation, update, and deletion.

3. **WebSocket Real-time Updates (Socket.io)**:
   - Attached Socket.io server to HTTP server in `src/index.js` via `src/config/websocket.js`.
   - Emits real-time organization events (`organization_created`, `organization_updated`) and background job progress (`import_progress`, `import_completed`).

4. **Staff Bulk Excel Import (Auth Module)**:
   - Added endpoint `POST /api/v1/auth/users/import` supporting `.xlsx` file upload.
   - BullMQ Queue & Worker (`src/jobs/queues/staffImport.queue.js`) asynchronously processes bulk staff registrations, auto-generates temp passwords, dispatches email credentials, and broadcasts real-time progress via WebSockets.

5. **WhatsApp Prepared Architecture**:
   - OTP and messaging service layers prepared to switch seamlessly between WhatsApp API and Email dispatches.

#### Files Created/Modified
- `src/services/email.service.js` — Email sending service (Nodemailer)
- `src/config/redis.js` — Auto-connecting Redis client
- `src/config/websocket.js` — Socket.io server initialization & room event emitter
- `src/jobs/queues/staffImport.queue.js` — BullMQ queue & worker for bulk staff Excel import
- `src/modules/auth/staffImport.validation.js` — Zod schema for Excel row validation
- `src/modules/auth/auth.service.js` — Integrated Excel bulk staff registration
- `src/modules/auth/auth.controller.js` — Upload handler for staff import
- `src/modules/auth/auth.routes.js` — Added `/users/import` route with Multer memory storage
- `src/modules/organization/organization.service.js` — Cached queries & email credential dispatch
- `src/jobs/workers/organization.import.worker.js` — Added auto Super Admin creation & email credentials
- `src/index.js` — Attached Socket.io server to Express HTTP server

### 5. PRD-Aligned Modules (Admissions, Fees, Homework, Exam, Conduct, Circular, PTM, Timetable, Activity, Notification)

Built all previously-empty modules per `prd.md`. Each module follows: `repository.js` + `{module}.service.js` + `{module}.controller.js` + `{module}.validation.js` (zod `{body,query,params}`) + `{module}.routes.js`.

- **Admissions** (`src/modules/admission/`): pipeline `INQUIRY→TEST_SCHEDULED→TEST_PASSED/TEST_FAILED→FORM_SUBMITTED→APPROVED→FEE_PENDING→ENROLLED/REJECTED` with allowed-transition validation. `approve` generates advance-fee slip PDF + parent email; `enroll` upserts Parent (by whatsappNo), creates Student with QR `identifierCode`, generates ID-card PDF + confirmation email; funnel stats endpoint.
- **Fees** (`src/modules/fee/`): year-aware structures with `lineItems`; `generateMonthlyFees` creates UNPAID records per active student; `recordPayment` → receipt PDF + email + status recompute (PAID/PARTIAL); reminders + `runOverdueSweep` (wired into `src/jobs/feeReminder.job.js`).
- **Homework / Exam / Conduct / Circular / PTM / Timetable / Activity**: homework broadcast per section + parent email; exam bulk results upsert (`examId_studentId_subjectId`) + `publish` emails parents; conduct 10-second remark + parent email; circular publish + email (dedup by parent email); PTM sessions + notify; timetable slots per section/teacher; activity events CRUD. All emit realtime WebSocket events to `school:{schoolId}`.
- **Notification dashboard** (`src/modules/notification/`): `GET /notifications/status` (sent/failed/pending counts by channel) and `GET /notifications/logs` (PRD §8 delivery-status dashboard).

### 6. Unified Notification Dispatcher — Email Primary (PRD §8)

Since WhatsApp API is not affordable yet, `src/services/notification.service.js` is the single dispatcher:
- **EMAIL is the primary channel** — `notifyParent({ schoolId, parentEmail, parentWhatsapp, parentPhone, message, title })` sends via BullMQ `queueEmail` (SMTP from `.env`, console-mock fallback).
- Every delivery is written to the **`NotificationLog`** table with `channel`/`status`/`errorReason`; WebSocket events `notification_created` / `notification_status_updated` are emitted to `school:{schoolId}` for realtime dashboard updates.
- When no parent email exists, a `WHATSAPP FAILED` log row is recorded with `errorReason: "No parent email available"` so the dashboard shows why delivery was skipped.
- Future WhatsApp integration is documented inline (flip channel priority in `notifyParent`, wire `src/services/whatsapp.service.js`).
- OTP flows in `auth.service.js`: student OTP is emailed to the parent's email; parent OTP is logged to NotificationLog.
- Fixed `createInquiry` to persist `applicant.parentEmail` (schema column existed but was not written, so approval/enrollment emails silently failed).

### 7. School (Branch) Module — Multi-Branch Setup (PRD §7)

Added `src/modules/school/` (SuperAdmin-only): `POST /schools`, `GET /schools`, `GET /schools/:id`, `PATCH /schools/:id`, `DELETE /schools/:id`, plus `GET /schools?organizationId=...`. Schools are branches under an Organization; SuperAdmin sees combined data, branch admins see only their branch. Emits `school_created`/`school_updated`/`school_deleted` to `super_admins` and `org:{id}` rooms.

### 8. Student Routes + Bulk Excel Import

- `src/modules/student/student.routes.js` created (was empty): CRUD, photo upload, status, reissue-id, and `POST /students/schools/:schoolId/import`.
- `importStudents` added to `student.service.js`/`student.controller.js`; new worker `src/jobs/queues/studentImport.queue.js` broadcasts progress to WebSocket room `job:{jobId}`.

### 9. Bug Fixes Verified End-to-End

- **Express 5 getter-only request props** (`src/middlewares/validate.middleware.js`): `req.query`/`req.params` are getter-only in Express 5 — direct assignment threw `Cannot set property query of #<IncomingMessage> which has only a getter`, crashing every validated route. Fixed with `Object.defineProperty` (writable/configurable) for query/params; `req.body` assigned directly.
- **Class/Section schema mismatch**: `Class` had no `order` column and `Section` had no `capacity`/`roomNumber`, but service/validation passed them → Prisma 500. Migration `20260809170200_add_class_order_and_section_capacity` adds them (`Class.order Int @default(0)`, `Section.capacity Int?`, `Section.roomNumber String?`).
- **Migration 1**: `20260809123913_add_applicant_email_and_homework_school_scope` — `Applicant.parentEmail`, `HomeworkBroadcast.schoolId` + School/Section relations/indexes.

### 10. End-to-End Smoke Test (All Green)

`login → list orgs → create school → list schools → create academic year → create class → create section → create inquiry → approve (PDF+email) → enroll (student+QR+email) → create fee structure → generate monthly fees → record payment (receipt+email) → get fee record → notification logs → admission funnel` — all return 2xx. NotificationLog verified in DB: EMAIL SENT rows for Approval, Enrollment, and Fee Receipt.

### 11. Promotion & Substitute Modules (Final PRD Modules)

Built the last two empty modules per `prd.md`:

- **Promotion** (`src/modules/promotion/`): `bulk-promote` (student/section transfer with `PromotionRecord` per student, from/to section, `action` enum `PROMOTED|REPEATED|TRANSFERRED_SECTION|GRADUATED|DROPPED_OUT`), `GET /promotions` (paginated, filterable by student/section/academicYear/action), `GET /promotions/:id`. Lifecycle statuses (`GRADUATED`/`DROPPED_OUT`) set via `_setLifecycleStatus` (promote + file move). WebSocket events to `school:{schoolId}`.
  - Note: `PromotionRecord.fromSectionId`/`toSectionId` are plain scalar columns (no Prisma relations), so `repository.js::_hydrateSections` resolves section names via a single bulk `Section.findMany` instead of relation includes.
- **Substitute** (`src/modules/substitute/`): `GET /substitutes/available` (teachers free for a slot/time given `date`/`dayOfWeek`/`startTime`/`endTime`), `POST /substitutes` (assign, upserts on unique `timetableSlotId_date`), `GET /substitutes?date=...` (daily substitute roster), `DELETE /substitutes/:id` (deassign, clears original teacher's absent flag). Original-teacher absence is marked via `Attendance.markAbsent`.

Wired both into `src/routes/index.js` (`/promotions`, `/substitutes`).

### 12. Rate Limiting Middleware (Auth Protection)

- `src/middlewares/rateLimit.middleware.js` added with express-rate-limit v7 (in-memory store, single-process fallback, stable IP key via `req.ip`/`connection.remoteAddress`):
  - `loginLimiter` 20/15min — staff login, student direct login
  - `otpLimiter` 5/15min — parent/student OTP request & verify
  - `sensitiveLimiter` 30/15min — refresh, forgot/reset-password
- Applied in `src/modules/auth/auth.routes.js` to login, refresh, parent/student OTP, and OTP-verify routes. Verified: 25 rapid logins → 429 after 20.

### 13. Bug Fix: Zod 4 Validation Errors Returned 500

`validate.middleware.js` checked `error.errors`, but **Zod 4 removed `.errors`** (only `.issues` exists), so every validation failure fell through as a 500. Fixed to read `error.issues`. Verified: invalid `bulk-promote` payload and missing `date` query now return `400 Validation Error` with `{field,message}` items.

### 14. Attendance Route Completion & Teacher/Staff Attendance Flow

- Completed missing attendance API routes:
  - `POST /api/v1/attendance/section-bulk`: Teachers / Admins can mark bulk student attendance for a section (PRESENT, LATE, ABSENT, LEAVE) with optional remarks. Invalidates Redis daily report cache & emits `section_attendance_updated` via Socket.io.
  - `GET /api/v1/attendance/staff`: Fetches active staff list (Teachers, Gate staff, Accountants, etc.) for a specific school branch.
- Validated Zod schemas in `attendance.validation.js` (`bulkSectionAttendanceSchema`, `markStaffAttendanceSchema`).
- Documented full Roman Urdu application flow in `memory.md` & backend overview.

### 15. Image Upload & Sync Rules (Org ↔ Branch + Cloudinary 25GB Storage Management)

Implemented the image spec end-to-end (see spec: Image Upload & Sync Logic):

- **Branch → Org sync (`src/modules/school/school.service.js`)**: when a branch's `logoUrl` changes via `PATCH /schools/:id`:
  - The replaced branch image is deleted from storage (rule 5 — no storage leaks).
  - **1 branch in org** → the organization image is updated to match (Case A: branch *is* the org visually) and the old org image is deleted; `org:{id}` cache busted + `organization_updated` WebSocket event emitted.
  - **2+ branches** → only the branch is updated; the org image is untouched (only Super Admin changes it via the org endpoints).
- **Org image replacement (`src/modules/organization/organization.service.js`)**: old org logo deleted from storage when `logoUrl` changes on `PATCH /organizations/:id` (rule 5).
- **Storage rules enforced at upload time (`src/services/storage.service.js`)**:
  - Hard size limit: **1MB default** (`MAX_IMAGE_UPLOAD_SIZE_MB` env) — rejects at multer level (413 via `error.middleware.js` MulterError handler) and again in the service.
  - Format allowlist: **JPG / PNG / WebP only** — sniffed from file content via sharp metadata (client MIME untrusted); SVG/GIF/HEIC rejected.
  - Auto-compress: re-encoded to **WebP (q75) at max 500×500** (was 320×320 JPEG) so a 500KB–1MB upload lands at ~100–150KB.
  - Cloudinary transformation now sends `quality: "auto:good"` + `fetch_format: "auto"`; correct data-URI MIME and local-disk extension (`.webp`).
- **Multer split**: image uploads (org/school logo, avatar, student photo) use the strict 1MB `imageUpload` instance; **Excel imports** (org/school/staff/student bulk import) use a separate `fileUpload` instance capped at 10MB (`MAX_FILE_UPLOAD_SIZE_MB`) so the tighter image limit can't reject big import files.
- `student.service.js` old-photo delete call cleaned up (was passing a no-op ternary).

### 15b. Cloudinary Overwrite Strategy (reuse public_id on replacement)

Spec §4 optional optimization implemented: replacing an image now **reuses the same Cloudinary `public_id`** instead of uploading a second file, so the 25GB plan never carries dead copies of replaced images.

- **`storage.service.js`**: `uploadImage({ ..., existingUrl })` — when the entity's current image is a Cloudinary URL in the **same folder**, the upload sends `public_id` (derived from the old URL) + `overwrite: true` + `invalidate: true` (CDN purge so the stable URL immediately serves the new image). Returns `{ url, publicId, overwritten }`. If the old image is local-disk, a non-Cloudinary URL, or in a different folder (e.g. `active-students` → `archive`), a fresh file is uploaded and the caller deletes the old one as before.
- New helpers: `extractPublicId(url)` (derives `public_id` from a Cloudinary URL; reused by `deleteImage`) and `hasSamePublicId(a, b)` — used to guard the update-path cleanup: **never delete an image whose public_id matches the new URL**, because the overwrite already replaced it and destroying it would wipe the replacement.
- **Wired into the one-step replace flows** (student photo, staff avatar): they pass `existingUrl` and skip the old-file delete when `overwritten` is true.
- **Org/school logo uploads** are now entity-aware: `POST /organizations/logo` and `POST /schools/logo` accept an optional `organizationId` / `schoolId` form field (frontend passes it from `EditOrgModal` / `BranchLogoCard`); the service fetches the entity and passes its current logo URL so the upload overwrites the existing asset. Entity-less creation uploads (`OrgLogoField`) stay fresh-upload. The PATCH-time delete in `school.service.js::update` / `organization.service.js::updateOrganization` is guarded by `hasSamePublicId` so an overwritten asset is never destroyed.
- Frontend mirrors the backend rules: `MAX_IMAGE_UPLOAD_SIZE_MB` lowered 5 → 1 and `validateImageUpload` now only accepts JPG/PNG/WebP; upload helper text updated.

### 15d. Delete-Flow Image Cleanup (rule 5 on entity deletion)

- **`school.service.js::remove`** — deleting a branch now deletes its logo from storage. Guard: in a single-branch org the branch logo is synced to the org image (the SAME Cloudinary asset) and the org still exists, so the shared asset is never destroyed — it becomes the org's own logo.
- **`organization.delete.worker.js`** — before the cascade delete, collects the org logo + every branch logo; after the DB delete, best-effort deletes them from storage (deduped so a synced single-branch asset is destroyed once).
- **`auth.service.js::updateOwnProfile`** — replacing `avatarUrl` via PATCH now deletes the old avatar from storage (guarded by `hasSamePublicId` so an overwritten asset is never destroyed).

### 15e. One-Time Orphaned-Image Cleanup Script

- **`src/scripts/cleanupOrphanedImages.js`** — finds and deletes Cloudinary images under the `school-erp/` prefix that no live DB row references (org `logoUrl`, school `logoUrl`, user `avatarUrl`, student `imageUrl`). **Dry-run by default**; pass `--apply` to actually delete. Paginates Cloudinary via `next_cursor`, pauses every 100 deletes to stay under rate limits.
  - `npm run cleanup:orphans` → dry-run (safe to run anytime)
  - `npm run cleanup:orphans:apply` → real deletion
- `storage.service.js` gained `waitForCloudinary(timeoutMs)` (awaits the async client bootstrap — scripts/workers must await it) and `listCloudinaryImages()` (paginated list of `school-erp/` assets with `{ publicId, url, bytes }`).

### 16. Fee Vouchers — Due Day, Auto Monthly Generation & Once-Only Overdue Messages

- **`School.monthlyFeeDueDay` (default 10)** — har school ka default monthly due day. `generateMonthlyFees` ab `dueDay` ko school par persist karta hai (agle mahine bhi yahi rahe); bina `dueDay` ke school ka saved default use hota hai. `GET/PUT /fees/schools/:schoolId/due-day` (FINANCE) se fetch/update hota hai.
- **Auto monthly voucher job** (`src/jobs/autoVoucher.job.js`, cron `5 0 1 * *`) — har month ki 1st ko saare ACTIVE schools (jin ke paas fee structures hain) ke current month ke UNPAID vouchers saved due day ke saath khud bante hain. Already-generated records skip (duplicate nahi). `autoGenerateMonthlyFees` = system-level run (koi user scope nahi).
- **Per-record due date extend** — `PATCH /fees/records/:id/due-date` ek particular bache ke is month ke due date aage badhata hai; OVERDUE record wapas UNPAID + `reminderSentAt` clear.
- **`FeeRecord.reminderSentAt`** — overdue message ab SIRF EK Dafa jata hai (once-only dedup). `runOverdueSweep` past-due records OVERDUE mark karta hai aur un parents ko ek hi overdue email bhejta hai jinhone abhi tak nahi paya. Daily fee reminder job (`feeReminder.job.js`) ab sirf sweep + once-only messages chalti hai (rozana dobara spam nahi). Manual `POST /fees/reminders` + per-record `remind` abhi bhi hain.
- **`FeeRecord.preDueReminderSentAt`** — due date se 3 din pehle ka automatic reminder (PRD §4). Daily job (`sendPreDueReminders`) un records ko message bhejta hai jinki due date 0-3 din baqi hai — har record par SIRF EK Dafa (dedup). Pre-due + overdue mila kar har parent ko max 2 messages (1 pre-due + 1 overdue). Migration `20260818140000_add_pre_due_reminder_marker` applied.
- **Error middleware hardening** (`src/middlewares/error.middleware.js`) — frontend ko sirf clean message: unknown routes → JSON 404 (`notFoundHandler` in app.js), malformed JSON → 400, Prisma errors → friendly mapped messages (P2002 → 409, P2025 → 404, P2003/P2023/P2000 → 400/409), non-operational 500s → generic message (details sirf logs).
- **Fee records CSV export** — `GET /fees/records/export?schoolId=&month=&year=&status=` (FINANCE) month ka poora fee record CSV mein deta hai (student, roll, class, section, due date, total/paid/balance, status, reminder sent). `/records/:id` se pehle register hai (route conflict avoid). Frontend: `feeService.exportCsv` + "Export CSV" button on Fee Records page header (`parts/FeeRecordsHeader.tsx`).
- **Migration** `20260818130000_add_fee_due_day_and_reminder` applied — additive columns only.

### 15c. Unit Tests for the Branch → Org Sync Rule

- The branch-to-org image sync rule was extracted from `SchoolService.update` into **`src/modules/school/logoSync.js`** — a pure, dependency-injected `resolveBranchLogoReplace({ school, newLogoUrl, countBranches, deleteImage, hasSamePublicId })` so the rule is unit-testable without DB/Redis/Cloudinary. `update()` now calls it with the real repository/storage bindings (behavior unchanged).
- **`src/modules/school/logoSync.test.js`** (Node built-in `node:test`, zero dependencies) — 12 tests covering: Case A (1 branch → org image synced + old org image deleted), Case B (2+/many branches → org untouched, branch image still cleaned up), overwrite guard (same public_id → nothing deleted), logo removal (null → org never touched), and no-op guards (unchanged/undefined logo → no `countBranches` call, no deletes).
- Added `npm test` script (`node --test`) to `Backend/package.json`. Run: `npm test`.

### 17. Student Lifecycle — TC, Rollback, Bulk Graduate/Dropout

- **Transfer Certificate (TC)**: `POST /documents/tc/:id` (MANAGEMENT only) — validates student is ACTIVE, moves photo to archive, generates TC number, creates PromotionRecord, deactivates parent portal (if no other active children), emits `student_status_changed`, returns formal TC PDF via pdfkit (school header, student details, reason, conduct, signatures, stamp area).
- **Rollback**: `POST /students/:id/rollback` (MANAGEMENT only) — reactivates GRADUATED/DROPPED_OUT/TRANSFERRED_OUT students back to ACTIVE, reactivates parent portal, creates `REACTIVATED` PromotionRecord for audit trail, emits socket event.
- **Bulk lifecycle**: `POST /promotions/bulk-graduate` and `POST /promotions/bulk-dropout` — entire section lifecycle with individual PromotionRecords per student.
- **Access control**: `PATCH /students/:id/status` restricted from `MANAGEMENT + RECEPTIONIST` to `MANAGEMENT` only. All lifecycle operations (TC, dropout, graduate, rollback) require ADMIN/SUPER_ADMIN.
- **Prisma schema**: Added `REACTIVATED` to `PromotionAction` enum; pushed to DB.
- **API_ROUTES.md** updated: 322 total routes (was 312). Added missing routes: TC, rollback, bulk-graduate, bulk-dropout, archive/auto, admissions/send-slip, portal profile routes, student/me, organizations DELETE.

