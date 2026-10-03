// FK-safe teardown of the smoke-test tenant.
// Organization cascade alone is NOT enough: several FKs (TimetableSlot.teacherId,
// TeacherAssignment.teacherId, ...) are Restrict, so rows must go in dependency order.
import "../src/config/env.js";   // must come first: loads DATABASE_URL when run standalone
import prisma from "../src/config/db.js";

const PARENT_TAG = "+96650SMOKE";

export async function cleanupTenant(slug) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { branches: { select: { id: true } } },
  });
  if (!org) return { removed: false, reason: "no such organization" };

  const branchIds = org.branches.map((b) => b.id);
  // The platform SUPER_ADMIN has organizationId=null AND schoolId=null, so it is not
// reachable through the org/branch relations — pick it up by its tagged email.
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { organizationId: org.id },
        { schoolId: { in: branchIds } },
        { email: { endsWith: "@smoke.test" } },
      ],
    },
    select: { id: true, email: true },
  });
  const userIds = users.map((u) => u.id);
  const inBranch = { in: branchIds };
  const byUser = { in: userIds };

  // Order matters: every child before its parent.
  const steps = [
    // user-scoped
    ["refreshToken", { where: { userId: byUser } }],
    ["passwordResetToken", { where: { userId: byUser } }],
    ["timetableSlot", { where: { section: { class: { schoolId: inBranch } } } }],
    ["teacherAssignment", { where: { class: { schoolId: inBranch } } }],
    ["homeworkBroadcast", { where: { schoolId: inBranch } }],
    ["studyMaterial", { where: { schoolId: inBranch } }],
    ["conductRemark", { where: { student: { schoolId: inBranch } } }],
    ["staffAttendance", { where: { schoolId: inBranch } }],
    ["auditLog", { where: { OR: [{ schoolId: inBranch }, { organizationId: org.id }] } }],

    // exams
    ["examResult", { where: { exam: { schoolId: inBranch } } }],
    ["examPaper", { where: { exam: { schoolId: inBranch } } }],
    ["exam", { where: { schoolId: inBranch } }],
    ["pTMSession", { where: { schoolId: inBranch } }],

    // student-scoped
    ["attendanceRecord", { where: { student: { schoolId: inBranch } } }],
    ["attendanceYearSummary", { where: { schoolId: inBranch } }],
    ["feePaymentReplay", { where: { schoolId: inBranch } }],
    ["feePayment", { where: { feeRecord: { student: { schoolId: inBranch } } } }],
    ["feeRecord", { where: { student: { schoolId: inBranch } } }],
    ["feeYearSummary", { where: { schoolId: inBranch } }],
    ["promotionRecord", { where: { student: { schoolId: inBranch } } }],
    ["transferCertificate", { where: { schoolId: inBranch } }],
    ["leaveRequest", { where: { schoolId: inBranch } }],

    // admissions
    ["applicantDocument", { where: { applicant: { schoolId: inBranch } } }],
    ["applicant", { where: { schoolId: inBranch } }],

    // misc school-scoped
    ["circular", { where: { schoolId: inBranch } }],
    ["activity", { where: { schoolId: inBranch } }],
    ["notificationLog", { where: { schoolId: inBranch } }],
    ["pendingEmail", { where: { schoolId: inBranch } }],
    ["orgSecrets", { where: { schoolId: inBranch } }],

    // students first: Student.sectionId is Restrict, so sections cannot go first
    ["student", { where: { schoolId: inBranch } }],

    // academic
    ["sectionTemplate", { where: { schoolId: inBranch } }],
    ["subject", { where: { class: { schoolId: inBranch } } }],
    ["section", { where: { class: { schoolId: inBranch } } }],
    ["class", { where: { schoolId: inBranch } }],
    ["term", { where: { academicYear: { schoolId: inBranch } } }],
    ["academicYear", { where: { schoolId: inBranch } }],

    ["user", { where: { id: byUser } }],
  ];

  const counts = {};
  const missing = [];
  for (const [name, run] of steps) {
    const del = prisma[name];
    if (typeof del?.deleteMany !== "function") { missing.push(name); continue; }
    const r = await del.deleteMany({ where: run.where });
    if (r.count) counts[name] = r.count;
  }
  if (missing.length) console.warn(`cleanup: skipped unknown delegates -> ${missing.join(", ")}`);

  await prisma.organization.delete({ where: { id: org.id } });

  // Parents are global (no org FK) so they survive; drop any left holding our tagged numbers.
  const orphans = await prisma.parent.deleteMany({ where: { whatsappNo: { startsWith: PARENT_TAG } } });
  const strays = await prisma.student.deleteMany({ where: { identifierCode: { startsWith: "SMOKE-" } } });
  if (orphans.count) counts.parent = orphans.count;
  if (strays.count) counts.strayStudent = strays.count;

  return { removed: true, org: slug, counts };
}

// Run directly? `node scripts/deleteTestTenant.js [slug]`
// pathToFileURL keeps this correct on Windows (import.meta.url has three slashes).
const isMain = process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href;
if (isMain) {
  const slug = process.argv[2] || "smoke-org";
  cleanupTenant(slug)
    .then((r) => { console.log(JSON.stringify(r, null, 2)); return prisma.$disconnect(); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}