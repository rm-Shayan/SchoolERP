# Student & Parent Portal — Todos

> Design/state doc: `docs/STUDENT_PORTAL_FLOW.md` (code-verified).
> Completed log: `docs/STUDENT_PORTAL_FLOW_DONE.md`.
> Format same as other portal docs — naye items number se add hote rahenge.

---

## ⏳ Pending

| # | Item | Status |
|---|---|---|
| 5 | **Leave Request Status Updates (Realtime)** — leave request create hone par WebSocket `leave_request_created` event aata hai, lekin frontend tab mein **status change realtime nahi dikhta** — approve/reject hone par refresh chahiye ya WS listener | ⏳ Pending |
| 7 | **Attendance Year View** — `AttendanceTab` sirf month view dikhata hai. Year summary (totalPresent/totalDays/percentage across months) + month selector improvement | ⏳ Pending |
| 9 | **Session Expiry UX** — 401 par seedha redirect hota hai. Better UX: token expiry se 5 min pehle warning dialog → "Your session is about to expire" → extend/logout option | ⏳ Pending |
| 10 | **Loading Skeletons — Har Tab Mein** — `PortalSkeletonsA` aur `PortalSkeletonsB` hain lekin sab tabs mein nahi use ho rahe. Overview, Attendance, Fees, Homework, Notices, Results, Timetable sab mein consistent skeletons | ⏳ Pending |
| 11 | **Conduct Remarks Filter** — conduct tab mein teacher/type/date filter add karo (backend `GET /remarks/students/:id` ready hai) | ⏳ Pending |
| 12 | **PTM Session RSVP** — PTM session par "Attending" / "Not Attending" mark karo (backend extension chahiye — currently read-only) | ⏳ Pending |
| 13 | **Leave Request Cancel** — parent/student leave request cancel kar sake (PENDING status par) — backend `PATCH /leave/:id/cancel` banana padega | ⏳ Pending |
| 14 | **Branded Login Pages** — `/o/{slug}/parent` aur `/o/{slug}/student` dedicated branded login pages (abhi sirf `/parent/login` hai, slug-based branding `?code=` se aati hai) | ⏳ Pending |
| 15 | **Notification Inbox** — parent/student ko school se notifications aayein (fee reminders, absence alerts, circulars) — persisted read status ke saath. Abhi sirf email se jate hain | ⏳ Pending |
| 16 | **Fee Receipt Download** — parent fee receipt PDF download kar sake (backend `fee-receipt-*.pdf` generate hota hai lekin portal se accessible nahi) | ⏳ Pending |
| 17 | **Admission Status Check** — parent apne bachche ka admission status dekh sake (INQUIRY → ENROLLED pipeline) — `Applicant` model ready hai, portal endpoint nahi | ⏳ Pending |
| 18 | **Dark Mode** — portal mein dark mode support (Tailwind `dark:` classes) — low priority | ⏳ Pending |

---

## 📌 Note

- **Item #5** realtime UX improve karega
- **Item #7** data visibility badhayen
- **Items #9-10** polish aur UX improvements
- **Items #11-18** feature extensions
- Jab bhi koi item complete ho → `STUDENT_PORTAL_FLOW_DONE.md` mein move karo
- **Frontend rule:** har file `<= 150 lines` (AGENTS.md) — naye tabs/components `parts/` folder mein
