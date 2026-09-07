# School ERP — Deep Application Flow (Code-Verified)

> Yeh document `APPLICATION_FLOW.md` ka **deep version** hai. Har flow ko backend code se
> mila kar verify kiya gaya hai — file-by-file, function-by-function.
>
> **✅ Business model (is version mein simplify kiya gaya):**
> **Sirf EK SUPER_ADMIN hai — aap (platform owner)**. Jab kisi school ko system chahiye
> hota hai, to aap uske liye ek **Organization** banate hain aur system unhe de dete hain.
> **Organization isliye banai jati hai taake future mein agar wo school grow kare aur zyada
> branches khole, to wo already ek container (Organization) ke andar ready hote hain** —
> bina structure badle naye branches add ho sakte hain.
>
> **⚠️ Pehle ek "org-level admin" (ORG_ADMIN) concept tha** — branch handover flow
> (`_ensureOrgAdmin()`) se promotion hokar ek Principal saari branches manage karta tha.
> **Yeh concept ab hata diya gaya hai** (`20260817000400_remove_org_admin_role` migration):
> ab ORG_ADMIN role exist hi nahi karta, har branch ka apna ADMIN (Principal) hota hai, aur
> branch creation par sirf "Naya Principal banao" mode hai. Flow bilkul simple hai: **Organization
> create → default branch → us branch ka ADMIN (Principal)**. Yehi wo school ka "owner
> account" hai, SUPER_ADMIN nahi.

---

## 1. System Architecture (Kaise Cheezein Judi Hain)

```
Browser (React SPA, port 5173)
   │  axios (access token)  +  Socket.io client (realtime)
   ▼
Express Backend (port 3000, ESM)
   ├── routes/index.js ──► module routers ──► controllers ──► services ──► repositories ──► Prisma ──► PostgreSQL
   │        │                    │                 │              │
   │        │                    │                 │              └── Redis (Upstash) caches
   │        │                    │                 └── auditService (har important kaam log)
   │        │                    └── emitToRoom() (WebSocket) ──► browser ko live update
   │        └── middlewares (auth, role guards) ── JWT verify + ROLE_GROUPS check
   │
   ├── BullMQ queues (Redis): organization-import, organization-delete, school-import,
   │                          staff-import, student-import  (workers: src/jobs/workers/)
   ├── node-cron schedulers: auto-absent (8:30am Mon-Sat), fee reminder (9:00am daily)
   └── Email: DIRECT SMTP (Nodemailer) — Redis par DEPENDENT NAHI
```

**Har request ka flow (generic):**
1. Frontend `axios` interceptor access token attach karta hai
2. Backend middleware JWT verify karta hai → `req.user` set
3. Role guard check karta hai (`ROLE_GROUPS` — e.g. `MANAGEMENT`, `FINANCE`)
4. Controller body/query validate karta hai (`*.validation.js` / `*.dto.js`)
5. Service business logic chalata hai
6. Repository Prisma query karta hai (scope guards: `lib/scope.js`)
7. Service Redis cache bust karta hai + `emitToRoom()` WebSocket event bhejta hai
8. Service `auditService.record()` log karta hai (kisne, kya, kab, kis IP se)
9. Response DTO se return hota hai (password kabhi nahi)

---

## 2. Roles — Simplified Picture (Aap ka Actual Model)

**Normal / default usage mein sirf ye roles chalte hain:**

| Role | Matlab | Kahan banta hai |
|---|---|---|
| `SUPER_ADMIN` | **Sirf AAP — platform owner.** `organizationId = null`, seed se banta hai, ek hi hoga | Seed script (`superadmin@schoolerp.com`) |
| `ADMIN` | Branch Head / Principal — jis branch ko aap system dete hain uska "owner" | Org create par (default branch ka), ya branch create par "naya principal" (har branch ka apna) |
| `TEACHER` | Class Teacher | Staff create / import |
| `RECEPTIONIST` | Front Desk — admissions + gate + student records | Staff create / import |

> **✅ Ye wala org-level concept ab REMOVE ho chuka hai:** pehle ek "Wahi admin manage
> kare" mode tha jo ek Principal ko promotion de kar saari branches ka access deta tha
> (ORG_ADMIN role). Ab wo mode aur role dono hat gaye hain — har branch ka apna ADMIN
> (Principal) hota hai. Sirf 1 SUPER_ADMIN hai (aap).

**Role groups (RBAC guards in routes):**
```
ALL_STAFF      = SUPER_ADMIN, ADMIN, TEACHER, RECEPTIONIST                    (read sab)
MANAGEMENT     = SUPER_ADMIN, ADMIN                 (branch admin kaam: create/update/delete)
ORG_LEVEL      = SUPER_ADMIN                        (sirf platform owner)
USER_MANAGERS  = SUPER_ADMIN, ADMIN                 (staff accounts)
FINANCE        = SUPER_ADMIN, ADMIN                 (fees)
ACADEMIC       = SUPER_ADMIN, ADMIN, TEACHER        (homework, exams, conduct, timetable)
ATTENDANCE     = SUPER_ADMIN, ADMIN, RECEPTIONIST, TEACHER
ADMISSIONS     = SUPER_ADMIN, ADMIN, RECEPTIONIST
BRANCH_STAFF   = ADMIN, TEACHER, RECEPTIONIST
```

