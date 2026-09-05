# Org Admin Flow — Complete (Code-Verified + Design)

> Is doc mein **organization (with slug)** ka poora flow hai:
> - Org ke **public pages** (slug ke saath — admission form, branding) — jahan data DB se dynamic aata hai
> - Org admin ka **login flow** (slug → org page → creds → branch)
> - Login ke baad **branch portal** (branch branding — ab koi branch switcher nahi)
>
> TODO (pending items) alag file mein: `docs/ORG_ADMIN_FLOW_TODO.md`.
> Super admin console wala flow: `docs/SUPER_ADMIN_FLOW.md`.
>
> **⚠️ 2026-08-17 — Org-level admin concept REMOVE:** ORG_ADMIN role, handover promotion
> (`_ensureOrgAdmin`), "Wahi admin manage kare" mode aur Branch Switcher sab hata diye gaye.
> Ab har branch ka apna ADMIN (Principal) hota hai — ek login se ek hi branch. Ye doc usi
> hisaab se update hai.

---

## 1. Organization With Slug — Concept

Har **Organization** ka ek **unique `slug`** hota hai (e.g. `falcon-academy`):

- Create par manually diya ja sakta hai ya **auto-generate** (code/name se `slugify`)
- Slug se branded URL banta hai: **`https://{domain}/o/{slug}`**
- Subdomain bhi support hai: **`{slug}.domain.com`** (`EntryRouter` detect karta hai)
- Credentials email mein org admin ko branded link `/o/{slug}` bheja jata hai

```
Organization (slug: "falcon-academy")
   ├── Public pages:  /o/falcon-academy  → admission form, branding (DB se data)
   ├── Login:         /o/falcon-academy  → org page → admin creds → branch
   └── Branch portal: /branch/* (active branch ke data par)
```

---

## 2. Public Pages — Har Org Ke Apne ✅ (2026-08-15)

> Bane hue hain — `/o/{slug}` landing + `/o/{slug}/admission` form. Flow:

### 2.1 Org Landing / Public Page — `/o/{slug}`

Jab koi visitor `https://{domain}/o/falcon-academy` kholta hai:

```
GET /o/{slug}
   → DB se data load (dynamic):
       org:     logoUrl, name, code, slug
       branches: schools[] (name, code, logoUrl, address)
       branding: themeColor
   → Page dikhata hai:
       - Org ka logo + naam (DB se)
       - Branches ki list (cards)
       - "Admission" button → admission form
       - "Admin Login" button → login form (same page ya /login)
```

**Kyu important:** log admission ke liye school ke paas aate hain — unhe koi form
chahiye jo public ho aur school ka branded dikhe. Har org ka apna page hoga kyunki
har org ka slug alag hai.

### 2.2 Public Admission Form — `/o/{slug}/admission`

```
Visitor → /o/{slug}/admission
   ├─ Form fields: student name, class, parent name, parent phone/email, message
   ├─ DB se: branch list (jis branch mein admission chahiye)
   ├─ Submit → POST /api/v1/admissions/inquiries (ya naya public endpoint)
   │    ├─ Applicant row banta hai (status: INQUIRY / PENDING)
   │    └─ Branch admin ko notification/email jati hai
   └─ Success screen: "Application received — school will contact you"
```

Backend admission module (`src/modules/admission/`) — public endpoints bane:
`GET /admissions/public/classes?schoolId=`, `POST /admissions/public/inquiry`
(koi auth nahi, `router.use(authenticate)` se pehle registered). Form frontend
bana hua hai (`frontend/nextjs/src/features/public/components/`).

### 2.3 Public Branding — Har Page Par DB Se Data

- **Logo, naam, themeColor, branches** — sab `GET /schools/branding?slug=` ya
  `GET /organizations/by-slug/:slug` se dynamic load
- Public pages par **kuch hardcode nahi** — har org ka apna branded look
- Branch-specific logo (`School.logoUrl`) bhi respect hoga

---

## 3. Login Flow — Org Admin (Branch Principal)

