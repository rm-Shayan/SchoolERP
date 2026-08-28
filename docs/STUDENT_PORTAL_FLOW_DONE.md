# Student & Parent Portal — Done (Code-Verified Log)

> Design/state: `docs/STUDENT_PORTAL_FLOW.md` • Pending items: `docs/STUDENT_PORTAL_FLOW_TODO.md`
>
> Ye log un cheezon ka hai jo code mein verified hui — routes, RBAC,
> frontend components, backend modules, WebSocket, aur responsive design sab check kiya gaya.

---

## ✅ Auth & Login

| # | Item | Status |
|---|---|---|
| 1 | **Parent direct login** — `POST /auth/parent/login` (schoolCode + phone + password), `authenticateParent` middleware, `tokenType=parent` (30d) | ✅ Done |
| 2 | **Student direct login** — `POST /auth/student/login` (schoolCode + rollNumber + password), `authenticateStudent` middleware, `tokenType=student` (30d) | ✅ Done |
| 3 | **Parent OTP flow** — `POST /auth/parent/request-otp` → `POST /auth/parent/verify-otp` (backend ready) | ✅ Done |
| 4 | **Student OTP flow** — `POST /auth/student/request-otp` (OTP parent ke email par) (backend ready) | ✅ Done |
| 5 | **Separate JWT types** — `tokenType=parent` / `tokenType=student`, 30-day expiry, DB-stored | ✅ Done |
| 6 | **Block enforcement** — blocked parent/student/school/org sab portals se bahar | ✅ Done |
| 7 | **Shared portal password** — `School.portalPassword` (bcrypt) + school code fallback + branch-admin manage UI/API | ✅ Done |
| 8 | **Staff login portal password support** — staff login bhi portal password accept karta hai (check order: bcrypt → portal password → school code) | ✅ Done |
| 9 | **Audit logging** — PARENT_LOGIN, STUDENT_LOGIN actions logged | ✅ Done |
| 10 | **`/auth/parent/me`** + `/auth/student/me`** — profile endpoints | ✅ Done |

---

## ✅ Backend Portal Module

| # | Item | Status |
|---|---|---|
| 11 | **`Backend/src/modules/portal/`** — routes, controller, service, repository (4 files) | ✅ Done |
| 12 | **`authenticateAnyPortal` middleware** — parent OR student token accept karta hai | ✅ Done |
| 13 | **GET `/portal/overview`** — attendance % + fee summary + homework/circular counts (single call) | ✅ Done |
| 14 | **GET `/portal/attendance`** — month/year params, daily records + summary (P/L/A/L count, %) | ✅ Done |
| 15 | **GET `/portal/fees`** — fee records + payment history + year summary | ✅ Done |
| 16 | **GET `/portal/homework`** — section-scoped, limit 20, teacher-grouped | ✅ Done |
| 17 | **GET `/portal/circulars`** — school-scoped, audience PARENTS/ALL | ✅ Done |
| 18 | **GET `/portal/results`** — student-scoped exam results (marksObtained/maxMarks) | ✅ Done |
| 19 | **GET `/portal/timetable`** — section-scoped weekly slots (day + time + subject + teacher) | ✅ Done |
| 20 | **GET `/portal/conduct`** — student-scoped conduct remarks (limit 20) | ✅ Done |
| 21 | **GET `/portal/ptm`** — school + section + student scoped, future SCHEDULED sessions | ✅ Done |
| 22 | **GET `/portal/leave`** — parent's leave requests for linked students | ✅ Done |
| 23 | **POST `/portal/leave`** — create leave request (date range, reason, overlap check, admin notify) | ✅ Done |
| 24 | **Scope isolation** — parent → children's studentIds; student → own studentIds. Branch-locked | ✅ Done |

---

## ✅ Frontend — Login Pages

| # | Item | Status |
|---|---|---|
| 25 | **`/parent/login` route** — Next.js App Router page, server component, branding/server-side read | ✅ Done |
| 26 | **`ParentLoginPage`** — tab switcher (Parent Password / Student Roll No), OrgBrandingHeader | ✅ Done |
| 27 | **`ParentLoginForms`** — School Code + Phone (PK format) + Password, `useForm` validation | ✅ Done |
| 28 | **`StudentLoginForm`** — School Code + Roll Number + Password, `useForm` validation | ✅ Done |
| 29 | **Error handling** — inline error display, loading state, toast success | ✅ Done |
| 30 | **Branded login** — `useOrgBranding` hook, school logo/name/themeColor from DB | ✅ Done |

