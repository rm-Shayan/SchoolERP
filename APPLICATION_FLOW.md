# School ERP — Complete Application Flow

> Yeh document poori application ka end-to-end flow hai — kaun kya create karta hai, roles kya hain,
> login kaise hota hai, org/branch/user kaise block hote hain, emails kab jati hain, aur har portal mein
> kya kya hota hai. Code se mila kar likha gaya hai — exact behavior, guess nahi.

---

## 1. System Overview

**School ERP** ek multi-tenant school management system hai. Ek **Platform Super Admin** (system owner)
poori platform manage karta hai, jiske andar kai **Organizations** (school groups) hain, har organization
ke andar kai **Branches** (campuses), aur har branch mein staff, students, aur parents.

```
Platform Super Admin (system ka malik — SIRF 1, aap)
   └── Organization (school group, e.g. "Falcon Academy Systems")
         └── Branch / Campus (e.g. "Main Campus", "North Campus")
               ├── Branch Principal / Admin (branch ka head)
               ├── Staff (Teacher, Accountant, Receptionist, Gate Staff)
               ├── Students
               └── Parents
```

**Tech Stack:**
| Layer | Tech |
|---|---|
| Frontend | **Next.js 16 (App Router)** + TypeScript, Redux Toolkit, Tailwind CSS |
| Backend | Node.js (ESM) + Express |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Cache/Queues | Redis (Upstash) — BullMQ workers (import/delete), caching |
| Email | SMTP (Nodemailer) — direct, Redis-free |
| Storage | Cloudinary / local disk (logos, avatars) |
| Realtime | WebSocket (Socket.io rooms) |

> Frontend Vite se **Next.js App Router** par migrate ho chuka hai (`frontend/nextjs`) — har route
> server-component wrapper hai (`src/app/**/page.tsx`), actual UI `src/features/**/components` mein.
> Backend port **5000**, frontend dev default port par chalta hai.

---

## 2. Roles

Prisma schema (`Backend/prisma/schema.prisma`) ke mutabiq:

| Role | Meaning | Kiske liye |
|---|---|---|
| `SUPER_ADMIN` | **Platform owner — SIRF 1** (aap) | Poori platform: saari orgs, branches, users |
| `ADMIN` | Branch Head = Principal | **Har org ka admin — org create par 1 assign hota hai** |
| `TEACHER` | Class Teacher | Teachers |
| `RECEPTIONIST` | Front Desk — admissions + gate + student records | Reception/Inquiry staff |

> `GATE_STAFF` aur `ACCOUNTANT` roles ab **remove ho chuke hain** (`src/constants.js` mein sirf 4
> roles hain). Gate scanning aur fees dono ab branch `ADMIN` + `RECEPTIONIST` handle karte hain.

### ⚠️ SUPER_ADMIN — sirf aap

- Seed script se ek hi banta hai: `superadmin@schoolerp.com` (`prisma/seed.js`)
- `organizationId = null` — kisi org se attached NAHI (warna org delete hote hi account delete ho jata)
- Login par **Super Admin Console** (`/admin/dashboard`) khulta hai
- **Org create ya branch create par koi naya SUPER_ADMIN nahi banta** — jo user banta hai wo `ADMIN`
  (Principal) hota hai

> **Ek line mein:** Platform Super Admin = aap (1 hi). Har org ka apna ADMIN/Principal hota hai jo
> org create ke waqt email se assign hota hai. Platform admin kabhi multiple nahi bante.

---

## 3. Core Data Model

```
Organization (name, slug, code, logoUrl, themeColor?, phone?, email?, website?, social links?, status)
  └── School / Branch (name, code, logoUrl?, portalPassword?, status)   ← campus
        ├── AcademicYear → Term → Exam
        ├── Class → Section → Student
        ├── FeeStructure → FeeRecord
        ├── scanDevices (JSON) — ab School model ka JSON field hai (alag table nahi)
        ├── Circular, PTMSession (scope: WHOLE_SCHOOL|CLASS_RANGE|SECTIONS|STUDENT), Activity,
        │   Applicant, HomeworkBroadcast
        └── User[] (branch staff)

User (name, email, username, role, organizationId?, schoolId?, isActive)
Student (schoolId, sectionId, parentId, rollNumber, status)
Parent (linked via Student.parentId)
NotificationLog (schoolId, recipient, channel, message, status) — delivery tracking

AttendanceRecord — har student ka daily record
  └── scanLog (JSON) — har scan ka timestamp/method/device log (alag table nahi)

StaffAttendance — staff ka attendance record
  └── leaveType?, dateTo?, reason?, reviewedBy?, reviewedAt?

OrgSecrets — branch/org level credentials storage
  └── schoolId? (optional — null = org-level default), category (SMTP|CLOUDINARY),
      tier (PRIMARY|SECONDARY), data (JSON) — branch-level overrides ke liye
```