```
/o/{slug} (ya {slug}.domain.com)
   │
   ▼
Org public page / branded login (logo + naam DB se)
   │  admin apne credentials daalta hai (email/username + password + school code)
   │  ("Forgot password?" → /forgot-password — temp password email par)
   ▼
POST /api/v1/auth/login
   1. isActive check → blocked user message
   2. org/school BLOCKED check → "Admin deactivated your portal..."
   3. bcrypt verify
   4. tokens (access 15m + refresh 7d rotating)
   5. SETUP_PENDING org → markDeliveredOnLogin (ACTIVE)
   6. audit LOGIN
   ▼
getRoleHomePath(role)
   ADMIN → /branch/dashboard (apni branch ka portal)
```

**Flow:** `/o/{slug}` → org page (logo, naam, branches, admission button) → "Admin Login" →
`/login?org={slug}` branded login → login → **uski branch ka portal** khulta hai. Har ADMIN
sirf apni branch ka data dekhta hai (`lib/scope.js`).

---

## 4. Login Ke Baad — Branch Portal (verified)

Portal URL ab **`/o/{slug}/branch/*`** hai (Next.js App Router — `src/app/o/[slug]/branch/...`,
server-component wrappers + client feature components):

| Cheez | Kya hota hai | File |
|---|---|---|
| Sidebar | Org logo + branch name (title) + org name (subtitle) | `frontend/nextjs/src/layouts/Sidebar.tsx` |
| Navbar | **Branch ka naam** heading mein (org title subtitle) | `frontend/nextjs/src/layouts/Navbar.tsx` |
| Dashboard header | Org name (small) + **branch name (bada heading)** | `features/school/components/AdminDashboard.tsx` |
| Data scope | `lib/scope.js` — branch-scoped queries (har user apni branch par locked) | `Backend/src/lib/scope.js` |
| Pages | dashboard, students, admissions, academic, staff (+ password reset), teaching-assignments, fees, attendance, exams, ptm, promotions, study-material, announcements, settings | `frontend/nextjs/src/features/school/*`, route wrappers `src/app/o/[slug]/branch/*` |

**Branch kahan se aata hai:** `/auth/me` → nested `school` (apni branch) → `pickActiveSchool`
active branch. Ab koi branch switcher nahi — har staff user apni branch par locked hai.

**Staff password reset:** Staff edit modal mein **"Set New Login Password"** section — admin
kisi bhi staff ka naya password set kar sakta hai (`POST /auth/users/:id/reset-password`).

---

## 5. Branding — Kahan Se Aata Hai (verified)

| Source | Kya deta hai | Kahan use hota hai |
|---|---|---|
| `GET /schools/branding?slug=` | logoUrl, name, orgName, themeColor | Login screen (`LoginCard`) |
| `GET /schools/branding?code=` | same — branch code se | Login screen |
| Auth state (`organization`, `school`) | logo, name | Sidebar, Navbar, Dashboard (login ke baad) |
| `School.logoUrl` | Branch-specific logo | Sidebar — branch logo pehle, org logo fallback (`school?.logoUrl || organization?.logoUrl`) |

---

## 6. Source Map

| Flow | File |
|---|---|
| Org create + slug | `Backend/src/modules/organization/organization.service.js`, `provision.js` |
| Public branding endpoint | `Backend/src/modules/school/school.service.js` → `branding()` |
| Login, tokens, forgot-password | `Backend/src/modules/auth/auth.service.js` |
| Slug route `/o/[slug]` | `frontend/nextjs/src/app/o/[slug]/page.tsx` (Next.js file-based routing) |
| Subdomain detect | `frontend/nextjs/src/features/auth/components/EntryRouter.tsx` |
| Branded login screen (SSR-friendly) | `frontend/nextjs/src/features/auth/components/LoginCard.tsx`, `app/login/page.tsx` (server comp reads searchParams) |
| Branch portal | `frontend/nextjs/src/features/school/*`, layouts `frontend/nextjs/src/layouts/*` |
| Portal Access settings (shared parent/student password) | `features/school/components/parts/PortalAccessSection.tsx`, backend `school.service.js` |
| Admission (backend) | `Backend/src/modules/admission/*` |
| Org admin TODO | `docs/ORG_ADMIN_FLOW_TODO.md` |
| Org-level admin (REMOVED 2026-08-17) | `_ensureOrgAdmin` / `findOrgAdmin` / BranchSwitcher — sab hat gaye; migration `20260817000400_remove_org_admin_role` |
