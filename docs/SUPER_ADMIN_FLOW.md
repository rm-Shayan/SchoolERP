# Super Admin Flow — Complete (Code-Verified, Updated 1 Sep 2026)

> Super Admin ka poora flow — kaun hai, kahan login karta hai, console mein kya kya karta hai,
> org/branch/user kaise manage karta hai, block/unblock kaise hota hai. Backend + frontend code
> se verify kiya gaya hai (exact behavior, guess nahi).

---

## 1. Super Admin Kaun Hai? (Sirf 1 Level)

| Level | `organizationId` | Kaise banta hai | Kahan jata hai login par |
|---|---|---|---|
| **Platform Super Admin** | `null` | Seed script se **sirf 1**: `superadmin@schoolerp.com` | `/admin/dashboard` (Admin Console) |

> **Pehle ek "Org-level Super Admin" (ORG_ADMIN) concept tha** — branch handover promotion
> se ek Principal saari branches manage karta tha. **Ab wo REMOVE ho chuka hai**
> (`20260817000400_remove_org_admin_role` migration): ORG_ADMIN role exist nahi
> karta, har branch ka apna ADMIN (Principal) hota hai.

**Ek line mein:** Super Admin = sirf aap (platform owner, 1 hi). Har org/branch ka apna
ADMIN (Principal) hota hai — SUPER_ADMIN koi aur nahi banta.

---

## 2. Login Flow (Platform Super Admin)

```
/admin/login (SuperAdminLoginPage)
   |  email + password
   |  ("Forgot password?" -> /forgot-password — temp password email par)
   v
POST /api/v1/auth/login
   1. findByEmail(email)                      <- sirf email (school code nahi chahiye)
   2. isActive check                          -> "Your account has been deactivated..."
   3. org/school BLOCKED check                -> standard block message
   4. bcrypt password verify
   5. access (15m) + refresh (7d, rotating) tokens
   6. audit LOGIN
   v
getRoleHomePath(role) -> SUPER_ADMIN hamesha /admin/dashboard
```

**Guard:** seed se platform admin `organizationId = null` hota hai — isliye agar koi org
delete ho jaye to aapka account bach jata hai (detach: `organizationId: null`).

---

## 3. Admin Console — Pages & Kaam (Frontend Routes)

| Page | Route | Kya hota hai |
|---|---|---|
| Dashboard | `/admin/dashboard` | Platform stats: total orgs, branches, students, revenue, growth trend, status counts |
| Organizations | `/admin/organizations` | Saari orgs — list/grid, status badges, block/unblock, naya org |
| Create Organization | `/admin/organizations/new` | Single org create form |
| Org Detail | `/admin/organizations/:id` | KPIs: branches, staff, students, revenue + block/unblock + Add Branch |
| Branch Detail | `/admin/organizations/:orgId/schools/:schoolId` | Branch info + admin reassign + block/unblock + **branch logo upload** |
| Branch Students | `/admin/organizations/:orgId/schools/:schoolId/students` | Us branch ke students |
| Branches | `/admin/branches` | Saari branches platform-wide, org filter, status badges, block/unblock |
| Users | `/admin/users` | Platform-wide staff directory — stats by role, filters, profile modal, **Export CSV**, block/unblock |
| Import Data | `/admin/import` | Org + Branch bulk import (Excel) — live progress via WebSocket |
| Activity Log | `/admin/activity` | Audit trail — kisne kya kiya, kab, kahan se + **Export CSV** |
| Settings | `/admin/settings` | Profile, avatar, password change, **Platform tab** (notification delivery status) |
| Notifications | `/admin/notifications` | Notification logs table + filters + pagination |
| **School Health** | `/admin/health` | **Two-level view: org cards → branch details with health badges** |
| **Branch Settings** | `/admin/branch-settings` | **SMTP/Cloudinary config per branch with org name (immutable) + branch dropdown** |

---

## 4. Organization Management (Core Flow)

### 4.1 Single Create (`POST /api/v1/organizations`)

