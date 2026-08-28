# Super Admin Flow — Current State + Pending (Code-Verified, 2026-08-17)

> Is doc mein **do cheezein** hain:
> 1. **Current State** — jo abhi application mein super admin portal / flow ke liye
>    **maujood hai** (frontend pages + backend routes, code se verify kiya gaya).
> 2. **Pending / TODO** — jo abhi bhi **baqi hai** ya incomplete hai.
>
> Agar koi item complete ho jaye → `docs/SUPER_ADMIN_FLOW_DONE.md` mein move karo.

---

## 📋 Current State — Super Admin Portal & Flow (Kya Kya Hai Abhi)

### Frontend — Admin Console Pages (sab routes wired, lazy-loaded)

| # | Page | Route | Kya karta hai |
|---|---|---|---|
| 1 | Dashboard | `/admin/dashboard` | WelcomeHeader, StatCards (orgs/branches/students/revenue), StatusStats (active/blocked/partially/setup-pending), 12-month OverviewChart, GrowthChart, **QuickActions**, OrganizationsGrid |
| 2 | Organizations | `/admin/organizations` | Grid/Table toggle, stats cards, StatusFilterChips, search, **Export**, block/unblock (reason dialog), inline **Create Organization modal** |
| 3 | Create Organization | `/admin/organizations/new` | Full form: logo upload, org fields, admin fields; **OrgCreatedPanel** — credentials screen par dikhate hain (email ke saath) |
| 4 | Org Detail | `/admin/organizations/:id` | OrgHeader, OrgStats, **CredentialsBanner**, **OrgDashboardSection** (StaffVsStudents chart, Revenue chart, StaffTable), SchoolsSection, **EditOrgModal**, AddBranchModal, block/unblock/delete |
| 5 | Branch Detail | `/admin/organizations/:orgId/schools/:schoolId` | SchoolHeader, SchoolStats, **EditSchoolModal**, **AssignAdminModal** (admin reassign), BranchAdminCard, **CredentialsBanner**, **BranchLogoCard** (branch logo upload/remove), BranchDetailsCard, block/unblock/delete |
| 6 | Branches | `/admin/branches` | BranchesStats, search, org filter, StatusFilterChips, grid, block/unblock/delete, **Export** |
| 7 | Users | `/admin/users` | UsersStats (by role), filters (search/role/status/reason), table + card list, UserProfileModal, **Export CSV**, block/unblock with reason |
| 8 | Import Data | `/admin/import` | **2 tabs**: Organizations + Branches import (Excel), template download, **live WebSocket progress** (`job:{id}`) |
| 9 | Activity Log | `/admin/activity` | Audit trail: search/action/entity filters, table, pagination (GET /audit-logs) |
| 10 | Settings | `/admin/settings` | **SettingsTabs** (Profile / Change Password / **Platform** — notification delivery summary via `GET /notifications/status`), AvatarSection, ProfileForm, PasswordForm, AccountDetails, PlatformStatus |
| 11 | Notifications | `/admin/notifications` | NotificationLogsPage — logs table (recipient/branch/channel/status/message), channel/status filters, pagination (`GET /notifications/logs`) |

**Nav:** Dashboard, Organizations, Branches, Users, Import Data, Activity Log, **Notifications**, Settings (`frontend/src/config/navLinks.ts`).

### Backend — Routes (164 total — docs mein purana count 144 tha, ab updated)

| Module | Routes | Module | Routes |
|---|---|---|---|
| auth | **24** | academic | 22 |
| organization | **11** | admission | 9 |
| school | **11** | attendance | 9 |
| moderation | **10** | exam | 7 |
| fee | 11 | promotion | 7 |
| student | 8 | timetable | 6 |
| **activity (NEW)** | **5** | ptm | 5 |
| circular | 4 | conduct | 4 |
| homework | 4 | substitute | 4 |
| notification | 2 | audit | 1 |