> **PTM audience scopes:** `PTMSession.scope` — `WHOLE_SCHOOL` / `CLASS_RANGE` (class order range se),
> `SECTIONS` (specific sections), `STUDENT` (single student). Teachers many-to-many (`teacherIds[]`),
> notifications scope ke hisaab se jati hain.
>
> **Portal password:** `School.portalPassword` (hashed, nullable) — branch admin Settings → Portal
> Access se set karta hai. Null ho to parent/student login **school code as password** use karta hai.

> **⚠️ Org-level admin (ORG_ADMIN) concept REMOVE ho chuka hai** — ab SUPER_ADMIN sirf
> platform owner hai, aur har branch ka apna ADMIN (Principal) hota hai. Koi user "saari
> branches" ek login se manage nahi karta.

> **`Organization.themeColor`** (per-org brand color, hex) — branded login/public pages par
> use hota hai. `getBranding()` org ka color return karta hai (fallback `#2563eb`).

**Status enums:**
- `OrgStatus`: `SETUP_PENDING` → `ACTIVE` → (`PARTIALLY_BLOCKED` | `BLOCKED`)
- `SchoolStatus`: `ACTIVE` | `BLOCKED`
- User: `isActive` boolean (block hone par `false` + `blockedReason/blockedAt/blockedByName`)

---

## 4. Auth & Login Flow

Endpoints: `POST /api/v1/auth/login`, `POST /refresh`, `GET /me`, `PATCH /me`, `POST /logout`,
`POST /forgot-password`, `POST /change-password`, `POST /users/:id/reset-password`

### 4.1 Login ke 3 tarike

| Tarika | Kaun use karta hai | Formula |
|---|---|---|
| **School Code + Email/Username** | Branch staff (ADMIN, TEACHER, etc.) | `schoolCode` + `identifier` |
| **Email + Password (direct)** | Platform Super Admin | sirf `email` + `password` |
| **Parent/Student portal login** | Parents & Students | phone/roll + **shared portal password** (ya school code) |

Login screen (`/login`) par **School Code** field hai — code type karte hi branding (school naam/logo)
DB se fetch hoti hai. `/o/{slug}` URL branded login kholta hai (school naam/logo ke saath).

### 4.1.1 Forgot Password

- Login pages par **"Forgot password?"** link → `/forgot-password`
- `POST /auth/forgot-password` (public, rate-limited) — email se user dhoondo:
  - Temp password generate → bcrypt hash save → saare sessions revoke
  - Naye credentials email se jate hain
- Response hamesha generic hota hai (email enumeration prevent)

### 4.1.2 Parent/Student Portal Login — 2 Tarike

Har branch ka **ek shared password** hota hai jo parents/students apne phone/roll ke saath use karte hain:
- Default = **school code** (jab tak admin ne custom set nahi kiya)
- Custom = branch admin **Settings → Portal Access** se set kare (`PUT /schools/:id/portal-password`) ya reset-to-default kare (`DELETE`)

**Tarika 1 — Direct Login (zero OTP):**
| Portal | Endpoint | Formula |
|--------|----------|---------|
| Parent | `POST /auth/parent/login` | schoolCode + phone + portalPassword → parent JWT (30 days) |
| Student | `POST /auth/student/login` | schoolCode + rollNumber + portalPassword → student JWT (30 days) |

**Tarika 2 — OTP Flow:**
| Portal | Step 1 | Step 2 |
|--------|--------|--------|
| Parent | `POST /auth/parent/request-otp` (WhatsApp number) | `POST /auth/parent/verify-otp` → parent JWT |
| Student | `POST /auth/student/request-otp` (card ID → OTP to parent WhatsApp) | `POST /auth/student/verify-otp` → student JWT |

- `verifyPortalPassword()` dono direct-login flows mein use hota hai
- **Staff login bhi portal password accept karta hai** — staff login check order: (1) individual bcrypt password, (2) portal password (singleton), (3) school code fallback
- Parent JWT mein: `id`, `type: "parent"`, `schoolId`, `studentIds`, `sectionIds`, `name`
- Student JWT mein: `id`, `type: "student"`, `schoolId`, `sectionIds`, `name`
- Login page (`/parent/login`) — dono tabs (Parent Phone / Student Roll No) ek hi page par hain
- `GET /auth/parent/me` → parent profile + linked children (siblings)
- `GET /auth/student/me` → student profile (read-only)

### 4.1.3 Portal Shared Password Management

Branch admin **Settings → Portal Access** se portal password manage karta hai:
- `GET /schools/:id/portal-password` → status (custom/default)
- `PUT /schools/:id/portal-password` → set/update custom hashed password
- `DELETE /schools/:id/portal-password` → reset to default (school code)