```
Form: Name, Code, Logo, AdminEmail (+ optional adminName/username/password/phone)
   |
   +-- Validations: code unique, slug unique (slug code/name se auto)
   +-- Org create -> status SETUP_PENDING ("Not delivered")
   +-- Default branch auto: "{name} Main Campus", code "{CODE}-01" (collision par -02...)
   +-- Admin create: role ADMIN (Principal), orgId + schoolId = default branch
   |     password auto: hex + "A1!" (bcrypt 12)
   +-- Email (agar adminEmail diya ho):
   |     School Code + Email + Username + Password + branded link /o/{slug}
   +-- Redis cache bust + WebSocket organization_created + overview_updated
   +-- **Portal notification** + **Org created notification** to super admin
```

**"Delivered" cycle:** create par `SETUP_PENDING` -> **pehli login par** `ACTIVE`
(`markDeliveredOnLogin`). UI badge: Not delivered -> Delivered.

### 4.2 Bulk Import (Excel)

- BullMQ queue (`organization-import` worker)
- Har row: org + default branch + admin (role ADMIN) + credentials email
- Duplicate code / duplicate username -> skip (count ke saath report)
- Progress: WebSocket `job:{jobId}` -> `import_progress` / `import_completed`

### 4.3 Block / Unblock Org

```
blockOrganization:
   org -> BLOCKED + reason/meta
   CASCADE: saari branches -> BLOCKED
   Poore org ke refresh tokens revoke -> sab log-out
   Cache bust + WS (org room + har branch room) + audit
   **Portal notification** to super admin

unblockOrganization:
   org -> ACTIVE, saari branches -> ACTIVE, meta clear (reversible)
   **Portal notification** to super admin
```

### 4.4 Org Delete (background job)

- `organization-delete` worker — ek transaction mein **poore org ka data** delete
- **Platform SUPER_ADMIN bachta hai** (detach: `organizationId: null`)
- Logos storage se delete + caches clear

---

## 5. Branch Management

### 5.1 Branch CRUD UI (Frontend)

**Add Branch Modal:**
```
+-- Org picker dropdown (sare orgs dikhte hain)
+-- Branch name, code, address, phone
+-- Admin fields: name, email, password, phone
+-- Form validation (required fields, inline errors)
+-- Submit -> POST /api/v1/schools
```

**Edit Branch Modal:**
```
+-- Editable fields: name, code, address, phone
+-- Form validation
+-- Submit -> PATCH /api/v1/schools/:id
```

**Delete Branch:**
```
+-- Confirmation dialog
+-- Submit -> DELETE /api/v1/schools/:id
```

### 5.2 Branch Create (`POST /api/v1/schools`)

| Mode | Kya hota hai | Email |
|---|---|---|
| **"Naya Principal banao"** (sirf yehi) | Naya `ADMIN` user — us branch ka apna principal | Naye principal ko credentials |

**SMTP/Cloudinary (Non-blocking):**
```
Branch create
  -> SMTP credentials save (skip verification if SKIP_CREDENTIAL_VERIFICATION=true)
  -> Cloudinary credentials save (skip verification if SKIP_CREDENTIAL_VERIFICATION=true)
  -> If verification fails -> warnings in toast (branch still created)
  -> User can retry from Settings -> SMTP later
```

### 5.3 Re-assign Branch Admin (`PATCH /schools/:id/admin`)

- Purana principal pehle deactivate (`isActive: false`), phir naya ADMIN create + credentials email
- Cache bust + WS `school_admin_updated`

### 5.4 Block / Unblock Branch

```
blockSchool: branch -> BLOCKED; org ACTIVE hai to -> PARTIALLY_BLOCKED
             us branch ke sessions revoke
             **Portal notification** to super admin
unblockSchool: branch -> ACTIVE; agar koi branch blocked na bache -> org ACTIVE
               **Portal notification** to super admin
```

### 5.5 Branch Delete (`DELETE /schools/:id`)