**Admin bana kya kar sakta hai (`CREATABLE_ROLES_BY` in auth.service.js):**
- Aap (SUPER_ADMIN, platform) → ADMIN, TEACHER, RECEPTIONIST bana sakte hain
- School ka ADMIN (Principal) → sirf TEACHER, RECEPTIONIST (apni branch mein)

---

## 3. Auth — Login Ka Complete Deep Flow

### 3.1 Login ke 2 raaste (`auth.service.js` → `login()`)

```js
const identifier = email || username || phone;   // teeno accept hote hain!
if (schoolCode && identifier)  → findStaffBySchoolAndCredential(schoolCode, identifier)
else if (email)                → findByEmail(email)          // platform admin (aap) direct
```

`findStaffBySchoolAndCredential` (repository.js) user dhoondta hai:
`school.code == schoolCode (UPPER)` AUR (`username | email (lower) | phone` match).
**Isliye staff login par Email, Username, ya Phone — teeno chalte hain.**

### 3.2 Check order (sequence matter karta hai — code-verified)

```
1. user dhundo                  → nahi mila: "Invalid login credentials or school code"
2. !user.isActive               → "Your account has been deactivated. Please contact your administrator."
3. org.status === "BLOCKED" ||
   school.status === "BLOCKED"  → BLOCKED_MESSAGE ("Admin deactivated your portal...")
                                  ⚠️ password check se PEHLE — reason kabhi generic error se nahi chhup-ta
4. bcrypt.compare(password)
   ├── FALLBACK 1: verifyPortalPassword(user.school, password)  ← portal/singleton password
   ├── FALLBACK 2: password === schoolCode (UPPERCASE)          ← school code as password
       (imported staff jinka password set nahi hua, school code se login kar sakte hain!)
5. access token sign (15 min) + refresh token (7 days, DB mein SHA-256 hash, rotating)
6. org SETUP_PENDING hai → markDeliveredOnLogin()  →  SETUP_PENDING → ACTIVE
7. audit LOGIN record
8. Response: { accessToken, refreshToken, user }
```

> **Staff login bhi portal password accept karta hai** — `verifyPortalPassword()` ab staff login
> flow mein bhi call hota hai (`auth.service.js`). Staff login check order: (1) individual bcrypt
> password, (2) portal password (singleton), (3) school code fallback.

### 3.3 Tokens & Sessions (deep)

| Token | Expiry | Kaise store | Kaise revoke |
|---|---|---|---|
| Access (JWT) | 15 min | client (memory/localStorage) | short-lived; block par saari revoke |
| Refresh | 7 days | DB mein **SHA-256 hash** | **rotation**: har refresh par purana revoke, naya issue |
| Parent portal | 30 days | — | — |
| Student portal | 30 days | — | — |

- `refreshTokens()`: purana token validate → **revoke** → naya pair issue. Blocked org/school par refresh bhi fail.
- `logout()`: sirf woh refresh token revoke. `logout-all`: user ke saare revoke.
- `changePassword()`: password change par **saare devices ke refresh tokens revoke** — sab jagah re-login.
- Block (org/school/user) par bhi saare relevant sessions revoke.

### 3.4 Login ke baad kahan jata hai (`getRoleHomePath` — frontend)

```js
SUPER_ADMIN (aap, org null)   → /admin/dashboard    ← platform console
ADMIN / RECEPTIONIST            → /branch/dashboard
TEACHER                       → /teacher/dashboard
```

### 3.5 `/auth/me` — profile data

`UserResponseDTO` (auth.dto.js) response mein 3 cheezein deta hai:
- `school` — nested branch (branch-scoped user apni branch)
- `organization` — nested org
- `schools` — accessible branches (hamesha sirf apni branch — ab koi org-level admin nahi)

`pickActiveSchool` (frontend authHelpers.ts): nested school → warna `schools[0]` → first branch
auto-active hoti hai login par.

---

## 4. Organization Creation — Har Step Code Se (Aapka Main Flow)

> **Yehi wo flow hai jo aap normally use karte hain:** jab koi school aapke paas system
> lene aata hai, to aap uske liye ek Organization banate hain. Organization automatically
> ek default branch aur us branch ka ADMIN (Principal) bhi bana deta hai — aur wahi Principal
> us school ka poora system chalata hai. Organization ka container hona isliye zaroori hai
> taake **future mein agar us school ke zyada branches ho jayein, to wo sab isi Organization
> ke andar add ho sakein** — bina naya setup kiye.

`organization.service.js` → `createOrganization()` + `provision.js` → `createDefaultBranch()`