### Slug / Branded Login — Super Admin Side (verified)

- ✅ **Slug display on org UI** — slug dikhta hai in jagahon:
  - `OrganizationsTable` (admin/organizations table view) — `org.slug` row mein
  - `OrganizationsGrid` (dashboard) — **`/o/{org.slug}`** open button (new tab)
  - `OrgHeader` (org detail) — **"Slug: /o/{org.slug}"** + open link
  - `OrgsSearch` — search by name/code/**slug**/username
- ✅ **Slug login URL** — `/o/:slug` route (AppRoutes) → `OrgSlugRedirect` →
  `/login?org={slug}` → `LoginCard` branding (DB se: logo, name, orgName, themeColor)
- ✅ **Credentials email** — org admin ko branded link `/o/{slug}` bheja jata hai
- ✅ **Subdomain support** — `EntryRouter` detectOrgSlug(): `{orgslug}.domain.com` →
  `/login?org={slug}` branded login
- ✅ **Slug on grid cards** — `OrgCard` (admin/organizations grid) mein ab `Code: X · /o/{slug}`
  dikhta hai + **"Copy link"** button (toast ke saath)
- ✅ **Copy login link button** — `OrgHeader` (org detail) mein **"Copy Link"** button
  → `https://{domain}/o/{slug}` clipboard par copy (Copied! state + toast)
- ✅ **Create User (console)** — Users page par **"Create User"** button + modal: branch
  selector + role + name/email/password/phone (`POST /auth/users`)
- ✅ **Settings — Platform tab** — `/admin/settings` mein **3rd tab "Platform"**: notification
  delivery summary (total/sent/delivered/failed) + by-channel (`GET /notifications/status`)
- ✅ **Notification Logs page** — `/admin/notifications` (nav link): recipient/branch/channel/
  status/message table + channel + status filters + pagination (`GET /notifications/logs`)
- ✅ **Backend fix — createUser org scope** — platform SUPER_ADMIN (`organizationId: null`)
  jab user create kare to org **school se derive** hota hai (pehle null reh jata tha)

### Flows Jo Abhi Kaam Kar Rahe Hain (verified)

- ✅ **Login** — `/admin/login` → `getRoleHomePath` → `/admin/dashboard` (platform SUPER_ADMIN, `organizationId: null`)
- ✅ **Org create** — single form + bulk Excel import (BullMQ queue, WS progress)
- ✅ **"Delivered" cycle** — `SETUP_PENDING` → pehli login par `ACTIVE`
- ✅ **Branch create — ek hi mode** — "Naya Principal banao" (naya ADMIN + creds email).
  **"Wahi admin manage kare" (org_admin) REMOVE ho chuka** — `_ensureOrgAdmin()` promotion,
  ORG_ADMIN role, aur Branch Switcher sab hata diye (2026-08-17); **CredentialsBanner** ab screen par creds dikhata hai
- ✅ **Branch admin reassign** — `PATCH /schools/:id/admin` (AssignAdminModal — ab sirf "new principal" mode)
- ✅ **Block/unblock matrix** — org (cascade), branch (org → PARTIALLY_BLOCKED), user (hierarchy guardrails), student/parent — sab reason dialog ke saath, reversible
- ✅ **Org/Branch delete** — background workers, transaction, SUPER_ADMIN detach
- ✅ **Audit trail** — Activity Log page + `auditService.record()` har important action par
- ✅ **Notification bell (realtime)** — layouts mein `NotificationMenu`: `GET /notifications/logs` se logs, `notification_status_updated` / `notification_created` WebSocket events (`super_admins` room), channel + status badges
- ✅ **WhatsApp service ab wired hai** — `notification.service.js`: agar `parentWhatsapp` + `whatsappConfig.isConfigured` → `whatsappService.sendMessage()` (Meta Graph API), failure par **email fallback**; nahi configured → simulated mode. Sirf env creds (`WA_ENABLED`, token, phone number id) chahiye live hone ke liye.

