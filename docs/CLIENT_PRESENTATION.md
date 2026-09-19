# SchoolERP
## A connected operating system for modern schools

SchoolERP brings admissions, academics, attendance, fees, staff operations, communication, and family access into one multi-tenant platform. It supports organizations with one or more branches while keeping each branch's data and permissions scoped correctly.

This document is a client-facing overview of the capabilities documented in the product requirements and verified flow documents.

---

## 1. Who Uses SchoolERP?

| User | Main responsibilities |
| --- | --- |
| **Super Admin** | Organizations, branches, platform users, imports, health monitoring, audit logs, and announcements |
| **Branch Admin** | Students, staff, academics, fees, exams, attendance, admissions, settings, and approvals |
| **Teacher** | Section attendance, homework, conduct remarks, timetable, exams, PTM sessions, and staff leave |
| **Receptionist** | Admissions, student records, gate attendance, attendance reports, notices, and student leave workflows |
| **Parent** | Linked children, attendance, fees, homework, materials, notices, results, exams, timetable, conduct, PTM, leave, and notifications |
| **Student** | Personal attendance, fees, homework, materials, notices, results, exams, timetable, conduct, PTM, leave, and notifications |

Role-based access ensures that each user sees only the organizations, branches, sections, and students relevant to their work.

---

## 2. Core School Operations

### Admissions

The public, branded admission experience takes an applicant from inquiry to enrollment:

- Branded public admission page at `/o/[school-slug]/admission`
- Test scheduling, pass/fail recording, approval, advance fees, and enrollment
- Search, filters, pagination, funnel summaries, and CSV export
- Excel import with background progress updates
- Applicant photos and documents
- Admission slips, student ID cards, and fee-related PDF documents

### Student Lifecycle

Branch teams can manage student profiles, section assignments, photos, parent links, QR identifiers, and status changes. The platform also supports:

- Student CSV export and Excel-based operational imports where enabled
- Transfer certificates with student, conduct, fee-clearance, and signature details
- Bulk promotion, section transfer, repeat, graduation, and dropout actions
- Promotion history for an auditable academic record
- Student reactivation with a recorded rollback event

### Attendance

School teams can combine gate scanning with classroom and staff attendance:

- QR-based gate scanning with fast record upsert
- Offline scan buffering and later synchronization
- Section-level bulk marking and admin overrides
- Configurable weekly off-days and holidays
- Automatic late/absent processing through scheduled jobs
- Monthly student matrices and staff attendance views
- Attendance summaries, exports, archive rollups, and parent alerts

The identifier model is prepared for RFID hardware, while the current operational flow uses QR identifiers.

### Fees and Collections

Fee teams can define class-based structures and manage the complete collection cycle:

- Fee heads such as tuition, transport, and laboratory charges
- Monthly voucher generation, including scheduled generation
- Full or partial payments with allocation across fee heads
- A5 vouchers, receipts, bulk printing, and QR-assisted collection
- Due dates, late fees, overdue status, and reminder workflows
- Monthly trends and yearly summary archives

### Academics, Exams, and Results

The academic hierarchy connects academic years, terms, classes, sections, subjects, and teaching assignments. The exam module supports:

- Exam scheduling and per-paper date sheets
- Paper dates, times, rooms, maximum marks, and optional section scope
- Teacher result entry for assigned sections
- Result publishing and student result cards
- Portal date-sheet PDF downloads

Teachers and admins can also publish homework, study materials, timetables, and conduct remarks to the relevant portal users.

### Staff Operations

- Staff check-in/out and daily or monthly attendance views
- Excel import and CSV export for staff attendance
- Digital staff leave requests and branch-admin review
- Teacher-to-class, section, and subject assignments
- Staff management, password reset, avatar support, and controlled bulk import

---

## 3. Family Portal

Parents and students use separate login credentials on one shared portal experience. Parents can switch between linked children; students see only their own records.

The current portal has 14 views:

1. Overview
2. Notifications
3. Attendance
4. Fees
5. Homework
6. Study Materials
7. Notices
8. Results
9. Timetable
10. Exams and date sheets
11. Conduct
12. PTM
13. Leave requests
14. Profile and settings

Portal access includes direct password login, branch branding, mobile navigation, scoped data access, and real-time updates for supported events such as attendance, homework, circulars, and notifications. OTP endpoints are available in the backend for future channel enablement; the current frontend uses password login.

---

## 4. Platform and Security Model