```
POST /api/v1/organizations   (sirf aap — SUPER_ADMIN)
   │
   ├─ 1. Validations
   │     • code unique? (findByCode)  → "Organization with this code already exists"
   │     • slug: diya ho to sanitize ([^a-z0-9-] remove), warna code/name se auto-banaya
   │     • slug unique? (findBySlug)
   │
   ├─ 2. Organization row create — status SETUP_PENDING ("Not delivered"), logo optional
   │
   ├─ 3. createDefaultBranch() — school ki pehli (aur abhi ke liye ikk) branch:
   │     • name: `${org.name} Main Campus`
   │     • code: `${ORGCODE}-01` — generateUniqueSchoolCode() collision par -02, -03...
   │     (yehi container hai jismein future mein aur branches add hongi)
   │
   ├─ 4. audit CREATE_ORG (requester, IP, adminEmail details)
   │
   ├─ 5. Redis cache bust: orgs:all, superadmin:overview, schools:all, schools:org:{id}
   │
   ├─ 6. Agar adminEmail diya (normal case — school ke Principal ki email):
   │     • password auto-gen: crypto.randomBytes(4).hex + "A1!" (ya diya hua)
   │     • bcrypt.hash(password, 12)
   │     • User create: role "ADMIN", organizationId=org.id, schoolId=defaultBranch.id
   │       name default: `${org.name} Principal`
   │       ← **YE hai wo account jo aap us school ko "system dete hain"**
   │     • SELF-DESIGNATION check: aap khud apni email daal rahe ho → email skip
   │       (aap khud credentials jaante ho)
   │     • warna queueEmail() — orgCredentialsEmail: org naam, School Code, Email,
   │       Username, Password, branded link /o/{slug} — Principal ko credentials mil jati hain
   │
   └─ 7. WebSocket: emitToRoom("super_admins", "organization_created") + "overview_updated"
```

**Response mein `emailConfigured` flag** — SMTP creds nahi hain ya placeholder host ("google")
hai to UI warn karta hai ke email kabhi deliver nahi hogi.

### "Delivered" cycle (school "on-boarded" hui ya nahi)

```
Org create      → status = SETUP_PENDING   (UI: "Not delivered")
Principal ka
first login     → markDeliveredOnLogin()  (UI: "Delivered")  → org.status = ACTIVE
```

- `markDeliveredOnLogin()` **kabhi throw nahi karta** (best-effort) — delivery fail ho to login na toote
- Blocked branch/org par login possible hi nahi → status ACTIVE kabhi nahi hoga jab tak block hai
- `_effectiveOrgStatus(org)` — UI ko computed badge deta hai:
  ```
  BLOCKED (stored) > PARTIALLY_BLOCKED (koi branch BLOCKED) > ACTIVE > SETUP_PENDING
  ```

### Bulk import (Excel) — `organization.import.worker.js`

- Har row: org create (SETUP_PENDING) + `createDefaultBranch()` + admin (role ADMIN) + email
- Duplicate code → skip; duplicate username (agar custom diya) → skip
- Self-designation skip: `requesterEmail` job mein pass hota hai
- Progress: `emitToRoom("job:{jobId}", "import_progress")` — UI live progress dekhta hai
- Complete par caches clear + `overview_updated`

---

## 5. Branch Creation — Jab School Grow Kare (Ek Hi Mode)

`school.service.js` → `create()`

> Ye tab kaam aata hai jab wo school jisko aapne Organization di thi, **grow kar jaye aur
> ek naya campus/branch kholna chahe.** Ab har nayi branch ka apna ADMIN (Principal) hota
> hai — "Wahi admin manage kare" (org-level handover) mode REMOVE ho chuka hai.

1. **Email validation SCHOOL CREATE SE PEHLE** — duplicate email ho to branch half-created nahi rehti:
   `userEmailExists()` → "A user with this email already exists..."
2. School (naya branch) create (name, code, orgId, address, phone)
3. Cache bust + WS `school_created` (super_admins + org room) + `overview_updated`
4. `createBranchAdmin()` (provision.js):
   - role `"ADMIN"` (hardcoded — ab ORG_ADMIN/SUPER_ADMIN promotion nahi), schoolId = nayi branch, orgId = org
   - password auto-gen + bcrypt 12
   - self-designation check → skipEmail
   - `adminCredentialsEmail` → subject "Branch Admin / Principal Credentials",
     branded link `/login?code={schoolCode}`
5. audit CREATE_SCHOOL (adminMode detail ke saath)

**Result:** har branch ka apna alag ADMIN, apna alag access — sabse simple aur isolated setup.

### Admin re-assign (`assignAdmin` — PATCH /schools/:id/admin)

- **Hamesha "new principal" mode:** pehle purane principal ko deactivate
  (`deactivateBranchAdmins` → `isActive: false`) phir naya ADMIN create + credentials email
- Cache bust + WS `school_admin_updated`

---

## 6. Scope Isolation (Branch Data Lock)

Har staff user apni branch par locked hai — koi branch switcher nahi (ab koi org-level
admin exist nahi karta). Data isolation backend par enforce hota hai — `lib/scope.js`:

```js
getEffectiveSchoolId(user, schoolId):
    SUPER_ADMIN → schoolId REQUIRED (warna error "schoolId is required...")
    branch staff → apna hi schoolId (ignore jo bhi pass karo)
assertSchoolAccess(user, resourceSchoolId):  SUPER_ADMIN → true; warna same school check
assertOwnSchool(user, schoolId):             write operations ke liye same school check
```

> **✅ Platform SUPER_ADMIN (aap) hi ek esa role hai jo cross-branch access rakhta hai**
> (har request mein explicit `schoolId` dena parta hai) — aur wo `/admin/dashboard` platform
> console use karta hai, branch portal nahi.

