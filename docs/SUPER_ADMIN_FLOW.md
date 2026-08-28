# Super Admin Flow — Complete (Code-Verified)

> Super Admin ka poora flow — kaun hai, kahan login karta hai, console mein kya kya karta hai,
> org/branch/user kaise manage karta hai, block/unblock kaise hota hai. Backend + frontend code
> se verify kiya gaya hai (exact behavior, guess nahi).

---

## 1. Super Admin Kaun Hai? (Sirf 1 Level)

| Level | `organizationId` | Kaise banta hai | Kahan jata hai login par |
|---|---|---|---|
| **Platform Super Admin** | `null` | Seed script se **sirf 1**: `superadmin@schoolerp.com` | `/admin/dashboard` (Admin Console) |

> **⚠️ Pehle ek "Org-level Super Admin" (ORG_ADMIN) concept tha** — branch handover promotion
> (`_ensureOrgAdmin()`) se ek Principal saari branches manage karta tha. **Ab wo REMOVE ho
> chuka hai** (`20260817000400_remove_org_admin_role` migration): ORG_ADMIN role exist nahi
> karta, har branch ka apna ADMIN (Principal) hota hai, aur Branch Switcher bhi frontend se
> hata diya gaya hai.

**Ek line mein:** Super Admin = sirf aap (platform owner, 1 hi). Har org/branch ka apna
ADMIN (Principal) hota hai — SUPER_ADMIN koi aur nahi banta.

---

## 2. Login Flow (Platform Super Admin)

```
/admin/login (SuperAdminLoginPage)
   │  email + password
   │  ("Forgot password?" → /forgot-password — temp password email par)
   ▼
POST /api/v1/auth/login
   1. findByEmail(email)                      ← sirf email (school code nahi chahiye)
   2. isActive check                          → "Your account has been deactivated..."
   3. org/school BLOCKED check                → standard block message
   4. bcrypt password verify
   5. access (15m) + refresh (7d, rotating) tokens
   6. audit LOGIN
   ▼
getRoleHomePath(role) → SUPER_ADMIN hamesha /admin/dashboard
```

> **SSR note:** `/admin/login`, `/login`, `/parent/login` sab Next.js server components hain —
> branding/searchParams server-side read hote hain, pehle paint par poora form HTML mein aata hai
> (spinner-flicker fix ho chuka).

**⚠️ Guard:** seed se platform admin `organizationId = null` hota hai — isliye agar koi org
delete ho jaye to aapka account **bach jata hai** (detach: `organizationId: null`).
`getRoleHomePath` ab `organizationId` nahi dekhta — SUPER_ADMIN ka matlab platform console hi hai.

---

## 3. Admin Console — Pages & Kaam (Frontend Routes)

| Page | Route | Kya hota hai |
|---|---|---|
| Dashboard | `/admin/dashboard` | Platform stats: total orgs, branches, students, revenue, growth trend, status counts (active/blocked/partially/setup-pending) |
| Organizations | `/admin/organizations` | Saari orgs — list/grid, status badges, block/unblock, naya org |
| Create Organization | `/admin/organizations/new` | Single org create form |
| Org Detail | `/admin/organizations/:id` | KPIs: branches, staff, students, revenue + block/unblock + Add Branch |
| Branch Detail | `/admin/organizations/:orgId/schools/:schoolId` | Branch info + admin reassign + block/unblock |
| Branch Students | `/admin/organizations/:orgId/schools/:schoolId/students` | Us branch ke students (platform view) |
| Branches | `/admin/branches` | Saari branches platform-wide, org filter, status badges, block/unblock |
| Users | `/admin/users` | Platform-wide staff directory — stats by role, filters (role/status/reason), profile modal, **Export CSV**, block/unblock with reason |
| Import Data | `/admin/import` | Org bulk import (Excel) + Branch bulk import — live progress via WebSocket |
| Activity Log | `/admin/activity` | Audit trail — kisne kya kiya, kab, kahan se |
| Settings | `/admin/settings` | Profile, avatar, password change, account details, **Platform tab** (notification delivery status) |
| Notifications | `/admin/notifications` | Notification logs table — recipient/branch/channel/status/message, filters + pagination |
| Users (Create) | `/admin/users` | **Create User** button + modal (branch selector + role + creds) |

---

## 4. Organization Management (Core Flow)

### 4.1 Single Create (`POST /api/v1/organizations`)

