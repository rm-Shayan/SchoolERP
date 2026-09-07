# Staff Portal Flow — Simplified (Code-Verified)

> **Abhi ke liye:** Teacher, Receptionist, Accountant — in 3 roles ke liye portal.
> Saath mein: Staff Attendance, Staff Leave, Teaching Assignments — ye sab bhi cover hota hai.
> Baaki roles (GATE_STAFF etc.) future mein custom add honge.
>
> Todos: `docs/STAFF_PORTAL_FLOW_TODO.md` • Completed: `docs/STAFF_PORTAL_FLOW_DONE.md`

---

## 1. Roles — Abhi Kya Hai

| Role | Matlab | Portal | Kya karega |
|---|---|---|---|
| `ADMIN` (Principal) | Branch Head | `/branch/*` | Saara branch manage (see ORG_ADMIN_FLOW) |
| `TEACHER` | Class Teacher | `/teacher/*` | Student attendance, homework, conduct remarks, timetable, exams, staff leave |
| `RECEPTIONIST` | Front Desk | `/branch/*` | Admissions, student inquiries, front desk kaam |
| `ACCOUNTANT` | Fee Staff | `/branch/*` | Fee structures, fee records, fee collection |

**New Features Covered:**
- **Staff Attendance** — Admin staff ki attendance mark karta hai (daily + monthly views)
- **Staff Leave** — Teachers apni leave request kar sakte hain, admin approve/reject karta hai
- **Teaching Assignments** — Teacher-grouped cards, assign/remove functionality

**Note:** GATE_STAFF, SUPER_ADMIN etc. baad mein add honge. Abhi sirf ye 4.

---

## 2. Login & Routing

```
Login (/login, branded ?org={slug})
   → POST /api/v1/auth/login
   → getRoleHomePath(role, slug)
        ADMIN        → {base}/branch/dashboard
        TEACHER      → {base}/teacher/dashboard
        RECEPTIONIST → {base}/branch/dashboard  (same as ADMIN)
        ACCOUNTANT   → {base}/branch/dashboard  (same as ADMIN)
```

### Portal Password (Singleton)

Staff login ab **portal password** support karta hai. Check order:
1. **Individual bcrypt** — staff ka personal password
2. **Portal password** — singleton (ek hi password for all staff)
3. **School code** — fallback

Agar individual password match nahi hota, portal password try hota hai. Agar wo bhi nahi, school code se check hota hai.

**Teacher ka alag portal hai** (`/teacher/*`), baaki sab branch portal share karte hain
(`/branch/*`) — lekin RBAC se kaun kya kar sakta hai wo control hota hai.

---

## 3. Teacher Portal (`/teacher/*`)

### 3.1 Layout

`TeacherLayout.tsx` → `DashboardLayout links={teacherLinks}`

**Sidebar:** Dashboard • Section Attendance • Homework • Study Materials • Conduct Remarks • My Timetable • Exams • Announcements • My Leave

### 3.2 Section Attendance

```
Section select → Roster load (ACTIVE students) → Default PRESENT
   → Per-student toggle → Save → POST /attendance/section-bulk
```

Teacher sirf apni assigned sections ki attendance mark kar sakta hai.

### 3.3 Homework

```
New Homework → Modal (section + title + content) → POST /homework
   → Backend: har ACTIVE student ke parent ko EMAIL
   → Card grid list
```

### 3.4 Study Materials

```
New Material → Modal (title, type, description, URL, section) → POST /study-material
   → Teachers can only upload for their sections
   → Teachers can only edit/delete their own materials
   → Card grid list with type badges (DOCUMENT/VIDEO/IMAGE/LINK)
```

**Access:** ACADEMIC group (SUPER_ADMIN, ADMIN, TEACHER) — RECEPTIONIST excluded.

### 3.5 Conduct Remarks

```
Form: Section → Student → Type (POSITIVE/NEGATIVE/NEUTRAL) → Comment
   → POST /conduct/remarks → Parent EMAIL
```

### 3.5 My Timetable

```
GET /timetable/teacher/:teacherId → Weekly grid (Period × Days)
```

### 3.6 Exams & Results

```
Year select → Exam list (sirf apni assignments) → Results upload
```

### 3.7 Announcements

```
Circulars (audience: TEACHERS/ALL) → Read-only list
```

### 3.8 My Leave

```
GET /staff-leave → list (apni leave requests)
POST /staff-leave → nayi leave request create
Status: PENDING → APPROVED / REJECTED
```

Teacher self-service ke liye `/teacher/leave` par jaake leave request kar sakta hai.

---

## 4. Receptionist Portal (`/branch/*`)