---

## 7. Blocking / Deactivation — Deep (moderation.service.js)

### A. `blockOrganization` (Aap — Platform Super Admin)
```
1. org.status === "BLOCKED" → idempotent return
2. org → BLOCKED + blockedAt/Reason/ById/ByName
3. CASCADE: saari branches → BLOCKED (updateSchoolsByOrg)
4. Saare org refresh tokens revoke (revokeTokensByOrganization)
5. Cache bust + WS: super_admins overview_updated, org:{id} organization_blocked,
   har branch room organization_blocked (emitStatusToSchoolRooms)
6. audit BLOCK_ORG (reason)
```
Yehi wo action hai jo "school ka system band karna" implement karta hai — puri organization
(sab branches) lock ho jati hai.

### B. `blockSchool` (Aap — sirf ek specific branch band karne ke liye)
```
1. school.status === "BLOCKED" → idempotent
2. GUARD: agar org already BLOCKED → "Unblock the organization first"
3. school → BLOCKED + meta
4. org ACTIVE hai → PARTIALLY_BLOCKED
5. Us branch ke refresh tokens revoke (revokeTokensBySchool)
6. Cache bust + WS events (super_admins, org room school_blocked, school room school_blocked)
```

### C. `blockUser` (Aap kisi bhi branch ke user ko / Branch Admin apni branch ke staff ko)
```
_assertCanModerateStaff(requester, target):
    SUPER_ADMIN (aap) → allowed (kisi ko bhi)
    ADMIN (Principal):
        target SUPER_ADMIN  → forbidden "You cannot block a Super Admin..."
        target ADMIN        → forbidden "Branch Admins cannot be blocked by another Branch Admin"
        target.schoolId != requester.schoolId → forbidden "only ... within your own branch"
    baaki roles → forbidden
+ khud ka account block nahi kar sakta ("You cannot block your own account")
+ block → isActive false + meta + revokeTokensByUser + WS staff_status_updated + audit
```

### D. Students / Parents (blockStudent, blockParent)
- ADMIN sirf **apni branch** ke student/parent block kar sakta hai (schoolId check /
  linked students ke schoolIds check)
- Student: `isBlocked` flag; Parent: `isBlocked` flag

### E. Unblock — sab reversible
- `unblockOrganization` → org ACTIVE + saari branches ACTIVE + meta clear
- `unblockSchool` → school ACTIVE; agar **koi branch blocked na bache** → org PARTIALLY_BLOCKED se ACTIVE
- `unblockUser` → isActive true + block fields clear
- `unblockStudent` / `unblockParent` → isBlocked false

**Standard blocked message (har jagah same):**
> "Admin deactivated your portal. Please contact admin of this system."

---

## 8. Emails — Deep (kab, kisko, kaise)

**Delivery system (email.queue.js):** direct SMTP — **Redis-free**. `queueEmail()`:
3 attempts, backoff `sleep(1000 * attempt)`, **kabhi throw nahi karta** → caller ka flow
email fail hone par bhi chalta rehta hai.

| Trigger | Template | Kisko | Branded link |
|---|---|---|---|
| Org create (single) — school ko system dena | `orgCredentialsEmail` | school ke Principal ki email (self-designation skip) | `/o/{slug}` |
| Org bulk import | `orgCredentialsEmail` (viaImport) | har row ka admin | `/o/{slug}` |
| Branch create "naya principal" | `adminCredentialsEmail` | naya principal | `/login?code={schoolCode}` |
| Branch re-assign "naya" | `adminCredentialsEmail` | naya principal | `/login?code={schoolCode}` |
| Staff create / import | `staffCredentialsEmail` | staff | `/login?code=...` (agar schoolCode ho) |
| PTM event | `ptmNotification` | parents | portal notification bhi saath mein |
| Parent OTP | `sendOtpEmail` | parent email | — |
| Student OTP | `sendOtpEmail` | **parent ki email** | — |
| Admission approved | `notifyParent` | parent | — |
| Enrolled confirmation | `notifyParent` | parent | — |
| Fee receipt / reminder | `notifyParent` | parent | — |
| Auto-absent alert | `notifyParent` | parent | — |
| Late arrival alert | `notifyParent` | parent | — |

> **Staff leave requests** → email NAHI jaati. Sirf **portal notification** bheja jaata hai.
> Email sirf parent-facing notifications jaata hai.

**Self-designation rule (har jagah):** jo banda khud create kar raha hai aur apni hi email
daal raha hai → email skip (wo khud credentials jaanta hai).

**PDF attachments (wired ✅):** `email.service.js` ab `attachments` support karta hai.
`pdfService` ke teen documents email mein **attach** hote hain:

| Flow | File | Kab |
|---|---|---|
| Admission approved | `admission-slip-*.pdf` | APPROVED hone par (`_notifyApproved` ko slip pass hota hai) |
| Enrolled | `student-id-*.pdf` | QR ID card generate hone par |
| Fee payment | `fee-receipt-*.pdf` | Har payment record par |

Chain: `pdfService.{admissionSlip|studentIdSlip|feeReceipt}` → buffer →
`notificationService.notifyParent({ attachments })` → `_sendEmail` → `queueEmail` →
nodemailer `attachments: [{ filename, content }]`.