- **Multi-tenant isolation:** organization and branch boundaries are enforced in backend queries and route permissions.
- **Role-based authorization:** management, admissions, academics, finance, attendance, and portal access are separately controlled.
- **Branded access:** organization and branch logos, names, theme colors, and public slug URLs are supported.
- **Authentication controls:** access and refresh tokens, refresh-token rotation, password changes, logout-all-devices, and block enforcement.
- **Operational resilience:** Redis caching, Socket.io rooms, BullMQ background jobs, scheduled reminders, health/readiness endpoints, and audit logs.
- **Document storage:** tenant-first Cloudinary/storage configuration with platform fallbacks where configured.
- **API surface:** 320 documented routes, including authenticated modules, portal routes, health checks, readiness, and metrics.

Real-time behavior is used for selected operational events; it does not replace normal API reads or scheduled jobs.

---

## 5. Demonstration and Onboarding

### Create local demo data

From the repository root, run the backend demo seeder:

```bash
cd Backend
npm run demo -- --name "Your Client's School Name" --reset --yes
```

The seeder writes human-readable and structured credentials and portal URLs to `Backend/demo-info/`. The generated information should be treated as sensitive and used only for the demonstration environment.

#### Demo example

For example, to prepare a demo for **Al-Noor Public School** with a small but complete dataset:

```bash
cd Backend
npm run demo -- --name "Al-Noor Public School" --code ALNOOR --students 12 --teachers 3 --months 3 --reset --yes
```

This creates or refreshes one demo tenant and seeds classes, sections, staff, students, parents, fees, exams, attendance, timetable, notices, homework, PTM, conduct remarks, and admission applicants. The command prints the login details and writes files similar to:

```text
Backend/demo-info/ALNOOR.md
Backend/demo-info/ALNOOR.json
```

Open the `.md` file before the client meeting. It contains the public school page, branch dashboard URL, parent/student portal URL, and the generated demo credentials. For a normal repeat run, omit `--reset --yes`; existing demo data is kept. Use `--reset --yes` only when a fresh demo is required because it deletes that demo tenant's data.

### Prepare a production rollout

Production deployment requires the environment and infrastructure to be configured before data migration or go-live:

- Production `CLIENT_URL`
- SMTP credentials for email delivery
- Optional WhatsApp Business credentials if that channel is required
- PostgreSQL and Redis connectivity
- Tenant storage credentials where applicable
- Credential verification enabled in production

The `scripts/demo-to-production.js` utility is an operator migration tool. Run it only after reviewing the target environment, backups, organization scope, and migration confirmation requirements.

#### Demo-to-production example

The migration reads the selected organization from the local demo database in `Backend/dev.env` and copies it to the production database in `Backend/.env`. IDs are preserved; SMTP and Cloudinary secrets are re-encrypted with the production key.

First inspect the migration plan without changing production:

```bash
cd Backend
node --env-file=.env scripts/demo-to-production.js --dry-run --org <organization-id>
```

Example for the organization created above:

```bash
cd Backend
node --env-file=.env scripts/demo-to-production.js --dry-run --org <ALNOOR-organization-id>
```

If the row counts and organization name are correct, take a production backup and run the confirmed migration:

```bash
node --env-file=.env scripts/demo-to-production.js --yes --org <ALNOOR-organization-id>
```

Expected successful output looks like this:

```text
Source: localhost:5432
Target: production-host:5432
Org: Al-Noor Public School (al-noor-public-school)
PARSE PLAN:
	Organization: 1
	School: 1
	Student: 12
	...
SUCCESS: Al-Noor Public School (...) production mein copy ho gaya — ... rows.
```

If the same organization already exists in production, the script stops rather than overwriting it. Only after a verified backup and explicit approval should an operator use `--replace`:

```bash
node --env-file=.env scripts/demo-to-production.js --yes --replace --org <ALNOOR-organization-id>
```

Never run `--replace` as part of a routine client demo. `--dry-run` is read-only, while `--yes` performs the write.

---

## 6. Recommended Client Walkthrough

1. Open the organization's branded landing page.
2. Submit or review an admission inquiry.
3. Move the applicant through test, approval, fee, and enrollment steps.
4. Open the branch dashboard to review students, staff, academics, and fees.
5. Scan a student or mark a section's attendance.
6. Create an exam paper, enter marks, and publish a result.
7. Log in as a parent or student to review attendance, fees, homework, notices, and results.
8. Show the notification and audit history for the completed actions.

SchoolERP is designed to make daily school operations visible, accountable, and easier to coordinate across every role.