- Ek transaction mein poora branch subtree
- Logo delete (guard: single-branch org ka synced logo na marein)

---

## 6. School Health Page (Redesigned)

### 6.1 Two-Level View

**Level 1 — Organization Cards:**
```
+-----------------------------------+  +-----------------------------------+  +-----------------------------------+
|  Oxford Academy                   |  |  Falcon Academy                   |  |  Beta Institute                   |
|  8 branches · 2 issue(s)         |  |  5 branches · 0 issue(s)         |  |  3 branches · 3 issue(s)         |
|  Blocked: 1  No Admin: 1         |  |  All Healthy                     |  |  Blocked: 2  No Admin: 1         |
|  Zero Staff: 0                   |  |                                  |  |  Zero Staff: 0                   |
|  [View Branches ->]              |  |  [View Branches ->]              |  |  [View Branches ->]              |
+-----------------------------------+  +-----------------------------------+  +-----------------------------------+
```

**Level 2 — Org Branch Details (click karne pe):**
```
<- All Organizations
Oxford Academy
8 branches · 2 issue(s)

+-----------------------------------------------------------+
| Total: 8  |  Healthy: 6  |  Blocked: 1  |  Issues: 1    |
+-----------------------------------------------------------+

All Branches (8 branches)
---------------------------------------------
🔴 Gulshan Campus (GULSHAN-01)     [Blocked]  View ->
🟡 DHA Campus (DHA-01)            [No Admin] View ->
🟢 Saddar Campus (SADDAR-01)      [Healthy]  View ->
🟢 Clifton Campus (CLIFTON-01)    [Healthy]  View ->
...
```

### 6.2 Health Query Logic

```javascript
// Backend: organization.repository.js
// Admin detection: schoolId OR branchAccess
noAdmin = school NOT IN (
  SELECT DISTINCT s2."schoolId" FROM "User" s2
  WHERE s2."schoolId" IS NOT NULL AND s2.role = 'ADMIN'
  UNION
  SELECT DISTINCT value::text FROM "User" s3,
    jsonb_array_elements_text(COALESCE(s3."branchAccess", '[]'::jsonb))
  WHERE s3.role = 'ADMIN'
)
```

### 6.3 Health Banner

- Solid `#6D28D9` color (matching super admin portal theme)
- Org logo (if available) + org name + branch count + healthy count
- Status badge: "All Healthy" (green) or "X issue(s)" (amber)

---

## 7. User Management (Platform-wide)

### 7.1 Users Page (`/admin/users`)

- `GET /auth/users` platform-wide directory + stats by role
- Filters: search, role, status, block reason
- Profile modal, **Export CSV**, block/unblock with reason dialog
- **Create User** button + modal (branch selector + role + creds)

### 7.2 Block User Rules (hierarchy guardrails)

```
SUPER_ADMIN (platform) -> kisi ko bhi block kar sakta hai
ADMIN (branch)         -> sirf apni branch ke TEACHER/GATE_STAFF/ACCOUNTANT/RECEPTIONIST
block hone par: isActive=false + meta + saare sessions revoke
unblock: isActive=true + meta clear
```

---

## 8. Notification System

### 8.1 Portal Notifications

| Route | Method | Description |
|---|---|---|
| `/notifications/portal/list` | GET | Paginated notification list |
| `/notifications/portal/unread-count` | GET | Unread count for bell badge |
| `/notifications/portal/:id/read` | PATCH | Mark single as read |
| `/notifications/portal/read-all` | PATCH | Mark all as read |
| `/notifications/portal/send-from-super-admin` | POST | Announcement + email to target admins |

### 8.2 Super Admin Self-Notifications

Super admin ko apne actions ka notification milta hai:

| Action | Notification |
|---|---|
| Branch create | "Branch 'X' has been created" |
| Branch delete | "Branch 'X' has been permanently deleted" |
| Branch block | "Branch 'X' has been blocked" |
| Branch unblock | "Branch 'X' has been unblocked" |
| Org create | "Organization 'X' has been created successfully" |
| Org block | "Organization 'X' has been blocked" |
| Org unblock | "Organization 'X' has been unblocked" |