```
Form: Name, Code, Logo, AdminEmail (+ optional adminName/username/password/phone)
   │
   ├─ Validations: code unique, slug unique (slug code/name se auto)
   ├─ Org create → status SETUP_PENDING ("Not delivered")
   ├─ Default branch auto: "{name} Main Campus", code "{CODE}-01" (collision par -02...)
   ├─ Admin create: role ADMIN (Principal), orgId + schoolId = default branch
   │     password auto: hex + "A1!" (bcrypt 12)
   ├─ Email (agar adminEmail diya ho aur self-designation na ho):
   │     School Code + Email + Username + Password + branded link /o/{slug}
   └─ Redis cache bust + WebSocket organization_created + overview_updated
```

**"Delivered" cycle:** create par `SETUP_PENDING` → **pehli login par** `ACTIVE`
(`markDeliveredOnLogin`). UI badge: Not delivered → Delivered.

### 4.2 Bulk Import (Excel) — `POST /api/v1/organizations/import-excel`

- BullMQ queue (`organization-import` worker) — **Redis chahiye**
- Har row: org + default branch + admin (role ADMIN) + credentials email
- Duplicate code / duplicate username → skip (count ke saath report)
- Self-designation skip (requester ki apni email)
- Progress: WebSocket `job:{jobId}` → `import_progress` / `import_completed`
- Template download (`GET /organizations/import-template`) + export (`GET /organizations/export`)

### 4.3 Block / Unblock Org (Super Admin — `moderation.service.js`)

```
blockOrganization:
   org → BLOCKED + reason/meta
   CASCADE: saari branches → BLOCKED
   Poore org ke refresh tokens revoke → sab log-out
   Cache bust + WS (org room + har branch room) + audit

unblockOrganization:
   org → ACTIVE, saari branches → ACTIVE, meta clear (reversible)
```

### 4.4 Org Delete (background job)

- `organization-delete` worker — ek transaction mein **poore org ka data** delete
  (students, staff, fees, attendance, timetables, exams, activities, applicants...)
- **Platform SUPER_ADMIN (aap) bachta hai** (detach: `organizationId: null`)
- Logos storage se delete (dedupe ke saath) + caches clear

---

## 5. Branch Management (2nd Campus Flow)

### 5.1 Add Branch — Ek Hi Mode (`POST /api/v1/schools`)

> **Pehle 2 modes the ("Naya Principal banao" / "Wahi admin manage kare") — ab sirf ek:
> "Naya Principal banao".** Har branch ka apna ADMIN (Principal) hota hai.

| Mode | Kya hota hai | Email |
|---|---|---|
| **"Naya Principal banao"** (ab sirf yehi) | Naya `ADMIN` user — us branch ka apna principal. **Email check pehle** (duplicate email → error, branch half-created nahi) | Naye principal ko credentials (`/login?code={schoolCode}`) |

### 5.2 Re-assign Branch Admin (`PATCH /schools/:id/admin`)

- **Purana principal pehle deactivate** (`isActive: false`), phir naya ADMIN create + credentials email
- Cache bust + WS `school_admin_updated`

### 5.3 Block / Unblock Branch

```
blockSchool: branch → BLOCKED; org ACTIVE hai to → PARTIALLY_BLOCKED
             us branch ke sessions revoke
             GUARD: org pehle se BLOCKED hai → "Unblock the organization first"
unblockSchool: branch → ACTIVE; agar koi branch blocked na bache → org ACTIVE
```

### 5.4 Branch Delete (`DELETE /schools/:id`)

- Ek transaction mein poora branch subtree (children → parents order)
- Logo delete (guard: single-branch org ka synced logo na marein)

---

## 6. User Management (Platform-wide)

### 6.1 Users Page (`/admin/users`)

- `GET /auth/users` platform-wide directory (saare orgs ke saare staff) + stats by role
- Filters: search, role, status (active/inactive), block reason
- Profile modal (user ki details + block info)
- **Export CSV** (client-side)
- Block/unblock — **reason dialog** ke saath (blockedReason/blockedAt/blockedByName)

### 6.2 Block User Rules (hierarchy guardrails)

```
SUPER_ADMIN (platform) → kisi ko bhi block kar sakta hai
ADMIN (branch)         → sirf apni branch ke TEACHER/GATE_STAFF/ACCOUNTANT/RECEPTIONIST
                         (doosra ADMIN nahi, SUPER_ADMIN nahi, khud nahi)
block hone par: isActive=false + meta + saare sessions revoke
unblock: isActive=true + meta clear
```

### 6.3 Password Reset

- `POST /auth/users/:id/reset-password` (admin force reset) — temp password + sessions revoke
- `POST /auth/change-password` (khud ka password)
- `POST /auth/forgot-password` (self-service, public) — email se temp password email par,
  saare sessions revoke