---

## ✅ Frontend — Dashboard & Navigation

| # | Item | Status |
|---|---|---|
| 31 | **`/parent/dashboard` route** — Next.js App Router page | ✅ Done |
| 32 | **`ParentPortalPage`** — token router (mounted state, SSR hydration safe) | ✅ Done |
| 33 | **`ParentPortalView`** — parent profile + children + SiblingSelector + tabs | ✅ Done |
| 34 | **`StudentPortalView`** — single student profile + tabs (no SiblingSelector) | ✅ Done |
| 35 | **`PortalTabNav`** — desktop top tabs + mobile bottom nav (8 tabs) | ✅ Done |
| 36 | **`ChildSummaryCard`** — School / Class / Section / Roll No + status badge | ✅ Done |
| 37 | **`SiblingSelector`** — horizontal chip list for parent's multiple children | ✅ Done |
| 38 | **`PortalHeader`** — sticky header with title, subtitle, Home link, Sign out | ✅ Done |
| 39 | **`PortalBrandIcon`** — branded icon for auth screens | ✅ Done |

---

## ✅ Frontend — Tab Components

| # | Item | Status |
|---|---|---|
| 40 | **`OverviewTab`** — attendance ring (%), fee status card, quick stats (homework/circular/dues), live events | ✅ Done |
| 41 | **`AttendanceTab`** — month navigator, calendar heat-strip, summary cards (P/L/A/L), live feed | ✅ Done |
| 42 | **`FeesTab`** — fee summary cards (totalCharged/Paid/outstanding/records), records table with status badges | ✅ Done |
| 43 | **`HomeworkTab`** — teacher-grouped cards, socket event merge (deduped by id), attachment links | ✅ Done |
| 44 | **`NoticesTab`** — circular cards, audience badge, socket event merge (deduped by id), attachment links | ✅ Done |
| 45 | **`ResultsTab`** — exam-wise grouped marks table, total/percentage calculation, color-coded % | ✅ Done |
| 46 | **`TimetableTab`** — weekly grid (day → slots), color-coded day badges, teacher + time display | ✅ Done |
| 47 | **`LeaveRequestsTab`** — request list + "New Request" button + LeaveForm toggle | ✅ Done |
| 48 | **`LeaveForm`** — child selector (multi-child), date range, reason, `useForm` validation, submit | ✅ Done |
| 49 | **`OverviewLiveEvents`** — LiveBadge + RecentEvents (attendance + homework + circular from socket) | ✅ Done |

---

## ✅ Frontend — API Clients & Types

| # | Item | Status |
|---|---|---|
| 50 | **`parentService.ts`** — parent auth (login + getMe), parent token interceptor, 401 auto-logout | ✅ Done |
| 51 | **`portalService.ts`** — student auth (studentLogin + studentGetMe), student token interceptor | ✅ Done |
| 52 | **`portalDataService.ts`** — all portal data endpoints, auto-detect parent/student token | ✅ Done |
| 53 | **`types/portal.ts`** — full type definitions (PortalOverview, PortalAttendanceRecord, PortalFeeRecord, etc.) | ✅ Done |

---

## ✅ Realtime (WebSocket)

| # | Item | Status |
|---|---|---|
| 54 | **`usePortalSocket` hook** — Socket.io connect, join section/school rooms, dispatch to Redux. Token fix: reads `studentToken \|\| parentToken \|\| accessToken` (previously only `accessToken` which meant parent/student sockets never connected) | ✅ Done |
| 55 | **`usePortalEvents` hook** — selectors for connected, attendance/homework/circular events | ✅ Done |
| 56 | **`portalSocketSlice`** — Redux slice (connected + events arrays + add/clear actions + `addPortalNotificationEvent`) | ✅ Done |
| 57 | **`portal:attendance_marked`** — live attendance feed in Overview + Attendance tab | ✅ Done |
| 58 | **`portal:homework_broadcast`** — prepend to homework list (deduped) | ✅ Done |
| 59 | **`portal:circular_created`** — prepend to notices list (deduped) | ✅ Done |
| 60 | **`portal_notification_created`** — dispatches `addPortalNotificationEvent` → in-app notification badge | ✅ Done |

---

## ✅ Mobile Responsiveness