> **2026-09-07 update:** Receptionist ka apna dedicated nav links hai (Front Desk, Finance, Attendance, Academics, Communication groups). Branch layout detects RECEPTIONIST role and shows `receptionistLinks` instead of `adminLinks`.

### 4.1 Admission Pipeline

Receptionist ka main kaam — **admissions handle karna:**

```
INQUIRY → TEST_SCHEDULED → TEST_PASSED / TEST_FAILED → FORM_SUBMITTED
       → APPROVED → FEE_PENDING → ENROLLED
                     (REJECTED kabhi bhi)
```

| Step | Kya karta hai | Backend |
|---|---|---|
| **New Inquiry** | "New Inquiry" button → modal (name, phone, class, etc.) | `POST /admissions/public/inquiry` |
| **Schedule Test** | Applicant select → "Schedule Test" action | `PATCH /admissions/:id/status` |
| **Mark Pass/Fail** | Test result update | `PATCH /admissions/:id/status` |
| **Approve** | APPROVED + admission slip PDF generate + parent email | `POST /admissions/:id/approve` |
| **Record Advance Fee** | Fee payment record | `POST /admissions/:id/advance-fee` |
| **Enroll** | Student create + QR ID card + parent email | `POST /admissions/:id/enroll` |
| **Reject** | REJECTED status | `PATCH /admissions/:id/status` |

**Frontend:** `AdmissionsPage` — pipeline summary, filters, table, action modals, import modal

### 4.2 What Receptionist CAN Do

| Page | Route | Access |
|---|---|---|
| Admissions | `/branch/admissions` | ✅ ADMISSIONS group |
| Students (read) | `/branch/students` | ✅ ALL_STAFF |
| Attendance (read) | `/branch/attendance/records` | ✅ ALL_STAFF |
| Fee Records (read) | `/branch/fees/records` | ✅ ALL_STAFF |
| Notifications | `/branch/notifications` | ✅ ALL_STAFF |

### 4.3 What Receptionist CANNOT Do

| Page | Route | Access |
|---|---|---|
| Staff Management | `/branch/staff` | ❌ MANAGEMENT only (ADMIN) |
| Academic Setup | `/branch/academic` | ❌ MANAGEMENT only |
| Fee Structures | `/branch/fees/structures` | ❌ FINANCE only (ADMIN/ACCOUNTANT) |
| Fee Collection | `/branch/fees/collection` | ❌ FINANCE only |
| Settings | `/branch/settings` | ❌ MANAGEMENT only |
| Import Data | `/branch/import-guide` | ❌ MANAGEMENT only |
| Issue TC / Rollback lifecycle | Student status changes | ❌ MANAGEMENT only (ADMIN/SUPER_ADMIN) |
| Student status change | `PATCH /students/:id/status` | ❌ MANAGEMENT only |

---

## 5. Accountant Portal (`/branch/*`)

### 5.1 Fee Management

Accountant ka main kaam — **fees handle karna:**

| Task | Route | Kya karta hai |
|---|---|---|
| **Fee Structures** | `/branch/fees/structures` | Class-wise fee define (tuition, exam, etc.) |
| **Fee Records** | `/branch/fees/records` | Har student ka fee status (PAID/PARTIAL/UNPAID/OVERDUE) |
| **Fee Collection** | `/branch/fees/collection` | Payment record karna + receipt generate |

### 5.2 Fee Flow

```
1. Fee Structure banao (class + line items: "Tuition: 5000", "Exam: 1000")
2. Generate Monthly Fees → active students ke liye records auto-bante hain
3. Payment record karo → paidAmount update → status recompute
4. Receipt PDF generate → parent ko email
5. Daily scheduler: overdue sweep (past-due → OVERDUE) + reminder emails
```

### 5.3 What Accountant CAN Do

| Page | Route | Access |
|---|---|---|
| Fee Structures | `/branch/fees/structures` | ✅ FINANCE group |
| Fee Records | `/branch/fees/records` | ✅ FINANCE group |
| Fee Collection | `/branch/fees/collection` | ✅ FINANCE group |
| Dashboard | `/branch/dashboard` | ✅ ALL_STAFF |
| Students (read) | `/branch/students` | ✅ ALL_STAFF |
| Attendance (read) | `/branch/attendance/records` | ✅ ALL_STAFF |

### 5.4 What Accountant CANNOT Do

| Page | Route | Access |
|---|---|---|
| Staff Management | `/branch/staff` | ❌ MANAGEMENT only |
| Academic Setup | `/branch/academic` | ❌ MANAGEMENT only |
| Admissions | `/branch/admissions` | ❌ ADMISSIONS only (ADMIN/RECEPTIONIST) |
| Settings | `/branch/settings` | ❌ MANAGEMENT only |

---

## 6. Staff Attendance (Admin Side) — ✅ Done