### 4.2 Login par check order (sequence matter karta hai)

1. User dhoondo (schoolCode+identifier ya email se)
2. `isActive` check — blocked user → *"Your account has been deactivated..."*
3. **Blocking check** — org ya branch `BLOCKED` hai → standard message
   *"Admin deactivated your portal. Please contact admin of this system."*
   (Ye password check se PEHLE hota hai taake reason kabhi generic error se chhupe na)
4. Password verify (bcrypt)
5. Access + Refresh token generate
6. **Delivery cycle flip**: agar org `SETUP_PENDING` hai → `ACTIVE` ("Delivered") — **first login par**
7. Activity log: `LOGIN` action record
8. Response: `{ accessToken, refreshToken, user }` — user mein nested `organization`, `school`,
   aur **`schools` array** (hamesha sirf apni branch)

### 4.3 Token & Session

- JWT access token (short) + refresh token (rotating, DB mein hashed)
- Refresh token har refresh par rotate hota hai (old invalid)
- Block hone par saare sessions revoke ho jate hain (org/school/user level)
- `/auth/me` → current user profile + nested relations + `schools`

### 4.4 Role ke mutabiq login ke baad kahan jata hai (`getRoleHomePath`)

| Role | Redirect |
|---|---|
| SUPER_ADMIN (platform, org null) | `/admin/dashboard` |
| ADMIN (branch principal) | `/branch/dashboard` |
| TEACHER | `/teacher/dashboard` |
| RECEPTIONIST | `/branch/dashboard` |

---

## 5. Organization Creation Flow — Asal Flow

Jagah: Super Admin Console → **Organizations → New Organization**
Backend: `POST /api/v1/organizations` → `OrganizationService.createOrganization()`
Bulk import: `POST /api/v1/organizations/import-excel` → BullMQ worker

### 5.1 Single create (UI se) — exact steps

1. **Validations**: code unique? slug unique? (slug code/name se auto-generate hota hai)
2. **Organization row** create — status `SETUP_PENDING` ("Not delivered"), logo optional,
   **brand color (`themeColor`) optional** — color picker se set hota hai (default `#2563eb`)
3. **Default branch** auto-create: `createDefaultBranch()` → `${org.name} Main Campus`, code = `${ORGCODE}-01`
4. **Ek admin assign hota hai** (agar adminEmail diya ho):
   - Role = **`ADMIN`** (Branch Principal / Head) — `organizationId` + `schoolId` = default branch
   - **Yahi bnda org ka ADMIN hai** — jiski email daali thi, wahi principal hai, aur **wahi aage
     branches manage karega**
   - Password auto-generate hota hai (`random + "A1!"`) agar diya na ho
   - Platform super admin **sirf aap hain** — ye user platform admin nahi
5. **Email** (agar admin email requester ki apni email na ho — self-designation skip):
   - Subject: `School ERP - Branch Admin / Principal Credentials for {org}`
   - Content: org naam, **School Code**, Email, Username, Password, branded login link `/o/{slug}`
6. Caches bust + WebSocket `organization_created` broadcast

> **Asal flow:** Super Admin (aap) sirf 1 hai. Har org par **ek hi admin** assign hota hai — org
> create ke waqt jiski email daali thi, wahi us school ka Principal hai aur wahi uski saari
> branches ko manage karta hai.

### 5.2 Bulk import (Excel se)

- `organization.import.worker.js` — har row par org + default branch + admin user (role `ADMIN`)
- Duplicate codes/usernames skip hote hain (count ke saath report)
- Har org ko same credentials email jaati hai (self-designation skip ke saath)
- Import queue Redis (BullMQ) use karta hai — **ye queue Redis chahiye**

### 5.3 "Delivered" cycle (aapka status wala scene)

```
Org create → SETUP_PENDING  (UI: "Not delivered")
First login → ACTIVE        (UI: "Delivered")   ← markDeliveredOnLogin()
```

- **"Delivered" tabhi hota hai jab koi login kare** — create karte hi nahi
- Agar branch block hai to login possible hi nahi → status ACTIVE kabhi hoga hi nahi (blocked rehne tak)
- Block/unblock org status ko directly badal sakta hai

---

## 6. Branch Creation Flow — Aapka Asal Flow (2nd Branch)

Jagah: Org detail → **Add Branch**
Backend: `POST /api/v1/schools` → `SchoolService.create()`

> **Pehle 2 modes the ("Naya Principal banao" / "Wahi admin manage kare") — ab sirf ek mode
> hai.** "Wahi admin manage kare" (org-level handover) REMOVE ho chuka hai. Har branch ka
> apna ADMIN (Principal) hota hai.

| Mode | Kya hota hai | Email |
|---|---|---|
| **"Naya Principal banao"** (default, ab sirf yehi) | Nayi branch ke liye **naya** `ADMIN` user banta hai — us branch ka apna principal | Naye principal ko credentials email — School Code + Username + Password |