---

## 🔴 High Priority (Chalte waqt pakad lo)

### 1. SMTP Email Credentials Configure Karo
- `emailConfigured` flag (org create response) warn karta hai jab `SMTP_USER / SMTP_PASS /
  SMTP_HOST` missing ho ya placeholder host ("google") ho — **abhi emails kabhi deliver nahi hoti**
- **Kaam:** Backend `.env` mein asli SMTP creds (e.g. Resend / SMTP provider) daalo aur
  org create + staff create par test email bhejo

### 2. Student Portal Frontend ✅ (done)
- **Done:** Student portal bana chuka hai — login + dashboard + 10 tabs + realtime + mobile-responsive
- Parent portal bhi complete hai (login + dashboard + realtime)
- **Baqi:** Staff leave requests should NOT send email (only portal notification) — verify
  this is enforced in `notification.service.js` (leave notify mein sirf WS + in-app,
  email/WhatsApp skip); `CLIENT_URL` must be set to production domain before deployment

### 3. WhatsApp Channel — Abhi Live Nahi (wired hai, creds chahiye)
- Service **wired hai** (`notification.service.js` + `whatsapp.service.js` — Meta Graph API,
  simulated mode fallback), par **asli delivery ke liye env creds chahiye**:
  `WA_ENABLED=true`, `WA_API_TOKEN`, `WA_PHONE_NUMBER_ID`
- **Kaam:** WhatsApp Business Cloud API credentials daalo, `whatsappConfig` mein verify karo,
  ek test OTP bhejo — email fallback pehle se hai

### 4. Email Attachments ✅ (done — verify delivery)
- `email.service.js` mein **`attachments` support** — nodemailer attachments + mock mein
  filenames print
- **Wired in 3 flows:**
  - Admission **approve** → `admission-slip-*.pdf`
  - Admission **enroll** → `student-id-*.pdf` (QR ID card)
  - Fee **payment** → `fee-receipt-*.pdf`
- **Kaam (baqi):** SMTP creds configure karne ke baad ek test bhejo — attachments asli
  mail mein aaye verify karo

### 5. Org Public Page — Super Admin Console Se Open/Show ❌ (link: ORG_ADMIN #0/#9)
- **Abhi:** super admin console mein `/o/{slug}` open buttons (grid card, table row,
  OrgHeader copy link) **seedha branded login** kholte hain — `/o/:slug` route
  `OrgSlugRedirect` → `/login?org={slug}`. Koi **public page nahi** hai
- **Chahiye — "poori web" wala scene:** jab super admin kisi org par click/open kare
  to us org ki **public page** dikhe (`localhost:5173/o/{org-slug}` — slug/code kuch
  bhi URL scheme):
  - Org landing: logo, naam, code/slug, branches (name/code/logo/address), themeColor —
    sab DB se (`GET /schools/branding?slug=` public route ready)
  - Buttons: **Admission** (`/o/{slug}/admission`), **Admin Login** (branded login),
    aur saare roles ke entry points (parent/student/staff login) — ORG_ADMIN #9
  - Super admin ke open/copy-link sab public landing par point karein