---

## 7. Import Data — Kya Import Ho Sakta Hai

| Import | Route | Queue | Progress |
|---|---|---|---|
| Organizations (Excel) | `POST /organizations/import-excel` | `organization-import` | WebSocket live |
| Branches (Excel) | `POST /schools/import-excel` | `school-import` | WebSocket live |
| Staff (Excel) | `POST /auth/users/import` | `staff-import` | — |
| Students (Excel) | `POST /students/schools/:schoolId/import` | `student-import` | — |

**Templates:** `GET /organizations/import-template`, `GET /schools/import-template`,
`GET /auth/users/import-template` (.xlsx downloads, importer ke columns ke saath).

**⚠️ Import queues Redis (Upstash) chahiye** — quota khatam ho to imports fail ho sakte hain
(email phir bhi chalegi — direct SMTP).

---

## 8. Activity Log (Audit Trail)

Har important action `auditService.record()` se log hota hai:
- **Actions:** CREATE_ORG, UPDATE_ORG, DELETE_ORG, BLOCK_ORG, UNBLOCK_ORG, CREATE_SCHOOL,
  UPDATE_SCHOOL, DELETE_SCHOOL, ASSIGN_SCHOOL_ADMIN, BLOCK_SCHOOL, UNBLOCK_SCHOOL,
  CREATE_STAFF, UPDATE_STAFF, DEACTIVATE_STAFF, REACTIVATE_STAFF, RESET_STAFF_PASSWORD,
  BLOCK_USER, UNBLOCK_USER, BLOCK_STUDENT, UNBLOCK_STUDENT, BLOCK_PARENT, UNBLOCK_PARENT,
  LOGIN, LOGOUT, PARENT_LOGIN, STUDENT_LOGIN
- **Har entry:** kisne (actorId/name/role), kya (action/entity), kab (timestamp), kahan se (IP),
  details (reason, changes)

---

## 9. (Removed) Org-Level Super Admin — Ab Nahi Hai

> Yeh section pehle tha jab "Wahi admin manage kare" mode exist karta tha (ORG_ADMIN role,
> handover promotion, Branch Switcher). **Sab remove ho chuka hai.** Ab koi user ek login se
> 2 branches manage nahi karta — har branch ka apna ADMIN (Principal) hota hai.
> Backend: `_ensureOrgAdmin` / `findOrgAdmin` hataye gaye; frontend: `BranchSwitcher.tsx` delete.

---

## 10. Quick FAQ (Super Admin)

| Sawal | Jawab |
|---|---|
| "Super admin kitne hain?" | **Sirf 1** (seed se) — platform owner. Ab koi org-level SUPER_ADMIN/ORG_ADMIN nahi banta |
| "Org create par jo user banta hai wo kya hai?" | Us org ke default branch ka **ADMIN (Principal)** — platform super admin nahi |
| "2nd branch par naya admin?" | **"Naya Principal banao"** (ab sirf yehi mode) — naya ADMIN + creds email |
| "2nd branch wahi admin manage kare?" | **Ye option ab nahi hai** — org-level handover remove ho chuka. Har branch ka apna principal |
| "Org 'Not delivered' kab 'Delivered'?" | **Pehli login par** |
| "Branch block par?" | Branch lock, org PARTIALLY_BLOCKED, sessions revoke |
| "Org block par?" | Saari branches cascade BLOCKED, sab roles lock |
| "Org delete par platform admin?" | **Bachta hai** (organizationId detach) |
| "Email kyun nahi jati khud banane par?" | Self-designation skip (apni email par credentials email nahi) |

---

## 11. Source Map

| Flow | File |
|---|---|
| Login, tokens, users, forgot-password | `Backend/src/modules/auth/auth.service.js` |
| Org create/delivery/overview | `Backend/src/modules/organization/organization.service.js` |
| Default branch + branch admin | `Backend/src/modules/organization/provision.js` |
| Branch create/delete/admin re-assign/portal-password | `Backend/src/modules/school/school.service.js` |
| Block/unblock | `Backend/src/modules/moderation/moderation.service.js` |
| Audit | `Backend/src/modules/audit/` |
| Import workers | `Backend/src/jobs/workers/` |
| Console pages (components) | `frontend/nextjs/src/features/superadmin/` |
| Routes (Next.js App Router) | `frontend/nextjs/src/app/admin/**/page.tsx` + `src/config/navLinks.ts` |
| API services | `frontend/nextjs/src/lib/api/` |
