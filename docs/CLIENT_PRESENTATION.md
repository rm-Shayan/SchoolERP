# SchoolERP - The Future of Campus Management
**A Next-Generation Multi-Tenant Platform for Modern Schools**

Welcome to **SchoolERP**, the ultimate SaaS platform engineered to digitize and streamline every aspect of school operations. Whether managing a single campus or a network of branches across regions, SchoolERP provides the scalable infrastructure, security, and real-time connectivity you need.

---

## 🚀 1. The SchoolERP Advantage (Why Us?)
* **Unified Ecosystem:** No more juggling multiple software solutions. SchoolERP brings together academics, HR, finance, communication, and administration under one roof.
* **Role-Based Portals:** Tailored, secure experiences for Super Admins, Branch Principals (Admins), Teachers, Receptionists, Parents, and Students.
* **100% Real-Time:** From gate attendance scanning to urgent circulars and fee receipts, everything is powered by our real-time WebSocket engine.
* **White-Label Branding:** Each school gets its own branded URLs, custom theme colors, and personalized logos.
* **Mobile-First Design:** Fully responsive, modern, and beautiful glassmorphic UI built to perform flawlessly on phones, tablets, and desktops.

---

## 🛠️ 2. Key Modules & Features

### A. Admissions Pipeline
Transform chaotic paper forms into a seamless digital funnel.
* **Branded Public Forms:** Allow parents to apply directly via your school's unique URL (`/o/[school-name]/admission`).
* **End-to-End Tracking:** Move applicants from Inquiry → Test Scheduled → Approved → Enrolled.
* **Bulk Imports:** Import hundreds of inquiries via Excel with real-time progress bars.
* **Document Management:** Securely collect and store student documents (birth certificates, B-forms) directly on the platform.

### B. Intelligent Attendance System
Say goodbye to manual roll calls and errors.
* **QR/RFID Gate Scanner:** Students tap their ID cards; the system logs attendance and instantly notifies parents via the portal.
* **Offline Sync:** If the internet goes down, the scanner buffers scans locally and automatically syncs when online.
* **Automated Rules:** Configurable cutoffs automatically mark students LATE or ABSENT, triggering instant email alerts to parents.
* **Heatmap Analytics:** Visual monthly attendance matrices for students and staff.

### C. Financial & Fee Management
Take complete control of school revenue.
* **Custom Fee Structures:** Build dynamic fee templates with granular line items (tuition, transport, labs).
* **Automated Monthly Vouchers:** Auto-generate thousands of fee vouchers on the 1st of every month.
* **Smart Collection:** Accept partial payments, generate A5 PDFs and receipts, and process payments instantly via QR scanning at the desk.
* **Defaulter Management:** Daily cron jobs automatically calculate late fees and send out payment reminders.

### D. Academics, Exams, and Promotions
Run your academic year with precision.
* **Dynamic Hierarchy:** Manage Academic Years, Terms, Classes, and Sections with ease.
* **Exam Engine:** Schedule exams, generate date sheets, input marks per paper, and publish beautifully formatted PDF Result Cards.
* **Study Materials & Homework:** Teachers can seamlessly share documents, videos, and links directly to the student/parent portals.
* **One-Click Promotions:** Complete the academic year by bulk-promoting, graduating, or transferring students with full historical audit trails.

### E. Human Resources (Staff Management)
* **Digital Check-in/out:** Track staff attendance and generate detailed monthly reports.
* **Leave Workflows:** Staff can request leaves digitally, which branch admins can review and approve in seconds.
* **Teaching Assignments:** Effortlessly link teachers to specific subjects and sections.

### F. Parent & Student 14-Tab Portal
A rich, interactive space that keeps families engaged and informed.
* **Unified Dashboard:** Parents can switch between all their enrolled children seamlessly.
* **Live Features:** View real-time attendance, track fee payment history, download homework, check exam results, and monitor behavioral remarks.
* **Digital Leave Requests:** Parents can submit leave requests directly from their phones.
* **Instant Notifications:** A LinkedIn-style notification bell alerts users to new circulars, fee generation, and results.

---

## 🔒 3. Enterprise-Grade Architecture
* **Multi-Tenant Isolation:** Complete data privacy. Every branch operates in an isolated environment under the parent organization.
* **Scalable Infrastructure:** Built on Next.js 16 (Turbopack), Node.js, Prisma (Postgres), Redis, and BullMQ to handle millions of records effortlessly.
* **Reliability:** Built-in redundancies, fallback SMTP chains, and dedicated Cloudinary storage per organization.

---

## ⚙️ 4. Demonstration Instructions (For Sales & Onboarding)

Want to see it in action? Follow these steps to spin up a fully populated, production-ready demo school.

### Step 1: Create a Demo School
Run this command to create a demo tenant with the client's school name. It will automatically provision the organization, branch, and sample data for students, teachers, and fees.

```bash
cd Backend
npm run demo -- --name "Your Client's School Name" --reset --yes
```
*Note: This command generates credentials and portal URLs in the `Backend/demo-info/` directory. Use these credentials to log in during your presentation.*

### Step 2: Push Demo to Production
Once the client is thrilled and ready to go live, use the migration script to sync their customized demo tenant directly to the live production database.

```bash
cd Backend
node --env-file=.env scripts/demo-to-production.js --yes
```
*(Pro-tip: You can also pass `--org <orgId>` to specifically migrate a single organization.)*

---

**SchoolERP** isn't just software; it's the digital heartbeat of a modern educational institution. 

*Welcome to the future of school management.*
