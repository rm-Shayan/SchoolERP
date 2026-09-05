# Student & Parent Portal — Complete Flow (Code-Verified)

> Singleton portal concept: Parent aur Student alag logins, lekin **ek hi merged dashboard**
> (`/parent/dashboard`) jo token type ke hisaab se view switch karta hai. Alag `/student`
> routes nahi — sab `/parent/*` par hai.

---

## 1. System Overview

Student/Parent portal ek **read-heavy, student-scoped** portal hai jo parents aur students
ko school data dekhta hai — attendance, fees, homework, notices, results, timetable,
conduct remarks, PTM sessions, aur leave requests. Dono roles ek hi UI share karte hain
(token type decide karta hai kaunsa view dikhe).

```
Login (/parent/login)
   ├─ Parent tab  → POST /auth/parent/login (schoolCode + phone + password)
   └─ Student tab → POST /auth/student/login (schoolCode + rollNumber + password)
         │
         ▼
   /parent/dashboard (ParentPortalPage = token router)
      ├─ parentToken  → ParentPortalView  (children[] + SiblingSelector)
      └─ studentToken → StudentPortalView (single student)
```

**Tech Stack (portal-specific):**
| Layer | Tech |
|---|---|
| Frontend | Next.js App Router + TypeScript, Redux Toolkit (portalSocketSlice), Tailwind CSS |
| Backend | Express — `Backend/src/modules/portal/` (routes, controller, service, repository) |
| Realtime | WebSocket (Socket.io) — `usePortalSocket` hook, section/school rooms |
| Auth | JWT (tokenType=parent/student, 30d expiry) — `authenticateAnyPortal` middleware |

---

## 2. Auth & Login Flow

### 2.1 Login — Two Tabs on `/parent/login`

`ParentLoginPage` — Next.js server component, branding/searchParams server-side read.

```
/parent/login (ParentLoginPage)
   │  OrgBrandingHeader (school name/logo/themeColor from DB)
   │  Tab switcher: Parent (Password) | Student (Roll No)
   │
   ├─ PARENT tab (ParentLoginForms)
   │    Fields: School Code + Phone Number (PK format) + Password
   │    POST /auth/parent/login { schoolCode, phone, password }
   │    → { token, parent{ children[] } }
   │    → localStorage.parentToken + parentProfile → /parent/dashboard
   │
   └─ STUDENT tab (StudentLoginForm)
        Fields: School Code + Roll Number + Password
        POST /auth/student/login { schoolCode, rollNumber, password }
        → { token, student{ profile } }
        → localStorage.studentToken + studentProfile → /parent/dashboard
```

**Validation:** `useForm` hook with `composeValidators`, `required`, `isPhonePK`, `minLength`.
Errors shown inline via `error` prop on `Input`. Submit button disabled while `isSubmitting`.

### 2.2 Password Model (Shared)

- `School.portalPassword` (bcrypt hashed, nullable) — branch admin `Settings → Portal Access` se set karta hai
- Null ho to **school code as password** fallback (case-insensitive)
- Branch admin API: `GET/PUT/DELETE /schools/:id/portal-password`
- **Staff login** bhi portal password support karta hai — check order: bcrypt → portal password → school code

### 2.3 Auth Middlewares

- `authenticateParent` — `tokenType === "parent"`, DB existence check, blocked parent/school/org reject
- `authenticateStudent` — `tokenType === "student"`, DB existence check, blocked student/school/org reject
- `authenticateAnyPortal` — dono mein se koi bhi (portal module ke routes par)

### 2.4 Token Types & Expiry

| Token | Expiry | Storage | Revoke On |
|---|---|---|---|
| `tokenType=parent` | 30 days | localStorage (`parentToken`) | logout, block, password change |
| `tokenType=student` | 30 days | localStorage (`studentToken`) | logout, block, password change |

### 2.5 OTP Flows (Backend-ready, Frontend nahi use karta)

- Parent OTP: `POST /auth/parent/request-otp` → `POST /auth/parent/verify-otp`
- Student OTP: `POST /auth/student/request-otp` (OTP parent ke email par jata hai)
- Abhi frontend sirf **direct login** use karta hai (password-based)

---

## 3. Portal Data APIs (`Backend/src/modules/portal/`)

Sab routes `authenticateAnyPortal` middleware se protected hain. Dono token types accept
karte hain — parent apne bachon ke liye, student khud.