### Aapka asal flow (2nd branch wala scene)

**Scenario:** System ek school ko dia, uska principal (jiski email org create par daali thi)
bana. Ab wo khta hai *"nayi branch khol raha hun"* — har nayi branch ka apna principal
banega:

```
2nd branch kholni hai
  → "Naya Principal banao" — naya bnda, uski apni email+creds, us branch ka apna admin
  → Pehla principal sirf apni branch access karta hai (isolation by design)
```

- **"Jo bnda pehle se admin tha, wo 2nd branch mein login kar payega?"** → **Nahi** — ab
  koi org-level access nahi. Agar usse nayi branch bhi deni ho, to us branch ke "Change
  Admin" se usse re-assign karein (purana principal deactivate ho jata hai)

---

## 7. Scope Isolation (Branch Data Lock)

1. `/auth/me` (aur login) response mein **`schools` array** — ab hamesha sirf user ki apni
   branch hoti hai (koi org-level admin nahi)
2. Login/refresh par apni branch auto-active ho jati hai (`pickActiveSchool`)
3. **Branch Switcher frontend se remove ho chuka hai** — kisi user ke paas 2+ branches ka
   access nahi hai
4. Backend `lib/scope.js` har request par branch isolation enforce karta hai (branch staff
   apni branch par locked, SUPER_ADMIN ko explicit `schoolId` dena parta hai)

---

## 8. Blocking / Deactivation Logic

Backend: `ModerationService` (`src/modules/moderation/moderation.service.js`)

### A. Super Admin ek branch block kare (`blockSchool`)
- Sirf us branch ka admin/staff/student/parent login nahi kar payenge — baaki branches normal
- Branch → `BLOCKED`, org (agar `ACTIVE` ho) → `PARTIALLY_BLOCKED`
- Us branch ke saare sessions revoke
- Login attempt par: *"Admin deactivated your portal. Please contact admin of this system."*

### B. Super Admin poora organization block kare (`blockOrganization`)
- **Cascade**: saari branches `BLOCKED`
- Har role (org admin, branch admin, staff, student, parent) login nahi kar payega
- Poore org ke sessions revoke

### C. Branch Admin apni branch ke users block kare (`blockUser`)
- Branch admin apni branch ke staff/student/parent ko block kar sakta hai (role-based)
- **Branch Admin doosre Branch Admin ko block nahi kar sakta** — sirf Super Admin
- Guard: koi lower-level admin apne se upar wale ko block nahi kar sakta
- **Khud ka account block nahi kar sakta**
- Har block/unblock **audit log** mein (who blocked whom, timestamp, reason)

### D. Unblock — reversible
- `unblockOrg` → saari branches restore, org `ACTIVE`
- `unblockSchool` → branch `ACTIVE`, org `PARTIALLY_BLOCKED` se `ACTIVE` (agar koi branch blocked na bache)
- `unblockUser` → `isActive: true`, block fields clear

### Governance rule
Koi bhi future feature jo hierarchy violate kare (e.g. branch admin ko org-level block power) → ye
document ka rule todta hai. Design decision se pehle flag karna chahiye.

---

## 9. Emails (kab kya jati hai)

Email system **Redis-free** hai (`email.queue.js`) — direct SMTP, 3 retries, kabhi throw nahi karta.
Redis down ho ya quota khatam → emails phir bhi jati hain (jab tak SMTP creds sahi hain).

| Trigger | Template | Kisko | Content |
|---|---|---|---|
| Org create (single) | `orgCredentialsEmail` | Org admin email (agar self-designation na ho) | Org naam, School Code, Email, Username, Password, **branded login link `/o/{slug}`** |
| Bulk import | `orgCredentialsEmail` (viaImport) | Har org ka admin | same as above + "setup via bulk import" |
| Branch create — naya principal | `adminCredentialsEmail` | Naya principal | Org, Branch, School Code, Email, Username, Password, **`/login?code=...`** |
| Staff create / bulk import | `staffCredentialsEmail` | Staff | Org, School Code, Staff ID/Username, Email, Password, `/login?code=...` |
| PTM event | `ptmNotification` | Parents | PTM session details + portal notification bhi jaata hai |
| **Self-designation** | **skip** | — | Jab admin apni hi email daal kar org/branch banata hai — usko email nahi jati (wo khud bana raha hai) |

> **Staff leave requests** → email NAHI jaati. Sirf **portal notification** bheja jaata hai
> (staff ko `portal_notification_created` event se). Email sirf parent-facing notifications
> jaata hai.

### 9.1 Parent Notification Emails — PDF Attachments ✅

`email.service.js` ab **attachments support** karta hai (nodemailer). Parent ko jane wale
3 important documents **PDF attach** hote hain:

| Flow | Attachment | Kab |
|---|---|---|
| **Admission approve** | `admission-slip-*.pdf` (advance fee slip) | Applicant APPROVED hone par |
| **Admission enroll** | `student-id-*.pdf` (QR ID card slip) | Advance fee jama + enrolled hone par |
| **Fee payment** | `fee-receipt-*.pdf` (payment receipt) | Har payment record hone par |

**Flow:** `pdfService` se PDF buffer → `notificationService.notifyParent({ attachments })` →
`_sendEmail` → `queueEmail` → nodemailer `attachments` array.

> Ye sab emails **NotificationLog** mein log hoti hain + `notification_status_updated`
> WebSocket event — navbar bell mein realtime dikhta hai.

**Sab login links branded hain** — `/o/{slug}` ya `/login?code={schoolCode}` — taake login screen
school ka **naam + logo DB se load** kare (generic `/admin/login` nahi).

### 9.2 Per-Org Branded Login (themeColor)

- Org ka `themeColor` **DB mein store** hota hai (create/edit se set hota hai)
- `GET /schools/branding?slug=` → `themeColor` return karta hai (fallback `#2563eb`)
- Login hub (`LoginHubPage`) `applyOrgThemeToRoot(themeColor)` call karta hai — CSS `--color-primary-*` vars override hote hain, poore UI par theme apply hota hai
- Jab `themeColor` null ho → `DEFAULT_THEME = '#6366f1'` (indigo) apply hota hai
- BrandPanel left side par inline gradient `linear-gradient(135deg, themeColor, darkenHex(themeColor))` use karta hai
- `AuthLayout` background `to-primary-50/30` use karta hai (CSS variable, dynamic)
- Notifications: LinkedIn-style — unread par full theme color bg, read par subtle `rgba(themeColor, 0.06)` tint
- Naya color lene ke liye: org create form ya EditOrgModal mein **color picker**

### 9.3 Cloudinary — Branch-Level Credentials

- **School documents (student photos, avatars, logos)** kabhi platform env Cloudinary use NAHI karte
- Resolution order: **branch override** (`OrgSecrets` with `schoolId`) → **org default** (`OrgSecrets` with `schoolId=null`) → **platform env** (sirf super admin ke liye)
- `OrgSecrets` table: `schoolId?` (null = org default), `category` (SMTP|CLOUDINARY), `tier` (PRIMARY|SECONDARY), `data` JSON — branch-level credentials store karta hai

---

## 10. Portals & Routes

### Platform Super Admin Console (`/admin/*`)
`SuperAdminLayout` + `superAdminLinks`:
- **Dashboard** (`/admin/dashboard`) — platform stats (orgs, branches, students, revenue, growth)
- **Organizations** — list + create + detail (KPIs: branches, students, staff, revenue), block/unblock,
  **slug display** (`/o/{slug}`) + **Copy login link** button
  - Org detail → branch detail (`/admin/organizations/{orgId}/schools/{schoolId}`) + uski students
- **Branches** (`/admin/branches`) — saari branches, status badges, block/unblock, org filter
- **Users** (`/admin/users`) — platform-wide directory (`GET /auth/users/all`, SUPER_ADMIN only),
  role/status/block-reason filters, profile modal, export CSV, block/unblock,
  **Create User** button + modal (branch selector + role + creds → `POST /auth/users`)
- **Import Data** (`/admin/import`) — org bulk import (.xlsx template download ke saath)
- **Activity Log** (`/admin/activity`) — audit trail (`GET /audit-logs`; kaun kya kiya, kab) + **Export CSV**
- **Notifications** (`/admin/notifications`) — delivery logs table (recipient/branch/channel/status/
  message) + channel/status filters + pagination (`GET /notifications/logs`)
- **Settings** (`/admin/settings`) — Profile / Change Password / **Platform tab** (notification
  delivery summary: total/sent/delivered/failed + by-channel, `GET /notifications/status`)
- **Branch Settings** (`/admin/branch-settings`) — SMTP/Cloudinary config per branch
  (org name immutable + branch dropdown selector)
- **Login** (`/admin/login`) — direct email+password (platform super admin)

> **Super Admin se user create:** jab platform admin (`organizationId: null`) `POST /auth/users`
> se user banata hai to `organizationId` **school se derive** hota hai — branch-level staff
> sahi org se attached rehta hai.

### Branch Portal (`/o/{slug}/branch/*`)
`DashboardLayout` + `schoolAdminLinks` — **active branch ke data par**:
- Dashboard (active students, present today, fees collected, scans, admission funnel)
- Students, Admissions, Academic Setup, Staff (+ per-staff password reset), Teaching Assignments,
  Fee Structures/Records/Collection, Attendance (live/records/gate), Exams & Results, PTM
  (audience scope ke saath), Promotions, Circulars/Broadcast, Notifications