> **Abhi hai** — complete ho chuka hai.

Admin staff ki attendance record karta hai — daily mark karta hai aur monthly view mein dekh sakta hai.

### 6.1 Backend

**Model:** `StaffAttendance`
- `date` — attendance date
- `status` — `PRESENT | ABSENT | LATE | LEAVE | HALF_DAY`
- `checkIn` — check-in time
- `checkOut` — check-out time
- `leaveType` — leave type (sick, casual, etc.)
- `dateTo` — leave end date (for multi-day leaves)
- `reason` — reason for leave/absence
- `reviewedBy` — admin jo approve kare
- `reviewedAt` — review timestamp

**Staff Leave Statuses:**
- `PENDING_LEAVE` — request submitted, admin ne review nahi kiya
- `APPROVED_LEAVE` — admin ne approve kar diya
- `REJECTED_LEAVE` — admin ne reject kar diya

### 6.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/staff-attendance` | Bulk mark attendance (multiple staff at once) |
| `PUT` | `/staff-attendance/:id` | Update single attendance record |
| `DELETE` | `/staff-attendance/:id` | Delete attendance record |
| `GET` | `/staff-attendance` | List attendance (daily/monthly view) |

### 6.3 Frontend

**Staff Attendance Page** — `/branch/staff-attendance`
- **Daily View** — Staff list dikhaata hai, per-student mark karta hai (PRESENT/ABSENT/LATE/LEAVE/HALF_DAY), check-in/check-out time, edit/delete
- **Monthly View** — Ledger grid (staff × dates), har cell mein status color-coded
- **Staff Attendance Edit Modal** — Edit mode for individual records
- **Section Attendance Detail Page** — Section-wise detail with pagination

### 6.4 Import/Export

- **Excel Import** — Bulk attendance upload via Excel file
- **CSV Export** — Attendance data download as CSV

---

## 7. Leave Approval (Admin Side) — ✅ Done

> **Abhi hai** — complete ho chuka hai.

Staff leave request karta hai, admin approve/reject karta hai. Real-time updates milte hain.

### 7.1 Staff Leave — Self-Service

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/staff-leave` | Leave request create (teacher apni taraf se) |
| `GET` | `/staff-leave` | Apni leave requests list |

**Teacher Portal:** `/teacher/leave` — "My Leave" link for self-service leave request

### 7.2 Admin Review

| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/staff-leave/:id/review` | Approve ya reject (body: `status: APPROVED_LEAVE | REJECTED_LEAVE`) |

### 7.3 Realtime Updates

| Event | Description |
|---|---|
| `staff_leave_request_created` | Jab nayi leave request aaye — admin ko turant notification |
| `staff_leave_request_reviewed` | Jab admin approve/reject kare — teacher ko turant update |

### 7.4 Notifications

- **Portal Notification** — Sirf portal mein dikhta hai (NO email for staff leave requests)
- **WebSocket** — Real-time socket events for instant updates

---

## 8. RBAC Map

| Group | Roles | Use |
|---|---|---|
| `ALL_STAFF` | SUPER_ADMIN, ADMIN, TEACHER, GATE_STAFF, ACCOUNTANT, RECEPTIONIST | Read operations |
| `MANAGEMENT` | SUPER_ADMIN, ADMIN | Staff CRUD, settings, imports |
| `ACADEMIC` | SUPER_ADMIN, ADMIN, TEACHER | Homework, study materials, conduct, timetable |
| `FINANCE` | SUPER_ADMIN, ADMIN, ACCOUNTANT | Fee structures/records/collection |
| `ADMISSIONS` | SUPER_ADMIN, ADMIN, RECEPTIONIST | Admission pipeline |
| `ATTENDANCE` | SUPER_ADMIN, ADMIN, GATE_STAFF, TEACHER | Attendance marking |

---

## 9. Source Map

| Flow | File |
|---|---|
| Role routing | `Frontend/src/lib/utils/index.ts` → `getRoleHomePath` |
| Teacher layout | `Frontend/src/components/TeacherLayout.tsx` |
| Branch layout | `Frontend/src/components/BranchLayout.tsx` |
| Nav links | `Frontend/src/config/navLinks.ts` |
| Teacher routes | `Frontend/src/app/teacher/*` |
| Branch routes | `Frontend/src/app/branch/*` |
| Admissions | `Frontend/src/features/admissions/components/*` |
| Fee pages | `Frontend/src/app/branch/fees/*` |
| Staff mgmt | `Frontend/src/features/staff/components/*` |
| Staff attendance | `Frontend/src/app/branch/staff-attendance/*` |
| Staff leave | `Frontend/src/app/teacher/leave/*` |
| Teaching assignments | `Frontend/src/features/staff/components/TeachingAssignments*` |