| # | Item | Status |
|---|---|---|
| 61 | **Bottom navigation** — `PortalTabNav` mobile bottom nav (fixed, 8 icons, safe-area-bottom) | ✅ Done |
| 62 | **Responsive grids** — `ChildSummaryCard` 2-col mobile → 4-col desktop | ✅ Done |
| 63 | **Scrollable tables** — `FeesTab` overflow-x-auto on mobile | ✅ Done |
| 64 | **Calendar grid** — `AttendanceTab` grid-cols-7 (always fits mobile) | ✅ Done |
| 65 | **Layout padding** — `pb-20 md:pb-0` (bottom nav padding on mobile) | ✅ Done |

---

## ✅ Skeleton Loading

| # | Item | Status |
|---|---|---|
| 66 | **`PortalSkeletonsA`** — OverviewSkeleton, AttendanceSkeleton, FeesSkeleton | ✅ Done |
| 67 | **`PortalSkeletonsB`** — HomeworkSkeleton, NoticesSkeleton, ResultsSkeleton, TimetableSkeleton | ✅ Done |
| 68 | **Auth loading screen** — `AuthCenteredScreen` + `Loading` for profile fetch | ✅ Done |

---

## ✅ Security & Blocking

| # | Item | Status |
|---|---|---|
| 69 | **Token type strict** — `authenticateParent` sirf `tokenType=parent`, `authenticateStudent` sirf `tokenType=student` | ✅ Done |
| 70 | **Branch isolation** — `portal.studentIds` se scope enforce, cross-branch data access nahi | ✅ Done |
| 71 | **401 auto-logout** — token clear + redirect to `/parent/login` | ✅ Done |
| 72 | **Block cascade** — blocked parent/student/school/org → portal se bahar | ✅ Done |

---

## ✅ Documentation

| # | Item | Status |
|---|---|---|
| 73 | `STUDENT_PORTAL_FLOW.md` — yeh flow file (code-verified) | ✅ Done |
| 74 | `STUDENT_PORTAL_FLOW_TODO.md` — pending items | ✅ Done |
| 75 | `STUDENT_PORTAL_FLOW_DONE.md` — yeh completed log | ✅ Done |

---

## ✅ Fee Payment History (Expandable Rows)

| # | Item | Status |
|---|---|---|
| 76 | **`FeesTab` expandable rows** — fee records ab card-based hain with expand/collapse. Click par payment history dikhta hai (method + date + amount). Outstanding balance red card mein. Mobile-responsive 2-col grid. Summary cards ab `formatCurrency` use karti hain | ✅ Done |

---

## ✅ Profile Self-View

| # | Item | Status |
|---|---|---|
| 77 | **`ProfileTab` component** — parent/student dono ke liye profile view. Parent: name, avatar, WhatsApp, phone, email, member since + linked children list. Student: name, avatar, roll number, school, class, section, parent WhatsApp (masked), status | ✅ Done |
| 78 | **`PortalTab` type updated** — `'profile'` tab added to `PortalTab` union type + `TABS` array with user icon | ✅ Done |
| 79 | **Wired into both views** — `ParentPortalView` + `StudentPortalView` dono mein `TAB_CONTENT.profile = ProfileTab` | ✅ Done |
| 80 | **`ProfileSkeleton`** — loading skeleton added to `PortalSkeletonsA.tsx` (avatar + info rows + children list) | ✅ Done |

---

## ✅ Conduct Remarks & PTM Tabs

| # | Item | Status |
|---|---|---|
| 81 | **`ConductTab` component** — teacher-grouped remark cards with type badges (POSITIVE/NEGATIVE/NEUTRAL/WARNING/PRAISE), color-coded icons, teacher name, date. Empty state when no remarks | ✅ Done |
| 82 | **`PTMTab` component** — upcoming PTM session cards with date badge (month+day), title, description, time, location. Today highlight. Empty state when no sessions | ✅ Done |
| 83 | **`PortalTab` type updated** — `'conduct'` and `'ptm'` added to union type + TABS array with icons (check-circle for conduct, users for PTM) | ✅ Done |
| 84 | **`ConductSkeleton` + `PTMSkeleton`** — loading skeletons added to `PortalSkeletonsB.tsx` | ✅ Done |
| 85 | **Wired into both views** — `ParentPortalView` + `StudentPortalView` dono mein `TAB_CONTENT.conduct = ConductTab` + `TAB_CONTENT.ptm = PTMTab` | ✅ Done |