**Branded login ka raaz:** link `/o/{slug}` ya `/login?code={code}` par login page
`GET /api/v1/schools/branding?code=...&slug=...` (SchoolService.getBranding) call karta hai —
branch logo → org logo fallback, **theme color org ka `themeColor`** (fallback #2563eb) —
taake generic login na dikhe, har school ka apna branded login lage.

**Per-org theming (wired ✅):** `Organization.themeColor` (hex) — org create/edit form par
**color picker** se set hota hai; `getBranding()` org ka color return karta hai; `LoginHubPage`
`applyOrgThemeToRoot(themeColor)` call karta hai jo CSS `--color-primary-*` vars override karta hai —
poore login hub UI par theme apply hota hai. Jab `themeColor` null ho → `DEFAULT_THEME = '#6366f1'`
(indigo) apply hota hai. BrandPanel left side par inline gradient use karta hai.

**LinkedIn-style notifications:** Bell dropdown (`NotificationItem`), super admin notifications page,
branch admin notifications page — sab jagah unread items par full theme color bg + white text,
read items par subtle `rgba(themeColor, 0.06)` tint. Bell badge bhi theme color use karta hai.

**Notification channel (notification.service.js):** primary **Email**, WhatsApp API budget
nahi hai to email; har parent notification `notificationLog` mein bhi record hota hai
(`/notifications/logs`).

### 8.1 Cloudinary — Branch-Level Credentials

- `OrgSecrets` table: `schoolId?` (null = org level default), `category` (SMTP|CLOUDINARY),
  `tier` (PRIMARY|SECONDARY), `data` JSON — branch-level credentials store karta hai
- **Resolution order:** branch override (`schoolId` match) → org default (`schoolId=null`) → platform env
  (sirf super admin ke liye)
- **School documents (student photos, avatars, logos)** kabhi platform env Cloudinary use NAHI karte
  — sirf branch/org credentials ya local disk

---

## 9. Background Jobs & Schedulers — Deep

### BullMQ queues (Redis required)

| Queue | Worker | Concurrency | Kaam |
|---|---|---|---|
| `organization-import` | organization.import.worker.js | 1 | Excel se orgs + default branches + admins |
| `organization-delete` | organization.delete.worker.js | 2 | Pura org cascade delete |
| `school-import` | school.import.worker.js | — | Excel se branches |
| `staff-import` | staffImport.queue.js | — | Staff bulk import (emails direct SMTP) |
| `student-import` | studentImport.queue.js | — | Students bulk import |

**⚠️ Upstash quota:** free tier (500k req/month) BullMQ polling + caching se khatam hua tha —
workers par `drainDelay: 15` (idle polling 5s → 15s, 3x kam). Agar quota phir khatam →
**email phir bhi chalegi** (SMTP direct), lekin imports/caching fail ho sakte hain.

### node-cron schedulers (scheduler.service.js)

| Cron | Time | Job | Kya karta hai |
|---|---|---|---|
| `30 8 * * 1-6` | 8:30 AM Mon-Sat | `autoAbsent.job.js` | Har school ke ACTIVE students jo aaj bhi unscanned → **ABSENT record** + parent email + WS `auto_absent_completed` |
| `0 9 * * *` | 9:00 AM daily | `feeReminder.job.js` | `runOverdueSweep()` (past-due → OVERDUE) + `sendReminders()` (unpaid/partial/overdue ko email) |

---

## 10. Delete Flows — Deep

### Organization delete (background, `organization.delete.worker.js`)

```
1. Org exists? nahi → return { deleted: false }
2. Pehle saare logo URLs collect (org + branches) — data wipe se pehle
3. $transaction (children → parents order, RESTRICT FKs na tootein):
     • Aapka (platform SUPER_ADMIN) account DETACH: organizationId = null  ← aap kabhi delete nahi hote
     • substituteRecord → timetableSlot → examResult → conductRemark → feePayment →
       feeRecord → feeLineItem → feeStructure → homeworkBroadcast → attendanceRecord →
       attendanceScan → scanDevice → promotionRecord → applicant → activity → circular →
       ptmSession → notificationLog → exam → term → academicYear → subject → section →
       class → student → user (branch staff, Principal included) → parent (orphan) → school → organization
4. audit DELETE_ORG (actor job payload se — requester ka naam/IP)
5. Redis caches clear
6. Storage se logos delete (Set se dedupe — single-branch org ka synced logo ek hi baar)
```

### Branch delete (`school.service.js` → `remove()`)

- Double-click protection (`findUnique` confirm)
- Ek transaction mein poora branch subtree (upar wala order, schoolId filter ke saath)
- Logo cleanup guard: agar branch logo org ke same Cloudinary asset par hai (single-branch
  sync) → delete NAHI (wo ab org ka apna logo hai)

---

## 11. Business Flows (Roz ka kaam) — Deep

### 11.1 Admission pipeline (admission.service.js)

```
INQUIRY → TEST_SCHEDULED → TEST_PASSED / TEST_FAILED → FORM_SUBMITTED
       → APPROVED → FEE_PENDING → ENROLLED
                     (REJECTED kabhi bhi)
```

- `createInquiry` — applicant banata hai (classId apne school ka hona zaroori)
- `updateStatus` — valid transitions enforce; `ENROLLED` isko direct nahi — dedicated `enroll` endpoint
- `approve` — APPROVED + **admission slip PDF** (`ADM-{id[0:8]}`, advance fee amount,
  due date +7 din) + parent email
- `recordAdvanceFee` — advance fee PAID → status FEE_PENDING (agar APPROVED tha)
- `enroll` — **(deep details):**
  1. Applicant APPROVED/FEE_PENDING/FORM_SUBMITTED/TEST_PASSED hona zaroori
  2. Section applicant ke school ka hona zaroori
  3. **Roll number duplicate check** branch ke andar
  4. **Parent upsert** (upsertParent) — ek parent record kai bachchon ko hold kar sakta hai (siblings)
  5. `generateIdentifierCode()` → `ID-{12 hex chars UPPERCASE}` (QR value; future RFID same field)
  6. Student create (ACTIVE) + applicant → ENROLLED + advanceFeeStatus
  7. **QR ID card PDF** (`ID-{student.id[0:8]}`)
  8. Confirmation email + WS `admission_enrolled`

### 11.2 Attendance — Gate scan (attendance.service.js)

```
POST /attendance/scan  (identifierCode, deviceId, method)
   │
   ├─ 1. Student by identifierCode dhundo → nahi mila: "No student record found..."
   ├─ 2. status !== ACTIVE → scan disallowed
   ├─ 3. Branch isolation: requesterSchoolId != student.schoolId → forbidden
   ├─ 4. AttendanceScan record (har scan, even duplicates)
   ├─ 5. AttendanceRecord upsert (date = scan ke din):
   │     • pehla scan  → CHECK_IN: scanTime > 8:30 cutoff → LATE (parent alert) warna PRESENT
   │     • record hai par checkIn null (auto-absent job ne ABSENT mark kiya tha, phir late scan aya)
   │                   → status convert LATE/PRESENT + checkIn set ("Check-in recorded after auto-absent job")
   │     • doosra scan → CHECK_OUT: checkOut set
   ├─ 6. WS emitToRoom("school:{id}", "gate_scan_event", payload) → Live Gate View
   └─ 7. Return { scanType, status, checkIn/Out, student, parentContact }
```

- `syncOfflineScans` — offline device ka bulk sync (har scan try, per-item result)
- `manualOverride` — teacher/gate manual mark (upsert)
- `markSectionBulkAttendance` — teacher poore section ka bulk
- Daily report Redis cache: `attendance:daily:{schoolId}:{date}` 5 min TTL

### 11.3 Fees (fee.service.js)

1. **FeeStructure** — class + academicYear aware, lineItems (title + amount)
2. `generateMonthlyFees` — active students (section/class/poora school) ke liye **monthly records**:
   - totalAmount = lineItems sum, dueDate = month ka `dueDay` (default 10)
   - **already existing record skip** (idempotent — dobara generate karne par duplicates nahi)
3. `recordPayment` — payment create → paidAmount += → status recompute:
   `newPaid < total → PARTIAL`, `>= total → PAID`
   - **Receipt PDF** (`RC-{payment.id[0:8]}`) + parent email (balance ke saath) + WS
4. Scheduler daily: overdue sweep (past-due unpaid → OVERDUE) + reminders email

### 11.4 Academic setup chain

```
School → AcademicYear → Term → Exam (+ ExamResult)
      → Class → Section → Subject
      → Timetable (section → slots; teacher view)
      → Homework (broadcast), Conduct (remarks), Circular, PTM Session, Activity
```
Har nested entity par `schoolId` scope check (`assertOwnSchool` / `assertSchoolAccess`).

### 11.5 Promotions (promotion.service.js)

`bulk-promote` / `repeat` / `transfer-section` / `graduate` / `dropout` — student records
par status change + `PromotionRecord` history. (Management role = SUPER_ADMIN, ADMIN)

- `bulk-graduate` / `bulk-dropout` — bulk-set all ACTIVE students in a section to GRADUATED/DROPPED_OUT (for last-class sections)
- `rollbackLifecycle` — reactivate GRADUATED/DROPPED_OUT/TRANSFERRED_OUT → ACTIVE, reopens parent portal, creates `REACTIVATED` PromotionRecord for audit trail. Management only.
- `REACTIVATED` PromotionAction added for rollback audit trail

### 11.6 Organization Public Pages (slug ke saath) — Design Ready, Baqi

> Har **organization with slug** ke **apne public pages** honge — log admission ke liye
> school ke paas aate hain, unhe branded public form chahiye. Data **DB se dynamic**
> aayega (kuch hardcode nahi).

| Page | URL | DB se data | Kaam |
|---|---|---|---|
| **Org Landing** | `/o/{slug}` | org logo/name/code, branches (name/code/logo/address), themeColor | Logo + naam + branch cards + "Admission" + "Admin Login" |
| **Admission Form** | `/o/{slug}/admission` | branch list | Student/parent fields → submit → `Applicant` row → branch admin ko alert |

**Abhi:** `/o/{slug}` → `OrgSlugRedirect` → `/login?org={slug}` (seedha login).
**Baqi:** `/o/:slug` par landing page + `/o/:slug/admission` par form — branding
`GET /schools/branding?slug=` (public, ready) se, admission backend `src/modules/admission/*`
ready hai. TODO: `docs/ORG_ADMIN_FLOW_TODO.md` #0.

---

## 12. Caching & Realtime Map

| Redis key | TTL | Kab bust hota hai |
|---|---|---|
| `orgs:all` | 1h | org/school create-update-delete, block/unblock, import complete |
| `org:{id}` | 1h | org update/delete, school delete, block/unblock |
| `superadmin:overview` | 120s | har org/school/branch/student-affecting action, first-login delivery |
| `schools:all`, `schools:org:{id}` | 5min | school create/update/delete, admin re-assign |
| `school:{id}` | 5min | school update, admin re-assign |
| `attendance:daily:{schoolId}:{date}` | 5min | har scan/override ke baad |

**WebSocket rooms:**
- `super_admins` — platform-wide events (org create, overview updates)
- `org:{id}` — org-level events (org block/unblock, school updates within org)
- `school:{id}` — branch-level events (gate scan, attendance, staff status)
- `section:{id}` — section-level events
- `job:{jobId}` — import progress (BullMQ jobs par live progress), **SUPER_ADMIN/ADMIN only**

**Staff socket:** `useSocket` hook → `connectSocket(schoolId, organizationId)` from `DashboardLayout`

**Parent/Student socket:** `usePortalSocket(sectionIds, schoolId)` → joins section + school rooms
- Portal socket reads correct token: `studentToken || parentToken || accessToken`

**Events:**
- `portal_notification_created` — naya portal notification
- `portal_notifications_read` — notifications mark as read
- `portal_notifications_deleted` — notifications delete
- `portal_all_read` — saare notifications mark as read

**`leave_room` event handled** (cleanup — socket disconnect par room leave)

Har realtime event ke baad frontend data refetch karta hai — status pill, badges,
gate live view, import progress sab live update hote hain.

---

## 13. Frequently Confused Points — Corrected & Deep

| Sawal | Jawab (aapke model ke mutabiq) |
|---|---|
| "SUPER_ADMIN kitne hain?" | **Sirf EK — aap (platform owner).** `organizationId = null`, seed se banta hai |
| "Org create par jo user banta hai wo kya hai?" | Us school ka **default branch ka ADMIN (Principal)** — role ADMIN, schoolId = "Main Campus". **Ye aap (SUPER_ADMIN) nahi ho, aur na hi koi doosra SUPER_ADMIN hai** |
| "Kisi school ko system dena ho to kya karte hain?" | Us school ke liye **Organization create** karte hain — ye automatically default branch + Principal (ADMIN) bhi bana deti hai. Principal ko credentials email chali jati hai |
| "Organization ka faida kya hai (agar abhi ek hi branch hai)?" | **Future-proofing.** Agar wo school aage chal kar zyada campuses khole, to naye branches isi Organization ke andar add ho jate hain — poora setup dobara nahi karna padta |
| "2nd branch par naya admin kaise?" | Branch create par **"Naya Principal banao"** (default/recommended) — naya ADMIN + uski apni credentials email |
| "2nd branch wahi admin manage kare?" | Ab **ye option nahi hai** — "Wahi admin manage kare" (org-level handover) REMOVE ho chuka hai. Har branch ka apna ADMIN (Principal) hota hai. Agar pehla principal nayi branch bhi manage kare, to usse wahan naye principal ke roop mein re-assign karein |
| "Staff login par password kya hota hai?" | Diya gaya password; **imported staff jinka password set nahi** → school code hi default password (case-insensitive fallback). **Ab portal password bhi accept hota hai** — individual bcrypt → portal password → school code |
| "Parent portal mein kitne bachche dikhenge?" | Saare linked children (siblings) — sibling selector se switch. Student portal mein sirf khud ka data |
| "Portal login kaise hota hai?" | 2 tarike: (1) Direct — school code + phone/roll + portal password, (2) OTP — WhatsApp par OTP. Dono 30-day JWT dete hain |
| "Portal ka shared password kya hai?" | Default = school code. Branch admin Settings → Portal Access se custom set kar sakta hai |
| "Portal mein kaun kaun si cheezein dikhengi?" | 14 tabs: overview, attendance, fees, homework, materials, notices, results, exams, timetable, conduct, PTM, leave, notifications, profile |
| "Portal routes kaise kaam karte hain?" | Saare `/portal/*` routes `authenticateAnyPortal` middleware use karte hain — parent ya student JWT dono accept hote hain |
| "Org 'Not delivered' kab 'Delivered'?" | **Pehli baar Principal ke login karne par** (SETUP_PENDING → ACTIVE, `markDeliveredOnLogin`). Blocked rehne tak kabhi nahi |
| "Branch block par kya hota hai?" | Us branch ke users lock + org PARTIALLY_BLOCKED + us branch ke sessions revoke |
| "Org block par?" | Poori school (saari branches) cascade BLOCKED + sab roles lock + poore org ke sessions revoke — matlab "system band" |
| "Blocked user ko kya dikhta hai?" | Standard message (har jagah same): "Admin deactivated your portal. Please contact admin of this system." |
| "Branch admin (Principal) kise block kar sakta hai?" | Apni branch ke TEACHER/RECEPTIONIST. **Kisi doosre ADMIN ko nahi, SUPER_ADMIN (aap) ko nahi, khud ko nahi** |
| "Org delete par admin account?" | **Aapka (platform SUPER_ADMIN) account kabhi delete nahi hota** — detach hokar bach jata hai (organizationId null). Baaki sab (Principal included) cascade delete |
| "Email kyun nahi jati jab khud banata hun?" | Self-designation rule — apni hi email par credentials email skip |
| "Ek hi login se 2 branches kaise?" | Ab possible nahi — koi org-level admin nahi hai. Har branch ka apna ADMIN (Principal) hota hai, apna login/apna access. Branch switcher frontend se bhi hata diya gaya hai |
| "Refresh token kab invalid hota hai?" | Use hone par (rotation), logout, logout-all, password change, ya org/school/user block par |

---

## 14. Quick References

**API surface (322 routes)** — `API_ROUTES.md` mein full table. Key groups:
- Auth (35): login, refresh, me, logout(-all), change-password, users CRUD, parent/student OTP + direct login, switch-branch, assign-branch
- Organizations (14), Schools (15) — SUPER_ADMIN / MANAGEMENT (incl. export, branding, logo, portal-password)
- Academic (26) — years/terms/classes/sections/subjects
- Students (12), Admissions (19), Fees (25), Attendance (19), Homework (5), Exams (10),
  Conduct (8), Circulars (4), PTM (5), Timetable (12), Activities (5), Notifications (8),
  Moderation (10), Audit (2), Promotions (10), Leave (7), Teaching Assignments (5)
- **Portal (17)** — parent/student dashboard routes (overview, attendance, fees, homework, materials, notices, results, exams, timetable, conduct, PTM, leave, study-material, timetable-pdf, exam-date-sheet, profile)
- SMTP (4), Storage (3), Staff Leave (8), Staff Attendance (11), Documents (6), Study Material (5)
- Infra (3): `/health`, `/ready`, `/metrics`

**Admin console pages (current):** Dashboard, Organizations (+ create/detail), Branches,
Users (**+ Create User**), Import Data, Activity Log, **Notifications** (delivery logs),
Settings (**Platform tab** — delivery status).

**Dev commands**
```bash
cd Backend && npm run dev          # backend :3000
cd frontend && npm run dev         # frontend :5173
cd Backend && npx prisma db seed   # superadmin@schoolerp.com / superadmin123
cd frontend && npm run build && npm run lint
```

---

## 15. Known Issues / Risks (Super Admin & Org-level scope)

Ye woh issues hain jo aapke model (sirf 1 SUPER_ADMIN, Organization = school container) ke
sath kaam karte waqt dhyaan mein rakhne chahiyein:

1. **`assertSchoolAccess` mein organizationId check nahi hai** (`lib/scope.js`) — ye sirf
   `role === SUPER_ADMIN` dekhta hai. Aapke liye (platform SUPER_ADMIN) ye sahi hai — aap
   hi ek cross-branch role hain. Branch principals hamesha apni branch par locked hain.
2. **Org-level admin concept remove ho chuka hai** — `20260817000400_remove_org_admin_role`
   migration ne ORG_ADMIN users ko unke org ki pehli branch ka ADMIN bana diya (unka
   `schoolId` null tha — ab pehli branch se linked hain). Agar koi aisa user branch na
   milne ki wajah se orphan reh gaya ho, to use manually branch assign karein.

---

## 16. Source Map (is document mein kya kahan se aya)

| Flow | File(s) |
|---|---|
| Roles, ROLE_GROUPS, JWT/OTP, BLOCKED_MESSAGE | `Backend/src/constants.js` |
| Login, tokens, OTP, user mgmt | `Backend/src/modules/auth/auth.service.js`, `repository.js`, `auth.dto.js` |
| Org create, effective status, delivery, overview | `Backend/src/modules/organization/organization.service.js` |
| Default branch, unique code, branch admin create | `Backend/src/modules/organization/provision.js` |
| Branch create (naya principal mode), admin re-assign, delete | `Backend/src/modules/school/school.service.js`, `repository.js`, `logoSync.js` |
| Blocking/unblocking (org/school/user/student/parent) | `Backend/src/modules/moderation/moderation.service.js` |
| Admission pipeline + enroll | `Backend/src/modules/admission/admission.service.js` |
| Gate scan, offline sync, bulk marking, daily report | `Backend/src/modules/attendance/attendance.service.js` |
| Fee structures, monthly generation, payments, reminders | `Backend/src/modules/fee/fee.service.js` |
| Scope guards (branch isolation) | `Backend/src/lib/scope.js` |
| QR identifier | `Backend/src/lib/identifier.js` |
| Email delivery (SMTP direct, retries) | `Backend/src/services/email.service.js`, `email.templates.js`, `jobs/queues/email.queue.js` |
| Import workers + org delete worker | `Backend/src/jobs/workers/*.js` |
| Cron schedulers | `Backend/src/services/scheduler.service.js`, `jobs/autoAbsent.job.js`, `jobs/feeReminder.job.js` |
| Role home path, active school | `frontend/src/lib/utils/index.ts`, `store/slices/authHelpers.ts` |