### 8.3 Announcement Flow

```
Super admin fills announcement form
  -> Select target: All Orgs / Specific Org / Specific Branch
  -> Select recipients: Org Admins / Branch Admins
  -> Click "Send Notification"

Target admins receive:
  1. Portal notification (bell icon) ✅
  2. Email (inbox) ✅
```

### 8.4 Notification Form

- Org dropdown (all orgs loaded from API)
- Branch dropdown (filtered by selected org)
- Message type: circular, announcement, alert
- Title + message body
- Target audience: org admins, branch admins, all staff

---

## 9. Storage & SMTP Configuration

### 9.1 Tenant-First Failover Chain

**Cloudinary:**
```
Branch Cloudinary creds? -> Use branch Cloudinary
  -> Org Cloudinary creds? -> Use org Cloudinary
    -> Platform Cloudinary env? -> Use platform Cloudinary
      -> Local disk fallback
```

**SMTP:**
```
Branch PRIMARY SMTP? -> Use branch SMTP
  -> Org PRIMARY SMTP? -> Use org SMTP
    -> Org SECONDARY SMTP? -> Use org secondary SMTP
      -> Platform env SMTP -> Use platform SMTP
```

### 9.2 SKIP_CREDENTIAL_VERIFICATION

```env
# Backend .env — for dev/test only
SKIP_CREDENTIAL_VERIFICATION=true
```

- Skips SMTP `transporter.verify()` and Cloudinary `api.ping()` checks
- Credentials save as `isVerified: true` without real verification
- **Production:** Remove or set `false` — real verification runs

### 9.3 Organization ID Tracking

All file uploads correctly pass `organizationId`:
- `storageService.uploadImage({ buffer, folder, organizationId })`
- `_tenantCallOptions` resolves tenant creds from `organizationId`
- Each org uses its own Cloudinary account

---

## 10. Circulars & Activity

### 10.1 Circulars (with eventDate)

```prisma
model Circular {
  id        String    @id
  schoolId  String
  title     String
  content   String
  mediaUrl  String?
  audience  Json?     // WHOLE_SCHOOL, CLASS_RANGE, SECTIONS, STUDENT
  eventDate DateTime? // NEW — optional for event-type announcements
  // ... timestamps
}
```

- `eventDate` is optional — use for Sports Day, Annual Day, etc.
- Activity-style events now go through Circulars

### 10.2 Activity Table (Activity Detection)

```prisma
model Activity {
  id          String    @id
  schoolId    String
  title       String
  description String?
  eventDate   DateTime?
  // ... timestamps
}
```

- Kept for activity detection/logging
- CRUD endpoints exist (`/activities/schools/:schoolId`)
- Separate from Circulars (which handle announcements)

---

## 11. Import Data

| Import | Route | Queue | Progress |
|---|---|---|---|
| Organizations (Excel) | `POST /organizations/import-excel` | `organization-import` | WebSocket live |
| Branches (Excel) | `POST /schools/import-excel` | `school-import` | WebSocket live |
| Staff (Excel) | `POST /auth/users/import` | `staff-import` | — |
| Students (Excel) | `POST /students/schools/:schoolId/import` | `student-import` | — |

**Templates:** `.xlsx` downloads with importer ke columns.

---

## 12. Activity Log (Audit Trail)

Har important action `auditService.record()` se log hota hai:
- **Actions:** CREATE_ORG, UPDATE_ORG, DELETE_ORG, BLOCK_ORG, UNBLOCK_ORG, CREATE_SCHOOL,
  UPDATE_SCHOOL, DELETE_SCHOOL, ASSIGN_SCHOOL_ADMIN, BLOCK_SCHOOL, UNBLOCK_SCHOOL,
  CREATE_STAFF, UPDATE_STAFF, BLOCK_USER, UNBLOCK_USER, LOGIN, LOGOUT