| Endpoint | Method | Data | Scope Rule |
|---|---|---|---|
| `/portal/overview` | GET | attendance % (month), fee summary, homework count, circular count | parent → children's sections; student → own section |
| `/portal/attendance?month=&year=` | GET | daily records + month summary (P/L/A/L count, %) | studentIds |
| `/portal/fees` | GET | fee records + year summary (totalCharged/Paid/outstanding) | studentIds |
| `/portal/homework` | GET | recent homework (limit 20, teacher-grouped) | sectionIds |
| `/portal/study-material` | GET | study materials for child's sections (limit 50) | sectionIds |
| `/portal/circulars` | GET | school circulars (audience PARENTS/ALL) | schoolId |
| `/portal/results` | GET | published exam results (marksObtained/maxMarks) | studentIds |
| `/portal/timetable` | GET | weekly timetable slots (day + time + subject + teacher) | sectionIds |
| `/portal/conduct` | GET | conduct remarks (limit 20) | studentIds |
| `/portal/ptm` | GET | upcoming PTM sessions (SCHEDULED, future) | schoolId + sectionIds + studentIds |
| `/portal/leave` | GET | parent's leave requests for linked students | parentId + studentIds |
| `/portal/leave` | POST | create leave request (studentId, dateFrom, dateTo, reason) | studentId in portal.studentIds |

**Service layer:** `PortalService` resolves `req.portal` (parent or student) → `portalRepository`
queries Prisma with studentIds/sectionIds/schoolId. Student portal ke liye `parentId`
`_resolveParentId()` se resolve hota hai (student → parent lookup).

---

## 4. Frontend Architecture

### 4.1 Token Router (`ParentPortalPage.tsx`)

```
ParentPortalPage (client component)
   │  mounted state (SSR hydration mismatch avoid)
   ├─ localStorage.studentToken? → StudentPortalView
   └─ localStorage.parentToken?  → ParentPortalView
```

### 4.2 ParentPortalView

- `parentService.getMe()` → profile (name, whatsappNo, children[])
- `SiblingSelector` — horizontal chip list (active child select)
- `ChildSummaryCard` — School / Class / Section / Roll No + status badge
- `PortalTabNav` — desktop top tabs + mobile bottom nav (8 tabs)
- Tab content: `TAB_CONTENT[tab]` (record map)
- WebSocket: `usePortalSocket(sectionIds, schoolId)` — all children's sections join

### 4.3 StudentPortalView

- `portalService.studentGetMe()` → student profile (masked parentWhatsapp)
- Same `ChildSummaryCard` + `PortalTabNav` (no SiblingSelector — single student)
- Same tab content components (shared)
- WebSocket: `usePortalSocket([sectionId], schoolId)` — single section join

### 4.4 API Client Layer

| File | Role |
|---|---|
| `portalService.ts` | Student auth (login + getMe) — student token interceptor |
| `portalDataService.ts` | All portal data endpoints — auto-detects parent/student token |
| `parentService.ts` | Parent auth (login + getMe) — parent token interceptor |

`portalDataService.getAxios()` picks `studentToken` ya `parentToken` based on localStorage.
401 interceptor → clear token + redirect to `/parent/login`.

### 4.5 Tabs — Current State

| Tab | Component | API Endpoint | Data |
|---|---|---|---|
| Overview | `OverviewTab` | `/portal/overview` | Attendance ring, fee status, homework/circular counts, live events |
| Attendance | `AttendanceTab` | `/portal/attendance` | Calendar heat-strip + month stats + live feed |
| Fees | `FeesTab` | `/portal/fees` | Fee records (expandable cards) + payment history + summary cards |
| Homework | `HomeworkTab` | `/portal/homework` | Teacher-grouped cards + socket events |
| Materials | `StudyMaterialsTab` | `/portal/study-material` | Study materials list with type badges |
| Notices | `NoticesTab` | `/portal/circulars` | Circular cards + socket events |
| Results | `ResultsTab` | `/portal/results` | Exam-wise marks table |
| Timetable | `TimetableTab` | `/portal/timetable` | Weekly grid (day → slots) |
| Leave | `LeaveRequestsTab` | `/portal/leave` | Request list + form |
| Conduct | `ConductTab` | `/portal/conduct` | Teacher remarks with type badges (POSITIVE/NEGATIVE/etc) |
| PTM | `PTMTab` | `/portal/ptm` | Upcoming PTM sessions (date, time, location) |
| Profile | `ProfileTab` | localStorage | Parent: name/WhatsApp/phone/email + children. Student: name/roll/school/class/section |

---

## 5. Realtime (WebSocket)

### 5.1 `usePortalSocket` Hook

