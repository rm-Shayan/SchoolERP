# Super Admin Flow — Pending (Code-Verified, Updated 1 Sep 2026)

> Is doc mein **pending/TODO** items hain jo abhi bhi **baqi hai** ya incomplete hai.
>
> Jo complete ho chuka hai wo `docs/SUPER_ADMIN_FLOW_DONE.md` mein hai.

---

## Current State — Super Admin Portal (Updated)

### Frontend Pages (All Complete)

| # | Page | Route | Status |
|---|---|---|---|
| 1 | Dashboard | `/admin/dashboard` | Done |
| 2 | Organizations | `/admin/organizations` | Done |
| 3 | Create Organization | `/admin/organizations/new` | Done |
| 4 | Org Detail | `/admin/organizations/:id` | Done |
| 5 | Branch Detail | `/admin/organizations/:orgId/schools/:schoolId` | Done |
| 6 | Branches | `/admin/branches` | Done |
| 7 | Users | `/admin/users` | Done |
| 8 | Import Data | `/admin/import` | Done |
| 9 | Activity Log | `/admin/activity` | Done + CSV Export |
| 10 | Settings | `/admin/settings` | Done |
| 11 | Notifications | `/admin/notifications` | Done |
| 12 | School Health | `/admin/health` | **Done (redesigned)** |

### Recent Completions (1 Sep 2026 Session)

- [x] Branch CRUD UI (Add/Edit/Delete modals)
- [x] School Health page two-level view (org cards → branch details)
- [x] Portal notifications with self-notifications
- [x] Announcement emails to target admins
- [x] Notification form with org/branch dropdowns
- [x] Storage/SMTP tenant-first failover
- [x] SKIP_CREDENTIAL_VERIFICATION env var
- [x] Logo fallback chain (branch → org → initials)
- [x] Health banner with #6D28D9 color
- [x] Health query fix (branchAccess check)
- [x] Circular eventDate field
- [x] Organization ID tracking in uploads

---

## High Priority (Action Needed)

### 1. SMTP Email Credentials Configure Karo
- `emailConfigured` flag warn karta hai jab `SMTP_USER / SMTP_PASS / SMTP_HOST` missing ho
- **Status:** Abhi emails kabhi deliver nahi hoti (SMTP creds placeholder hain)
- **Kaam:** Backend `.env` mein asli SMTP creds (e.g. Resend / SMTP provider) daalo
- **Note:** `SKIP_CREDENTIAL_VERIFICATION=true` currently set hai — production mein hatao

### 2. WhatsApp Channel — Abhi Live Nahi
- Service wired hai (`notification.service.js` + `whatsapp.service.js`)
- **Status:** Asli delivery ke liye env creds chahiye
- **Kaam:** WhatsApp Business Cloud API credentials daalo:
  - `WA_ENABLED=true`
  - `WA_API_TOKEN`
  - `WA_PHONE_NUMBER_ID`
- Email fallback pehle se hai

### 3. CLIENT_URL — Production Deployment Blocker
- `CLIENT_URL` env var must be set to **production domain** before going live
- **Kaam:** `.env` / deployment config mein `CLIENT_URL=https://{production-domain}` set karo
- Branded links, credential emails, aur redirects ispe depend karte hain

### 4. Staff Leave — Email Enforce Verify Karo
- Staff leave requests should **NOT send email** — only portal notification + WS
- **Kaam:** `notification.service.js` mein leave-related calls mein sirf `in-app` + `ws`
  channel use ho; email/WhatsApp skip ho — code verify karo

---

## Medium Priority (Feature Gaps)

### 5. Org Public Page — Admission Form
- Abhi super admin console mein `/o/{slug}` links branded login kholte hain
- **Chahiye:** Org ki public landing page with:
  - Org landing: logo, naam, code/slug, branches, themeColor
  - Buttons: Admission (`/o/{slug}/admission`), Admin Login, role entry points
- **Kaam:** Public pages bante hi super admin UI ke links verify karo

### 6. Bulk Imports — Edge-Case Testing
- Org/branch/staff/student import workers hain — error-reporting UX limited hai
- **Kaam:** Har import ke baad "skipped + failed rows" ka detailed UI report

---

## Low Priority / Infrastructure

### 7. Upstash Redis Quota
- Free tier (500k req/month) BullMQ polling + caching se khatam ho chuka
- **Status:** Fix applied (drainDelay 15→60s, error listeners added)
- **Kaam:** Quota reset/upgrade hone par verify karo; paid plan ya self-hosted Redis plan karo

### 8. RFID Hardware Future
- `identifierCode` aaj QR value hai; RFID tag aane par same field use hogi
- **Kaam (jab hardware aaye):** RFID scanner integration + offline flow test

### 9. End-to-End Testing (Key Scenarios)
Manually test karke verify karo:
1. Org create → admin email aayi? → login → "Delivered"
2. 2nd branch "Naya Principal" flow (+ CredentialsBanner)
3. Branch block → org PARTIALLY_BLOCKED; unblock → ACTIVE
4. Org block → saari branches block; unblock → sab restore
5. User block with reason → user ko standard message
6. Org delete → platform admin login chalta rahe
7. Excel import (org + branches) → live progress + caches fresh
8. Notification bell → logs + WS status update realtime dikhe
9. Branch CRUD (Add/Edit/Delete) → form validation + error handling
10. Health page → org cards → click → branch list with health badges
11. Announcement send → portal notification + email delivered
12. Organization logo upload → correct Cloudinary account (tenant-first)
13. Notification form → org dropdown → branch dropdown populated
14. SKIP_CREDENTIAL_VERIFICATION=false → real SMTP/Cloudinary verification
15. Activity Log page → filters work + CSV export downloads correctly

---

## Recently Completed (Moved to DONE)

The following items were completed in the 1 Sep 2026 session and moved to `SUPER_ADMIN_FLOW_DONE.md`:

- [x] Branch CRUD UI (Add/Edit/Delete modals with org picker)
- [x] Logo fallback chain (branch → org → initials)
- [x] School Health two-level redesign (org cards → branch details)
- [x] Health banner with #6D28D9 color
- [x] Health query fix (branchAccess JSONB check)
- [x] Portal notifications with self-notifications
- [x] Announcement emails to target admins
- [x] Notification form with dropdowns
- [x] Storage/SMTP tenant-first failover
- [x] SKIP_CREDENTIAL_VERIFICATION env var
- [x] Organization ID tracking in uploads
- [x] Circular eventDate field
- [x] Notification bell fix for super admin
- [x] Audit Log CSV Export on Activity Log page
- [x] Audit Log Service params fix (empty string Zod validation)

---

## Note — Agli Baar Ke Liye

- **Frontend rule:** har file `<= 150 lines` (AGENTS.md)
- **Har naya feature** jo hierarchy violate kare → pehle design decide karo
- **Docs sync:** `SUPER_ADMIN_FLOW_DONE.md` aur `API_ROUTES.md` mein route counts updated (220+)
- Jab bhi koi item complete ho → `docs/SUPER_ADMIN_FLOW_DONE.md` mein move karo