- **Settings tabs**: Profile / Security / Branding / **Portal Access** (parent-student shared
  password set/reset + status)
- **Navbar: Portal Status Pill + Notification bell** (Branch Switcher remove ho chuka hai)
- **Notification bell** — `GET /notifications/logs` se logs (channel/status badges, realtime WS)

### Receptionist Portal — Front Desk (Detailed)

**Role:** `RECEPTIONIST` — branch ka front desk / gate / admission staff. Backend enforcement
`src/constants.js` ke role groups se hota hai. `branch` portal aapko allow karta hai
(`['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN']`), lekin **content-level permissions role groups se
enforce** hoti hain — receptionist ko poora admin control nahi milta.

**Receptionist CAN Kya Karta Hai:**

| Area | Ability | Backend route grants |
|---|---|---|
| **Student records** | Create, edit, photo upload (no delete, no Excel import, no ID reissue, no TC, no rollback) | `POST /students/schools/:schoolId`, `PATCH /students/:id`, `POST /students/:id/photo` |
| **Student read** | List + section/class/status filter + search | `GET /students` (`ALL_STAFF`) |
| **Admissions** | Poore pipeline: inquiry → test → approve → advance fee → enroll → reject | `ADMISSIONS` group = SUPER_ADMIN + ADMIN + RECEPTIONIST |
| **Student attendance** | Gate scan, offline sync, section bulk mark, daily/monthly report, manual override, record delete/update | `ATTENDANCE` group = SUPER_ADMIN + ADMIN + RECEPTIONIST + TEACHER |
| **Staff attendance** | Bulk mark, daily, monthly, check-in/out, record delete/update, export | `staffAttendance` + RECEPTIONIST |
| **Announcements / Notifications** | Circulars view + portal notifications | `ALL_STAFF` |

**Receptionist CANNOT Kya Karta Hai (ADMIN-only):**

| Area | Reason |
|---|---|
| Student delete / Excel import / ID reissue / TC / rollback | Destructive + bulk ops sirf ADMIN |
| Staff management (create/edit/delete users) | HR sirf ADMIN |
| Academic setup (years/terms/classes/sections/subjects) | Structure changes ADMIN-only |
| Fee structures + fee collection | Finance control ADMIN-only (read-only fee records dekh sakta hai) |
| Teaching assignments + promotions | Academic decisions ADMIN-only |
| Settings (SMTP/storage/branch/branding) | ADMIN-only |

**Front-desk workflows:** (1) Admission at desk — inquiry → test → approve → advance fee → enroll →
QR ID card + parent email; (2) Gate scan — QR/RFID/roll, live result + fee status, offline buffer
sync; (3) Student record update — parent contact change; (4) Photo upload — ID photo session;
(5) Bulk section attendance — poore section ko ek saath mark karna.

### Teacher Portal (`/o/{slug}/teacher/*`)
- **Dashboard:** Stats (assignments, upcoming PTMs, homework count, timetable slots), today's timetable, upcoming PTMs, recent homework
- **Section Attendance:** Calendar heatmap, daily tracking, monthly matrix comparison, student monthly comparison, day detail modal, undo toast
- **Homework:** Post, track, recent homework cards
- **Conduct Remarks:** Give remarks (POSITIVE/NEGATIVE/NEUTRAL), undo support, remarks history page
- **My Timetable:** Desktop grid, mobile cards, weekly bar chart, year heatmap, section timetable overview
- **Exams:** Schedule, stats (total/upcoming/completed), paper details
- **PTM:** Upcoming sessions
- **My Attendance:** Personal attendance view with calendar, log, report, stat cards, summary
- **Study Materials:** View study materials
- **Notifications:** Portal notifications inbox
- **Settings:** Profile settings

### Parent Portal (`/parent/*`)

**Login (2 tarike):**
1. **Direct login:** School Code + Phone + shared portal password → `POST /auth/parent/login`
2. **OTP flow:** WhatsApp number → `POST /auth/parent/request-otp` → OTP verify → `POST /auth/parent/verify-otp`

**Profile:** `GET /auth/parent/me` — returns parent info + linked children array (siblings supported).

**Portal Dashboard tabs** (`/parent/dashboard`) — 14 tabs, all via `authenticateAnyPortal` middleware:

| Tab | API Route | Description |
|-----|-----------|-------------|
| Overview | `GET /portal/overview` | Aggregated: attendance summary, fee summary, homework/circular/study material counts |
| Attendance | `GET /portal/attendance?month=&year=` | Monthly attendance per child (present/late/absent/leave + percentage) |
| Fees | `GET /portal/fees` | Fee records + summary (total charged, paid, outstanding, unpaid/partial/paid counts) |
| Homework | `GET /portal/homework` | Recent homework broadcasts for child's section |
| Materials | `GET /portal/study-material` | Study materials for child's section |
| Notices | `GET /portal/circulars` | School circulars (PARENTS + ALL audience) |
| Results | `GET /portal/results` | Exam results across all exams |
| Exams | `GET /portal/exams` | Exam date sheets for child's classes |
| Timetable | `GET /portal/timetable` | Weekly timetable slots for child's section |
| Conduct | `GET /portal/conduct` | Conduct remarks from teachers |
| PTM | `GET /portal/ptm` | Upcoming PTM sessions (scheduled, future) |
| Leave | `GET /portal/leave` + `POST /portal/leave` | View + submit leave requests |
| Alerts | `GET /notifications/portal` + unread count | Portal notifications (realtime via WS) |
| Profile | `GET /auth/parent/me` | Parent profile + linked children |

**Parent sees ALL linked children** — sibling selector switch karta hai active child. Portal socket `usePortalSocket(sectionIds, schoolId)` join karta hai section + school rooms.

**PDF downloads available:**
- `GET /portal/timetable/pdf` — timetable as PDF
- `GET /portal/exams/:examId/date-sheet` — exam date sheet as PDF

**Leave request:** `POST /portal/leave` (studentId, dateFrom, dateTo, reason) — validates student belongs to parent, checks overlapping approved leaves, notifies school admin via portal notification + WebSocket `leave_request_created`.

**Staff portal password bhi accept hota hai** — `verifyPortalPassword()` ab staff login flow mein bhi call hota hai.

### Student Portal (`/parent/*` — shared login page with parent tab)

**Login (2 tarike):**
1. **Direct login:** School Code + Roll Number + shared portal password → `POST /auth/student/login`
2. **OTP flow:** Card ID → `POST /auth/student/request-otp` → OTP sent to parent's WhatsApp → `POST /auth/student/verify-otp`

**Profile:** `GET /auth/student/me` — returns student profile (read-only). Token stored as `studentToken` in localStorage.

**Student sees ONLY own data** — no sibling selector. Same 14 tabs as parent but scoped to own section/studentId only.

**Key difference from parent:** Student portal uses `authenticateStudent` middleware for `/auth/student/me`, and `authenticateAnyPortal` for all `/portal/*` routes (same as parent).

### Public
- `/` — landing page
- `/o/{slug}` — **org public page**: branded landing (logo/naam/branches DB se) + "Admission" +
  "Admin Login" buttons — **implemented** ✅
- `/o/{slug}/admission` — **public admission form**: `GET /admissions/public/classes` se classes,
  submit par applicant banta hai (`POST /admissions/public/inquiry`) — **implemented** ✅
- `/login`, `/admin/login`, `/parent/login`, `/forgot-password`

---

## 11. Background Jobs (BullMQ + Redis)

| Queue | Worker | Kaam |
|---|---|---|
| `organization-import` | `organization.import.worker.js` | Excel se org bulk import |
| `organization-delete` | `organization.delete.worker.js` | Org delete (platform admin detach, baaki cascade) |
| `school-import` | `school.import.worker.js` | Branch bulk import |
| `staff-import` | `staffImport.queue.js` | Staff bulk import (emails direct SMTP) |
| `student-import` | `studentImport.queue.js` | Students bulk import |

**Email queue ab BullMQ use nahi karti** (direct SMTP) — Redis par load kam.

**⚠️ Upstash Redis quota:** free tier (500k requests/month) khatam ho chuka tha — BullMQ polling + caching
iski wajah. Workers par `drainDelay: 15` laga kar polling 3x kam ki gayi hai. Agar quota phir khatam ho →
email to phir bhi chalegi (SMTP direct), lekin imports/caching fail ho sakte hain — **plan upgrade karo**.

---

## 12. Caching & Realtime

- **Redis caches**: `orgs:all`, `org:{id}`, `superadmin:overview`, `schools:all`, `schools:org:{id}`,
  `school:{id}` — block/unblock/create par bust hote hain

- **WebSocket rooms:**
  - `super_admins` — platform-wide events (org create, overview updates)
  - `org:{id}` — org-level events (org block/unblock, school updates within org)
  - `school:{id}` — branch-level events (gate scan, attendance, staff status)
  - `section:{id}` — section-level events
  - `job:{jobId}` — import progress (BullMQ jobs par live progress)

- **Staff socket:** `useSocket` hook → `connectSocket(schoolId, organizationId)` from `DashboardLayout`
- **Parent/Student socket:** `usePortalSocket(sectionIds, schoolId)` → joins section + school rooms
  - Portal socket reads correct token: `studentToken || parentToken || accessToken`
- **Events:**
  - `portal_notification_created` — naya portal notification
  - `portal_notifications_read` — notifications mark as read
  - `portal_notifications_deleted` — notifications delete
  - `portal_all_read` — saare notifications mark as read