- Socket.io client connect (websocket + polling fallback)
- **Token selection:** reads `studentToken || parentToken || accessToken` (fixed — previously only read `accessToken` which meant parent/student sockets never connected)
- Joins `section:{id}` rooms (child's sections) + `school:{id}` room (circulars)
- Dispatches to `portalSocketRedux` slice

### 5.2 Events Listened

| Event | Dispatch | UI Effect |
|---|---|---|
| `portal:attendance_marked` | `addAttendanceEvent` | Live attendance feed (Overview + Attendance tab) |
| `portal:homework_broadcast` | `addHomeworkEvent` | Prepend to homework list (deduped by id) |
| `portal:circular_created` | `addCircularEvent` | Prepend to notices list (deduped by id) |
| `portal_notification_created` | `addPortalNotificationEvent` | In-app notification badge |

### 5.3 `usePortalEvents` Hook

Selectors for `connected`, `attendanceEvents`, `homeworkEvents`, `circularEvents` from
Redux store. Used in `OverviewLiveEvents`, `AttendanceTab` (live feed), `HomeworkTab`,
`NoticesTab`.

---

## 6. Mobile Responsiveness

- `PortalTabNav`: desktop = horizontal top tabs, mobile = **fixed bottom nav** (8 icons)
- `ChildSummaryCard`: 2-col mobile → 4-col desktop grid
- `FeesTab` table: `overflow-x-auto` for mobile scroll
- `AttendanceTab` calendar: `grid-cols-7` (always fits)
- `TimetableTab`: vertical list per day (mobile-friendly)
- All pages `min-h-screen bg-gray-50 pb-20 md:pb-0` (bottom nav padding on mobile)

---

## 7. Parent-Specific Features

### 7.1 Sibling Selector
- Parent ke multiple children → horizontal chip list (active child highlighted)
- Tab content **keyed by child ID** → child switch karne par data reload hota hai
- `ChildSummaryCard` updated child ke details dikhata hai

### 7.2 Leave Requests
- `LeaveRequestsTab` — request list + "New Request" button
- `LeaveForm` — child selector (agar 2+ children), date range, reason, submit
- Backend validation: date range check, overlapping approved leaves check
- School admin ko notification jata hai (email + WebSocket `leave_request_created`)
- Status badges: PENDING (yellow) / APPROVED (green) / REJECTED (red)

---

## 8. Student-Specific Features

### 8.1 Single Student View
- SiblingSelector nahi — single student ka profile dikhta hai
- `ChildSummaryCard` with student details
- Same tabs as parent (shared components)
- Leave form mein child selector nahi (sirf apni leave)

### 8.2 Parent WhatsApp (Masked)
- `StudentPortalDTO` mein `parentWhatsapp` masked hota hai (student ko poora number nahi dikhta)

---

## 9. Blocking / Security

- **Blocked parent/student:** login par standard message *"Admin deactivated your portal..."*
- **Blocked school:** saare portal users locked
- **Blocked org:** cascade — all schools → all portal users locked
- Token types strict: `authenticateParent` sirf `tokenType=parent`, `authenticateStudent` sirf `tokenType=student`
- `authenticateAnyPortal` dono accept karta hai (portal module routes)
- Branch isolation: `portal.studentIds` se scope enforce hota hai — apne bachon ka data
- 401 interceptor → automatic logout + redirect to `/parent/login`

---

## 10. Source Map

| Flow | File |
|---|---|
| Login page (branded) | `Frontend/src/app/parent/login/page.tsx` → `ParentLoginPage` |
| Dashboard page | `Frontend/src/app/parent/dashboard/page.tsx` → `ParentPortalPage` |
| Token router | `Frontend/src/features/parent/components/ParentPortalPage.tsx` |
| Parent view | `Frontend/src/features/parent/components/ParentPortalView.tsx` |
| Student view | `Frontend/src/features/parent/components/StudentPortalView.tsx` |
| Login forms | `ParentLoginForms.tsx` + `StudentLoginForm.tsx` |
| Tab navigation | `Frontend/src/features/parent/components/parts/PortalTabNav.tsx` |
| Tab components | `Frontend/src/features/parent/components/parts/OverviewTab.tsx` (+ siblings) |
| Shared cards | `Frontend/src/features/parent/components/portalCards.tsx` |
| Sibling selector | `Frontend/src/features/parent/components/SiblingSelector.tsx` |
| Profile tab | `Frontend/src/features/parent/components/parts/ProfileTab.tsx` |
| Conduct tab | `Frontend/src/features/parent/components/parts/ConductTab.tsx` |
| PTM tab | `Frontend/src/features/parent/components/parts/PTMTab.tsx` |
| Leave form | `Frontend/src/features/parent/components/parts/LeaveForm.tsx` |
| API: parent auth | `Frontend/src/lib/api/parentService.ts` |
| API: student auth | `Frontend/src/lib/api/portalService.ts` |
| API: portal data | `Frontend/src/lib/api/portalDataService.ts` |
| Types | `Frontend/src/types/portal.ts` |
| WebSocket hook | `Frontend/src/hooks/usePortalSocket.ts` |
| Events hook | `Frontend/src/hooks/usePortalEvents.ts` |
| Redux slice | `Frontend/src/store/slices/portalSocketSlice.ts` |
| Backend routes | `Backend/src/modules/portal/portal.routes.js` |
| Backend controller | `Backend/src/modules/portal/portal.controller.js` |
| Backend service | `Backend/src/modules/portal/portal.service.js` |
| Backend repository | `Backend/src/modules/portal/repository.js` |
| Auth middleware | `Backend/src/middlewares/auth.middleware.js` (authenticateParent/Student/AnyPortal) |
| Auth endpoints | `Backend/src/modules/auth/auth.routes.js` (parent/student login + OTP + me) |
