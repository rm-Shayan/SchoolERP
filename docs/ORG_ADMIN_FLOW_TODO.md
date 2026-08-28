# Org Admin Flow — Todos (2026-08-16)

> Original todos (0–12) complete — 2026-08-15. Implementation/verification:
> **`docs/ORG_ADMIN_FLOW_DONE.md`**.

> **2026-08-16 — Gap-check:** `APPLICATION_FLOW_DEEP.md` ke saath compare kiya — jo flows
> org admin docs mein missing the, unke todos neeche (13+). Jo flows backend mein
> code-verified hain aur frontend UI maujood hai → **Done**. Jo backend/API ready hain
> lekin frontend UI baqi hai → **Pending**. Design/state: `docs/ORG_ADMIN_FLOW.md`.

---

## ✅ Completed (original — 0–12)

| # | Item | Status |
|---|---|---|
| 0 | Org Public Pages — branded landing `/o/{slug}` + admission form `/o/{slug}/admission` (DB se dynamic, public endpoints) | ✅ Done |
| 1 | Dynamic slug URLs — `/o/:slug/branch/*` → `/branch/*` (branded links) | ✅ Done |
| 2 | Har page par DB se fresh branding (layout mount par public endpoint se) | ✅ Done |
| 3 | Org page pehle → login → branch (ab `/o/{slug}` landing dikhta hai) | ✅ Done |
| 4 | Theme color branch portal mein (sidebar active links + brand + overview) | ✅ Done |
| 5 | Branch-specific branding (branch switch → branch logo sidebar mein) | ✅ Done |
| 6 | Merged Student + Parent portal (2 tabs: WhatsApp OTP / Roll No — EK dashboard) | ✅ Done |
| 8 | End-to-End verification (endpoints + frontend build/lint/tsc) | ✅ Done |
| 9 | Public web — saare roles ke entry points (landing buttons: Admission, Admin Login, Parent Portal) | ✅ Done |
| 10 | Subdomain → public landing (`{slug}.domain.com` → `/o/{slug}`) | ✅ Done |
| 11 | Notification logs page — branch portal (`/branch/notifications`) | ✅ Done |
| 12 | Org-level combined dashboard (`/branch/org-overview` — saari branches + scope check) | 🟡 **Stale (2026-08-17)** — org-level admin nahi raha; decide karo (see #35) |

---

## 🆕 Gap Additions (APPLICATION_FLOW_DEEP.md se — 2026-08-16)

### ✅ Done (code-verified + frontend UI maujood)

| # | Item | Status |
|---|---|---|
| 13 | Branch creation — **2 admin modes** ("Naya Principal banao" / "Wahi admin manage kare") + handover promotion (`_ensureOrgAdmin` → org-level SUPER_ADMIN) + admin re-assign | ❌ **REMOVED (2026-08-17)** — org-level admin concept khatam. Ab sirf "Naya Principal banao" mode hai; ORG_ADMIN role, `_ensureOrgAdmin`, Branch Switcher sab hat gaye (`20260817000400_remove_org_admin_role`) |
| 14 | **Blocking / deactivation** deep flow (org/school/user block-unblock, cascade, PARTIALLY_BLOCKED, session revoke) | ✅ Done |
| 15 | **Delete flows** (org background delete worker, branch delete with logo guard) | ✅ Done |
| 16 | **Bulk imports (Excel)** — org/branch/staff with live progress (student import UI baqi → #23) | ✅ Done |
| 17 | **Background jobs & schedulers** (auto-absent 8:30 AM Mon-Sat, fee reminder 9:00 AM daily, overdue sweep) | ✅ Done |
| 18 | **Business flows deep** — admission pipeline (approve/enroll + QR ID), gate scan (LATE/PRESENT/auto-absent recovery), fees (structures/monthly gen/payments + receipt PDF), academic setup chain | ✅ Done |
| 19 | **Emails & PDF attachments** (SMTP direct, branded links, self-designation skip, admission/student-id/fee-receipt PDFs) | ✅ Done |
| 20 | **Caching & Realtime map** (Redis keys + WS rooms `super_admins`/`org:{id}`/`school:{id}`/`job:{jobId}` + frontend refetch) | ✅ Done |

### ⏳ Pending (backend/API ready, frontend UI baqi)

| # | Item | Status |
|---|---|---|
| 21 | **Promotions UI** — branch portal (backend + `promotionService.ts` ready: bulk-promote / repeat / transfer-section / graduate / dropout, PromotionRecord history) | ⏳ Pending |
| 22 | **Student/Parent block UI** — branch portal. **Student side done** (`StudentActions.tsx` — Block/Unblock Student + reason dialog). **Parent side baqi** (backend + `moderationService.blockParent` ready, koi frontend component use nahi karta) | 🟡 Partial (Student done, Parent pending) |
| 23 | **Student bulk import UI** — branch portal — **✅ DONE**: `StudentImportModal.tsx` (Excel upload + WebSocket `student_import_progress/completed/failed`), StudentsPage + BranchStudentsPage dono par laga | ✅ Done |
| 24 | **Parent/student portal live data sections** — dashboard par abhi summary cards hain; attendance timeline, fee records, homework/circulars lists baqi | ⏳ Pending |

---

## 🔄 2026-08-17 — Org-level admin (ORG_ADMIN) concept REMOVE

> Code + docs update: SUPER_ADMIN sirf platform owner (1 hi) hai; har branch ka apna ADMIN
> (Principal). Yeh change ORG_ADMIN_FLOW_TODO ke original items #12/#13 ko stale kar deta hai:

| # | Item | Status |
|---|---|---|
| 12 | Org-level combined dashboard (`/branch/org-overview` — saari branches + scope check) | 🟡 **Stale** — org-level admin exist nahi karta ab. Route/UI ab unused hai; decide: hatao ya sirf SUPER_ADMIN (platform) tak limit karo |
| 13 | Branch creation — 2 admin modes + handover promotion | ❌ **Removed** (upar detail) |

**Kya hua (code):**
- `Role` enum se `ORG_ADMIN` drop (migration `20260817000400_remove_org_admin_role`)
- `_ensureOrgAdmin()` / `findOrgAdmin()` / "Wahi admin manage kare" mode — sab hata diye
- Branch Switcher frontend se delete; `getRoleHomePath` SUPER_ADMIN ko hamesha `/admin/dashboard`
- Existing ORG_ADMIN users → unki org ki **pehli branch ka ADMIN** (Principal) bana diye gaye
- Seed fix: `admin@falconacademy.com` ab role ADMIN (branch principal), SUPER_ADMIN nahi

**Todo (baqi):**
- `frontend/src/features/school` mein `/branch/org-overview` (item #12) ka kya karna hai —
- decide karo (remove route ya platform admin scope)
- Parent block UI (item #22 ka parent hissa) — `moderationService.blockParent` ready, koi UI nahi
- Promotions UI (item #21) — `promotionService.ts` ready, koi page nahi

---

## ✅ 2026-08-16 — Admissions UI Overhaul (pagination + CRUD + Excel + photo + test email)

| # | Item | Status |
|---|---|---|
| 25 | **Admission pagination** — list API (page/pageSize/total) ab UI par use hota hai; table + Prev/Next controls | ✅ Done |
| 26 | **Admission CRUD** — PATCH `/:id` (edit details), DELETE `/:id` (ENROLLED protected), photo `POST /:id/photo` (applicant `imageUrl`, enroll par Student par carry) | ✅ Done |
| 27 | **Excel bulk admission import** — `POST /schools/:schoolId/import` + `admission-import` BullMQ queue/worker (progress `job:{jobId}`) | ✅ Done |
| 28 | **Test schedule** — `testDate/testTime/testVenue` fields + TEST_SCHEDULED par parent email (WhatsApp budget nahi → Email) | ✅ Done |
| 29 | **Pipeline UI** — kanban ki jagah paginated table + funnel summary chips + status/class/search filters; inquiry form ka `address` bug fix (`parentAddress`) | ✅ Done |
| 30 | Approve endpoint ab PDF raw return ki jagah applicant JSON return karta hai (slip `GET /:id/slip` se download); advance-fee flow bhi fix (`recordAdvanceFee` + slip download) | ✅ Done |
| 31 | **Applicant documents** — `POST /:id/documents` + `DELETE /:id/documents/:docId`, `ApplicantDocument` model, storage as-is (PDF re-encode nahi) | ✅ Done |
| 32 | **ID card photo** — `pdfService.studentIdSlip` par photo (Cloudinary/local dono), enroll + reissue par | ✅ Done |
| 33 | **Test marks** — `testMarks` field, Pass/Fail par optional marks input, table + detail mein display | ✅ Done |
| 33 | **CSV export + date-range filter** — `GET /admissions/export` (filters ke saath), toolbar From/To dates + Export CSV button | ✅ Done |

---

## 🆕 2026-08-17 — Naye Todos (ORG_ADMIN removal ke baad)

| # | Item | Status |
|---|---|---|
| 35 | `/branch/org-overview` (old #12) — org-level admin nahi raha. **Decide:** route hatao ya sirf platform SUPER_ADMIN tak limit karo | ⏳ Pending |
| 36 | **Branch portal UI — branch name prominent** — Dashboard header (org small + branch bada heading) + Navbar heading branch name (`school?.name ?? title`) | ✅ Done |
| 37 | **Promotions UI** — branch portal (backend + `promotionService.ts` ready: bulk-promote / repeat / transfer-section / graduate / dropout, PromotionRecord history) — old #21 | ✅ Done |
| 38 | **Parent block UI** — branch portal (backend + `moderationService.blockParent` ready) | ❌ **Removed (2026-08-17)** — user decision: **parent portal nahi bnega** → parent-scope items scope se bahar. `blockParent` backend ready rahega, UI ab nahi banega |
| 39 | **Parent/student portal live data sections** — dashboard par abhi summary cards hain; attendance timeline, fee records, homework/circulars lists baqi — old #24 | ❌ **Removed (2026-08-17)** — parent portal live-data sections nahi bnenge (user decision). Student portal (agar bana) ke liye alag se decide hoga |
| 40 | **Student portal frontend** — backend ready (`POST /auth/student/login`, request/verify OTP, `/auth/student/me`) | ✅ Done (login + dashboard + 10 tabs + realtime + mobile-responsive) |
| 41 | **SMTP credentials configure** — emails abhi deliver nahi hote (`emailConfigured` warn karta hai) — old SUPER_ADMIN #1 | ⏳ Pending |
| 42 | **WhatsApp live creds** — service wired hai, env creds chahiye (`WA_ENABLED`, token, phone number id) — old SUPER_ADMIN #3 | ⏳ Pending |
| 44 | **Subdomain local browser test** — `{slug}.domain.com` → `/o/{slug}` (hosts file se) | ⏳ Pending |
| 46 | **Fee Records — month/year filter** — toolbar ke month/year ab `dueDateAfter`/`dueDateBefore` se list par filter karte hain (pehle sirf cosmetic the) | ✅ Done |
| 47 | **Fee Collection — server-side search** — `GET /students?search=&pageSize=100` (pehle sirf pehla page client-side filter hota tha → students miss) | ✅ Done |
| 48 | **Fee Structures — class name display** — raw `classId` ki jagah ab class ka naam dikhta hai | ✅ Done |
| 49 | **Oxford E2E API test script** — `Backend/scripts/e2e-oxford.js` (har tab + har branch-manager power + scope/RBAC boundaries; read-only default, `E2E_MUTATE=1` se create/update tests). **Chalane ke liye Postgres + Redis + backend up chahiye** | ⏳ Pending (infra up hone par chalao) |
| 50 | **Branch admin power audit** — extra rights hatai: (A) student permanent delete → SUPER_ADMIN only, (B) branch create → SUPER_ADMIN only, (C) school profile update → apni branch hi (scope guard), (D) fee reminders platform-wide bug → branch-scoped + month/year | ✅ Done |
| 51 | **Students CSV export** — `GET /students/export` + Export CSV button (filters ke saath) | ✅ Done |
| 52 | **Manual per-record fee reminder** — `POST /fees/records/:id/remind` + FeeRecords row mein Remind button ("agar kisi ko nahi gaya, admin dobara bheje") | ✅ Done |
| 53 | **Monthly fee vouchers + reminders scoped** — Generate Monthly + schoolId/month/year ab asal mein filter karte hain | ✅ Done |
| 54 | **Attendance module audit** — `getDailyReport` shape bug fix (dashboard cards 0 the) + daily cache bust on scan | ✅ Done |
| 55 | **Live Attendance tab** — `/branch/attendance/live`: WS realtime gate feed + Today's Records, summary cards | ✅ Done |
| 56 | **Virtualization** — `VirtualizedList` (dependency-free windowing); 10k daily records par sirf visible rows render | ✅ Done |
| 57 | **Pagination har jagah** — Fee Records (server, 50/page), Organizations (12/page), Branches (12/page), Branch Staff (25/page); shared `Pagination` component | ✅ Done |
| 58 | **Students tab: Add + Import hatao** — students sirf admission pipeline se bante hain (inquiry → approve → enroll); branch + superadmin dono tabs se Add/Import remove | ✅ Done |
| 59 | **Promotion UI** — `/branch/promotions` bulk promote (target year, from/to class+section, student checklist, select-all) + promotion history; `promotionService.bulkPromote` field-name bug fix | ✅ Done |
| 60 | **Student photo upload fix** — image limit 1MB→5MB (backend sab jagah) + frontend client-side size/format validation (JPG/PNG/WebP) | ✅ Done |
| 61 | **Passed Out button** — list + details mein, sirf school ki LAST class (e.g. Class 10/Matric) ke ACTIVE students ke liye; "Mark Graduated" → "Passed Out" | ✅ Done |
| 63 | **Promote All / Selected** — Promotions tab ab saare students (page-by-page, 1000 tak) load karta hai; "Promote All (N)" + "Promote Selected (M)" dono buttons | ✅ Done |
| 64 | **Photo upload backend fix** — HEIC/HEIF (iPhone) ab server-side JPEG me convert hota hai (pehle "backend issue" aata tha); client HEIC allow karta hai; email-wrap fix view modal me | ✅ Done |
| 65 | **Modern 2026 UI** — Student Details info ab table me (label/value rows); Promotion page redesign (gradient hero, sectioned cards, virtualized checklist, parallel student load — pehle sequential 10 requests slow the); Select component me custom chevron | ✅ Done |
| 66 | **Promotion page "students nhi arhe" fix** — live API test se confirm hua backend sahi hai (student Class 8-A me ACTIVE tha, Class 7-A khali thi). Fix: section dropdown me student count (`A (1)`), From Class select par populated section auto-select, smarter empty state | ✅ Done |

---

## ✅ 2026-08-24 — Leave Approval Wiring + Verification

| # | Item | Status |
|---|---|---|
| 67 | **Leave Approvals route wired** — `/branch/leave` route + `LeaveApprovalsPage` + nav link (`Leave Approvals` in sidebar, calendar icon) | ✅ Done |
| 68 | **Student block/unblock verified** — `StudentActions.tsx` wired in `StudentDetails.tsx`, Block/Unblock with reason dialog | ✅ Done |
| 69 | **Staff management verified** — `StaffListPage` + `StaffCreateModal` + `StaffEditModal` + `StaffImportModal` + password reset — sab wired at `/branch/staff` | ✅ Done |
| 70 | **Branch portal routes verified** — 24 routes exist (`/branch/*`), all page components present | ✅ Done |

---

## 📌 Future Ideas (abhi todo nahi)

- Subdomain ka **local browser test** (`hosts` file se) — code ready hai, sirf verify karna hai (see #44)
- Dynamic slug routes ko `/o/{slug}/*` ke andar migrate karna (abhi redirect alias hai)

---
<tool_call>
<function=bash>
<parameter=workdir>
D:\saas\ERP