- **Har entry:** kisne (actorId/name/role), kya (action/entity), kab (timestamp), kahan se (IP),
  details (reason, changes)
- **CSV Export:** Activity Log page par "Export CSV" button — current filters apply hote hain download mein
- **Backend:** `GET /audit-logs` (list with pagination) + `GET /audit-logs/export` (CSV download, max 5000 rows)

---

## 13. Source Map

| Flow | File |
|---|---|
| Login, tokens, users, forgot-password | `Backend/src/modules/auth/auth.service.js` |
| Org create/delivery/overview/health | `Backend/src/modules/organization/organization.service.js` |
| Org health query (branchAccess check) | `Backend/src/modules/organization/organization.repository.js` |
| Default branch + branch admin | `Backend/src/modules/organization/provision.js` |
| Branch create/delete/admin re-assign | `Backend/src/modules/school/school.service.js` |
| Branch logo sync | `Backend/src/modules/organization/organization.service.js` |
| Block/unblock + notifications | `Backend/src/modules/moderation/moderation.service.js` |
| Portal notifications (list, unread, send) | `Backend/src/modules/notification/notification.portalService.js` |
| Announcement emails | `Backend/src/modules/notification/notification.controller.js` |
| Email templates (announcement) | `Backend/src/services/email.templates.js` |
| Storage service (tenant-first) | `Backend/src/services/storage.service.js` |
| SMTP settings (verification skip) | `Backend/src/modules/smtpSettings/smtpSettings.service.js` |
| Cloudinary settings (verification skip) | `Backend/src/modules/storageSettings/storageSettings.service.js` |
| Audit | `Backend/src/modules/audit/` |
| Import workers | `Backend/src/jobs/workers/` |
| Health page (frontend) | `Frontend/src/features/superadmin/components/SchoolHealthDashboard.tsx` |
| Health org cards | `Frontend/src/features/superadmin/components/parts/OrgHealthCard.tsx` |
| Health org detail | `Frontend/src/features/superadmin/components/parts/HealthOrgDetail.tsx` |
| Health banner | `Frontend/src/features/superadmin/components/parts/HealthBanner.tsx` |
| Branch CRUD (useBranchesPage) | `Frontend/src/features/superadmin/components/parts/useBranchesPage.ts` |
| Notification form | `Frontend/src/features/superadmin/components/SendNotificationForm.tsx` |
| Notification menu (bell) | `Frontend/src/layouts/parts/NotificationMenu.tsx` |
| Logo component (fallback chain) | `Frontend/src/components/ui/Logo.tsx` |
| Branch analytics (backend) | `Backend/src/modules/school/repository.js` |
| Branch analytics (frontend) | `Frontend/src/features/superadmin/components/parts/BranchAnalyticsSection.tsx` |
| Org analytics (frontend) | `Frontend/src/features/superadmin/components/parts/EnrollmentChart.tsx`, `AttendanceRateChart.tsx`, `FeeSummaryCard.tsx` |
| Branch settings page | `Frontend/src/features/superadmin/components/BranchSettingsPage.tsx` |
| Branch settings card | `Frontend/src/features/superadmin/components/parts/BranchSettingsCard.tsx` |
| SMTP form (org name + branch dropdown) | `Frontend/src/features/school/components/parts/SmtpSettingsForm.tsx` |
| Storage form (org name + branch dropdown) | `Frontend/src/features/school/components/parts/StorageSettingsForm.tsx` |
| Activity page + CSV export | `Frontend/src/features/superadmin/components/ActivityPage.tsx` |
| Activity toolbar (search/filter) | `Frontend/src/features/superadmin/components/parts/ActivityToolbar.tsx` |
| Activity table | `Frontend/src/features/superadmin/components/parts/ActivityTable.tsx` |
| Audit log service (frontend) | `Frontend/src/lib/api/auditLogService.ts` |
| Audit log backend | `Backend/src/modules/audit/` |
| API routes | `API_ROUTES.md` |
| MVP checklist | `MVP.md` |
| PRD | `PRD.md` |