- **Kaam:** public pages bante hi (`ORG_ADMIN_FLOW_TODO.md` #0) super admin UI ke
  `/o/{slug}` links verify karo — click → public page khule (login nahi); grid card +
  table row + OrgHeader teeno jagah

---

## 🟡 Medium Priority (Feature Gaps)

### 6. Super Admin Side — View Public Page Button ✅ (done)
- **Done:** shared `PublicPageButton` (`parts/PublicPageButton.tsx`) — `/o/{slug}`
  new tab, `stopPropagation` (card/row click alag nahi hota)
- **Laga diya:** OrganizationsGrid card (dashboard), OrgCard (orgs list grid),
  OrganizationsTable row, OrgHeader (solid variant, pehle "Open Portal" tha)
- **Baqi:** jab public page bane (`ORG_ADMIN_FLOW_TODO.md` #0) → click verify karo —
  abhi `/o/{slug}` branded login kholta hai (public landing pending)

### 7. Per-Org Theming ✅ (done — migration apply karo)
- `Organization.themeColor` field **add ho gaya** (schema + migration
  `20260814120000_add_org_theme_color` — **DB up hone par `prisma migrate deploy`
  chalao**)
- **Backend:** `getBranding()` ab org ka themeColor return karta hai (fallback
  `#2563eb`); org create/update `themeColor` accept karta hai; DTO mein bhi included
- **Frontend:** Org create form + EditOrgModal mein **color picker** + hex input;
  branded login (`LoginCard`) org ka color use karta hai
- **Kaam (baqi):** Migration apply karo aur per-org color test karo; branch portal
  (sidebar/buttons) mein color apply karna `ORG_ADMIN_FLOW_TODO.md` #4

### 8. Staff Leave — Email Enforce ❌ (verify)
- Staff leave requests should **NOT send email** — only portal notification + WS
- **Kaam:** `notification.service.js` mein leave-related calls mein sirf `in-app` + `ws`
  channel use ho; email/WhatsApp skip ho. Code verify karo ke `notifyStaff()` ya
  `notifyLeaveApproval()` mein email skip hota hai

### 9. CLIENT_URL — Production Deployment Blocker ❌
- `CLIENT_URL` env var must be set to **production domain** before going live
- **Kaam:** `.env` / deployment config mein `CLIENT_URL=https://{production-domain}` set
  karo — branded links, credential emails, aur redirects ispe depend karte hain

### 10. RFID Hardware Future
- `identifierCode` aaj QR value hai (`ID-XXXX`); RFID tag aane par same field use hogi —
  **schema change nahi chahiye** (code comment)
- **Kaam (jab hardware aaye):** RFID scanner integration + `attendance/sync` offline flow test

### 11. Notification Delivery Status — Done ✅
- **Admin console:** `/admin/notifications` — logs table (recipient, branch, channel,
  status, message, time) + channel/status filters + pagination
- **Branch portal:** `/branch/notifications` — `BranchNotificationLogsPage`
  (`frontend/src/features/school/components/NotificationLogsPage.tsx`), nav link + route
  wired (`navLinks.ts`, `AppRoutes.tsx`), schoolId scoped
- **✅ Dono portals par done** — admin + branch dono mein notifications logs page kaam kar raha hai

---

## 🟢 Low Priority / Infrastructure

### 12. Upstash Redis Quota — Plan Upgrade ⚠️
- Free tier (500k req/month) BullMQ polling + caching se **khatam ho chuka tha** (2026-08: 500,003/500,000)
- **Fix applied:**
  - Har BullMQ Queue/Worker par `.on("error")` listener — bina listener ke Redis
    connection error **process crash** kar deta tha (EventEmitter unhandled 'error')
    → `--watch` restart loop → **super admin login bhi fail** (login khud Redis-free
    hai, par server up-down rehta tha)
  - Polling kam: `drainDelay` 15→60s + `stalledInterval` 30s→5min (sab 5 workers par)
- **Baqi:** Quota reset hone / upgrade hone par verify karo — imports + caching phir
  se chalein; paid plan ya self-hosted Redis plan karo

### 13. Bulk Imports Ka Edge-Case Testing
- Org/branch/staff/student import workers hain — par error-reporting UX limited hai
- **Kaam:** Har import ke baad "skipped + failed rows" ka detailed UI report (abhi count
  ke saath basic hai)

### 14. End-to-End Testing (Super Admin Hi-Lights)
- **Kaam:** Ye scenarios manually test karke verify karo:
  1. Org create → admin email aayi? → login → "Delivered"
  2. 2nd branch "Naya Principal" flow (+ on-screen CredentialsBanner) — "Wahi admin" mode ab nahi hai
  3. Branch block → org PARTIALLY_BLOCKED; unblock → ACTIVE
  4. Org block → saari branches block; unblock → sab restore
  5. User block with reason → user ko standard message
  6. Org delete → platform admin login chalta rahe
  7. Excel import (org + branches) → live progress + caches fresh
  8. Notification bell → logs + WS status update realtime dikhe
  9. **Migration verify:** `20260817000400_remove_org_admin_role` chalao — purane ORG_ADMIN
     users unki pehli branch ke ADMIN ban jayein (login karke check karo)
  10. **Seed verify:** `npx prisma db seed` — ab `admin@falconacademy.com` role ADMIN
      (branch principal) banta hai, SUPER_ADMIN nahi

---

## 🆕 2026-08-17 — Super Admin Flow Docs Sync (ORG_ADMIN removal)

> `APPLICATION_FLOW_DEEP.md` + code se verify kiya — super admin flow ab in changes ke saath
> sync hai:

**Changes (code):**
- `Role` enum se `ORG_ADMIN` drop — migration `20260817000400_remove_org_admin_role`
- `_ensureOrgAdmin()` / `findOrgAdmin()` / "Wahi admin manage kare" (`org_admin`) mode hata diye
- Branch Switcher (`BranchSwitcher.tsx`) delete; authSlice `schools` state hata di
- `getRoleHomePath`: SUPER_ADMIN hamesha `/admin/dashboard` (organizationId ab check nahi hota)
- `createBranchAdmin()` ab sirf ADMIN role banata hai; `adminCredentialsEmail` se isOrgAdmin hat gaya
- Seed fix: `admin@falconacademy.com` ab ADMIN (branch principal) hai, SUPER_ADMIN nahi
- Existing ORG_ADMIN users → migration unki org ki pehli branch ka ADMIN banata hai

**Docs updated:** `APPLICATION_FLOW_DEEP.md`, `APPLICATION_FLOW.md`, `SUPER_ADMIN_FLOW.md`,
`SUPER_ADMIN_FLOW_DONE.md`, `SUPER_ADMIN_FLOW_TODO.md`, `ORG_ADMIN_FLOW_TODO.md`

**Baqi TODO (unchanged):**
- SMTP credentials configure karo (#1) — emails abhi deliver nahi hote
- WhatsApp live creds (#3)
- Org public page / admission form (#5 — ORG_ADMIN #0)
- `/branch/org-overview` (ORG_ADMIN #35) — ab stale, decide karo
- Staff leave email enforcement verify karo (#8)
- CLIENT_URL production domain set karo (#9)

---

## 📌 Note — Agli Baar Ke Liye

- **Org admin wali cheezein (slug dynamic pages, branding, org page → login → branch)
  alag file mein hain:** `docs/ORG_ADMIN_FLOW_TODO.md` — yahan sirf super admin side
- **Frontend rule:** har file `<= 150 lines` (AGENTS.md) — naya student portal ya settings
  tab banate waqt components/parts mein toot kar rakho
- **Har naya feature** jo hierarchy violate kare (e.g. branch admin ko org-level power) →
  `APPLICATION_FLOW_DEEP.md` ka governance rule todta hai — pehle flag karo
- **ORG_ADMIN removal (2026-08-17):** `ORG_ADMIN_FLOW_TODO.md` item #13 (branch 2 admin
  modes + handover promotion) ab stale hai — wo concept remove ho chuka. Naye org-level
  feature banate waqt pehle design decide karo (branch switcher ab exist nahi karta)
- **Docs sync:** `SUPER_ADMIN_FLOW_DONE.md` aur `API_ROUTES.md` mein route counts purane
  hain (144 likha hai, ab 164 hain) — `activity` module (5 routes) aur naye auth/org/school
  routes add karo
- Jab bhi koi item complete ho → `docs/SUPER_ADMIN_FLOW_DONE.md` mein move karo (checklist style)