- **`leave_room` event handled** (cleanup — socket disconnect par room leave)
- **`job:` rooms restricted to SUPER_ADMIN/ADMIN only** — unauthorized access nahi ho sakta

---

## 13. Frequently Confused Points (Quick Answers)

| Sawal | Jawab |
|---|---|
| "Super admin kai kyun ban rahe?" | Platform Super Admin **sirf 1** hai (aap). Org/branch create par naya SUPER_ADMIN nahi banta — `ADMIN` (Principal) banta hai |
| "Org create par jo user banta hai wo kya hai?" | **Us org ka ADMIN (Principal)** — jiski email daali thi. Platform super admin sirf aap hain |
| "2nd branch par naya admin kaise?" | Branch create par **"Naya Principal banao"** — naya bnda, uski apni creds |
| "2nd branch wahi admin manage kare?" | **Ye option ab nahi hai** — org-level handover REMOVE ho chuka hai. Har branch ka apna principal |
| "Jo bnda pehle admin tha wo 2nd branch mein login karega?" | **Nahi** — ab koi org-level access nahi. Usse nayi branch deni ho to "Change Admin" se re-assign karein |
| "Org status 'Not delivered' kab 'Delivered' hoga?" | **Pehli login par** (SETUP_PENDING → ACTIVE) |
| "1 admin 2 branches alag manage?" | Ab possible nahi — koi org-level admin nahi. Har branch ka apna principal, apna login |
| "Branch block hone par kya hota hai?" | Us branch ke users login nahi kar sakte, org PARTIALLY_BLOCKED |
| "Org block hone par?" | Saari branches cascade-block, sab roles lock |
| "Blocked user ko kya dikhta hai?" | Standard message: *"Admin deactivated your portal. Please contact admin of this system."* |
| "Org delete hone par admin account?" | Platform SUPER_ADMIN **bachta hai** (detach); baaki users cascade delete |
| "Email kyun nahi jati jab khud org banata hun?" | Self-designation rule — apni hi email par credentials email skip hoti hai (khud bana rahe ho) |
| "Har org ka apna color kahan se?" | `Organization.themeColor` — org create/edit par color picker se set hota hai; branded login hub + public pages + notifications us color par |
| "Admission slip / ID card / fee receipt email mein kahan?" | **PDF attach** hote hain — admission approve (`admission-slip`), enroll (`student-id`), fee payment (`fee-receipt`) |
| "Notification logs kahan dekhen?" | Admin console `/admin/notifications` page + navbar bell (realtime WS) |
| "Receptionist kya kar sakta hai?" | Students (create/edit/photo), admissions pipeline, gate scan + attendance (bulk/reports/override), staff attendance, view leave/announcements |
| "Receptionist kya nahi kar sakta?" | Student delete/import/ID-reissue/TC/rollback, staff mgmt, academic setup, fee structures/collection, promotions, settings — sab ADMIN-only |
| "GATE_STAFF / ACCOUNTANT role kahan gaye?" | Remove ho chuke — ab sirf 4 roles hain (SUPER_ADMIN/ADMIN/TEACHER/RECEPTIONIST). Gate + fees ADMIN/RECEPTIONIST handle karte hain |
| "Parent portal mein kitne bachche dikhenge?" | Saare linked children (siblings) — sibling selector se switch. Student portal mein sirf khud ka data |
| "Portal login kaise hota hai?" | 2 tarike: (1) Direct — school code + phone/roll + portal password, (2) OTP — WhatsApp par OTP. Dono 30-day JWT dete hain |
| "Portal ka shared password kya hai?" | Default = school code. Branch admin Settings → Portal Access se custom set kar sakta hai |
| "Portal mein kaun kaun si cheezein dikhengi?" | 14 tabs: overview, attendance, fees, homework, materials, notices, results, exams, timetable, conduct, PTM, leave, notifications, profile |
| "Portal routes kaise kaam karte hain?" | Saare `/portal/*` routes `authenticateAnyPortal` middleware use karte hain — parent ya student JWT dono accept hote hain |
| "Staff/Principal ka photo nahi hai?" | Org logo dikhta hai as fallback (user photo → org logo → initials) |

---

## 14. Quick Dev Commands

```bash
# Backend (port 5000)
cd Backend && npm run dev          # node --watch with .env

# Frontend (Next.js App Router — frontend/nextjs)
cd frontend/nextjs && npm run dev
cd frontend/nextjs && npm run build   # build + typecheck

# Seed platform super admin
cd Backend && npx prisma db seed    # superadmin@schoolerp.com / superadmin123

# Migrations (jab DB reachable ho)
cd Backend && npx prisma migrate deploy

# Verify frontend types
cd frontend/nextjs && npx tsc --noEmit
```
