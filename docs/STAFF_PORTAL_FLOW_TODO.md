# Staff Portal Flow — Todos

> Design: `docs/STAFF_PORTAL_FLOW.md` • Done: `docs/STAFF_PORTAL_FLOW_DONE.md`

---

## 🔴 High Priority — Pehle Ye Banao

| # | Item | Status |
|---|---|---|
| 1 | **Proper Teacher Dashboard** — `/teacher/dashboard` ab completed hai (`TeacherDashboard.tsx`: stats, today's timetable, upcoming PTMs, recent homework) | ✅ Done |
| 2 | **Accountant routing** — ACCOUNTANT role **remove ho chuka** (`constants.js` mein sirf 4 roles). `getRoleHomePath` ab ADMIN/RECEPTIONIST/TEACHER 3 roles handle karta hai | ❌ Removed (role gone) |
| 3 | **Accountant in seed** — ACCOUNTANT role ab exist nahi karta (seed mein ADMIN/TEACHER hain) | ❌ Removed (role gone) |

---

## 🟡 Medium Priority — Teacher Portal Improve

| # | Item | Status |
|---|---|---|
| 4 | **Homework Edit/Delete UI** — `HomeworkPage.tsx` mein edit modal + delete action exist | ✅ Done |
| 5 | **Conduct Remarks history view** — `ConductRemarksPage.tsx` mein "Your Remarks History" list + remark total | ✅ Done |
| 6 | **Teacher attendance scope audit** — SectionAttendancePage mein section dropdown **saare school sections** dikhata hai. Teacher ko sirf apni assignments dikhani chahiye | ⏳ Pending |
| 7 | **Homework list pagination UI** — backend `page/pageSize` support karta hai; frontend saara load karta hai | ⏳ Pending |

---

## 🟢 Done — Abhi Hai

| # | Item | Status |
|---|---|---|
| 8 | **Staff Attendance (Admin)** — Daily view (mark attendance + edit/delete) + Monthly view (ledger grid). Backend: `StaffAttendance` model, bulk mark API, Excel import, CSV export | ✅ Done |
| 9 | **Staff Leave Approval** — Teacher self-service (`/teacher/leave`), admin review (`PATCH /staff-leave/:id/review`), realtime WebSocket events, portal notifications | ✅ Done |
| 10 | **Teaching Assignments** — Teacher-grouped cards, assign/remove functionality | ✅ Done |
| 11 | **Section Attendance Detail Page** — Pagination support, section-wise attendance detail | ✅ Done |
| 12 | **Staff Attendance Edit Modal** — Edit individual attendance records from UI | ✅ Done |
| 13 | **Portal Notifications** — Realtime socket events for leave requests/reviews fixed | ✅ Done |
| 14 | **Singleton Password Login** — Portal password support for staff (check order: individual → portal password → school code) | ✅ Done |

---

## 🟡 Future — Baad Mein

| # | Item | Status |
|---|---|---|
| 15 | **Substitute Teacher UI** — backend substitute engine **ab exist nahi karta** (koi substitute module nahi) — full feature future scope | ⏳ Future |
| 16 | **Teacher dashboard timeline** — aaj ka period-by-period schedule with current period highlight | ⏳ Future |
| 17 | **Staff attendance reports** — monthly/quarterly summary reports with export | ⏳ Future |
| 18 | **Leave balance tracking** — remaining leaves count per staff member | ⏳ Future |

---

## 📌 Priority Order

1. **#1** Teacher Dashboard (basic portal improve)
2. **#2-3** Accountant routing + seed (role setup)
3. **#4-7** Teacher portal polish
4. **#8-14** Recently completed — Staff Attendance, Leave, Teaching Assignments
5. **#15-18** Future enhancements
