// Smoke-test seed: isolated org + branches + users for every role + academic/finance data.
// Everything hangs off ONE organization (slug below) so cleanup is a single cascade delete.
// Writes a manifest of ids/credentials to scripts/.testTenant.json, which the API
// sweep runners read and deleteTestTenant.js uses to verify nothing was left behind.
import "../src/config/env.js";
import prisma from "../src/config/db.js";
import bcrypt from "bcryptjs";
import { generateIdentifierCode } from "../src/lib/identifier.js";
import { cleanupTenant } from "./deleteTestTenant.js";

const SLUG = "smoke-org";
const CODE = "SMOKE-ORG";
const PASSWORD = "Smoke@123";
const MANIFEST = new URL("./.testTenant.json", import.meta.url);

const d = (s) => new Date(s);

async function reset() {
  const existing = await prisma.organization.findUnique({ where: { slug: SLUG } });
  if (existing) {
    const r = await cleanupTenant(SLUG);
    console.log("purge:", JSON.stringify(r.counts));
  }
}

async function main() {
  await reset();
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── Organization + two branches ───────────────────────────────────
  const org = await prisma.organization.create({
    data: { name: "Smoke Test Academy", slug: SLUG, code: CODE, status: "ACTIVE" },
  });
  const b1 = await prisma.school.create({
      data: {
        organizationId: org.id, name: "Smoke Campus One", code: "SMOKE-B1",
        isDefaultBranch: true, address: "Test Address 1", phone: "0300-0000001", status: "ACTIVE",
        portalPassword: hash,
      },
    });
    const b2 = await prisma.school.create({
      data: {
        organizationId: org.id, name: "Smoke Campus Two", code: "SMOKE-B2",
        address: "Test Address 2", phone: "0300-0000002", status: "ACTIVE",
        portalPassword: hash,
      },
    });

  // ── Users, one per role ───────────────────────────────────────────
  const mkUser = (data) => prisma.user.create({ data: { password: hash, isActive: true, ...data } });

  const superAdmin = await mkUser({
    name: "Smoke Super Admin", email: "sa@smoke.test", role: "SUPER_ADMIN",
    organizationId: null, schoolId: null,
  });
  // Org owner: home branch b1, also administers b2 via branchAccess.
  const owner = await mkUser({
    name: "Smoke Org Owner", email: "owner@smoke.test", role: "ADMIN",
    organizationId: org.id, schoolId: b1.id, branchAccess: [b1.id, b2.id],
    isOrganizationOwner: true, phone: "0300-1111111",
  });
  const admin2 = await mkUser({
    name: "Smoke Admin Two", email: "admin2@smoke.test", role: "ADMIN",
    organizationId: org.id, schoolId: b2.id,
  });
  const teacher = await mkUser({
    name: "Smoke Teacher", email: "teacher@smoke.test", role: "TEACHER",
    organizationId: org.id, schoolId: b1.id, phone: "0300-2222222",
  });
  const receptionist = await mkUser({
    name: "Smoke Receptionist", email: "reception@smoke.test", role: "RECEPTIONIST",
    organizationId: org.id, schoolId: b1.id,
  });

  // ── Academic skeleton on branch 1 (and a mirror on branch 2) ──────
  const buildAcademic = async (school) => {
    const year = await prisma.academicYear.create({
      data: { schoolId: school.id, name: "2026-2027", startDate: d("2026-04-01"), endDate: d("2027-03-31"), isCurrent: true },
    });
    const term = await prisma.term.create({
      data: { academicYearId: year.id, name: "Term 1", startDate: d("2026-04-01"), endDate: d("2026-08-31") },
    });
    const cls = await prisma.class.create({ data: { schoolId: school.id, name: "Class 1", order: 0 } });
    const section = await prisma.section.create({ data: { classId: cls.id, name: "A", capacity: 40 } });
    const subject = await prisma.subject.create({ data: { classId: cls.id, name: "English" } });
    await prisma.sectionTemplate.create({ data: { schoolId: school.id, name: "A" } });
    return { year, term, cls, section, subject };
  };
  const ac1 = await buildAcademic(b1);
  const ac2 = await buildAcademic(b2);

  await prisma.timetableSlot.create({
    data: { sectionId: ac1.section.id, subjectId: ac1.subject.id, teacherId: teacher.id, dayOfWeek: 1, startTime: "08:00", endTime: "08:45" },
  });
  await prisma.teacherAssignment.create({
    data: { teacherId: teacher.id, classId: ac1.cls.id, subjectId: ac1.subject.id, sectionId: ac1.section.id },
  });

  // ── Parents + students ────────────────────────────────────────────
  const mkParent = (n, wa) => prisma.parent.create({
    data: { name: n, whatsappNo: wa, phone: wa, email: `${n.toLowerCase().replace(/\s+/g, ".")}@smoke.test` },
  });
  const p1 = await mkParent("Smoke Parent One", "+96650SMOKE01");
  const p2 = await mkParent("Smoke Parent Two", "+96650SMOKE02");

  const mkStudent = (roll, first, sectionId, parentId, schoolId) => prisma.student.create({
    data: {
      schoolId, sectionId, parentId, rollNumber: roll, firstName: first, lastName: "Student",
      identifierCode: `SMOKE-${roll}`, gender: "MALE", status: "ACTIVE",
    },
  });
  const s1 = await mkStudent("101", "Smoke", ac1.section.id, p1.id, b1.id);
  const s2 = await mkStudent("102", "Smoke", ac1.section.id, p2.id, b1.id);
  const s3 = await mkStudent("201", "Other", ac2.section.id, p1.id, b2.id);

  // ── Fees ──────────────────────────────────────────────────────────
  const feeStructure = await prisma.feeStructure.create({
    data: { schoolId: b1.id, academicYearId: ac1.year.id, name: "Smoke Tuition 2026-27", classes: { connect: [{ id: ac1.cls.id }] } },
  });
  await prisma.feeLineItem.createMany({
    data: [
      { feeStructureId: feeStructure.id, title: "Tuition Fee", amount: 5000 },
      { feeStructureId: feeStructure.id, title: "Transport", amount: 2000 },
    ],
  });
  const fee1 = await prisma.feeRecord.create({
    data: { studentId: s1.id, dueDate: d("2026-05-10"), totalAmount: 7000 },
  });
  const fee2 = await prisma.feeRecord.create({
    data: { studentId: s2.id, dueDate: d("2026-05-10"), totalAmount: 7000 },
  });

  // ── Attendance / leave / staff attendance ─────────────────────────
  await prisma.attendanceRecord.createMany({
    data: [
      { studentId: s1.id, date: d("2026-04-06"), checkIn: d("2026-04-06T07:55:00Z") },
      { studentId: s2.id, date: d("2026-04-06") },
    ],
  });
  const leave = await prisma.leaveRequest.create({
    data: { studentId: s1.id, parentId: p1.id, schoolId: b1.id, dateFrom: d("2026-04-10"), dateTo: d("2026-04-11"), reason: "Smoke test leave" },
  });
  await prisma.staffAttendance.create({
    data: { staffId: teacher.id, schoolId: b1.id, date: d("2026-04-06"), checkIn: d("2026-04-06T07:50:00Z") },
  });

  // ── Content: circular, homework, study material, PTM ──────────────
  const circular = await prisma.circular.create({
    data: { schoolId: b1.id, title: "Smoke Circular", content: "Smoke test circular body", eventDate: d("2026-04-15") },
  });
  const activity = await prisma.activity.create({
    data: { schoolId: b1.id, title: "Smoke Activity", eventDate: d("2026-04-18"), description: "Annual day" },
  });
  const homework = await prisma.homeworkBroadcast.create({
    data: { schoolId: b1.id, sectionId: ac1.section.id, title: "Smoke Homework", content: "Chapter 1", createdById: teacher.id },
  });
  const material = await prisma.studyMaterial.create({
    data: { schoolId: b1.id, title: "Smoke Material", description: "notes", sectionId: ac1.section.id, subjectId: ac1.subject.id, createdById: teacher.id, academicYearId: ac1.year.id },
  });
  const slot = await prisma.timetableSlot.create({
    data: { sectionId: ac1.section.id, subjectId: ac1.subject.id, teacherId: teacher.id, dayOfWeek: 3, startTime: "08:00", endTime: "08:45" },
  });
  const remark = await prisma.conductRemark.create({
    data: { studentId: s1.id, teacherId: teacher.id, comment: "Smoke conduct remark", academicYearId: ac1.year.id },
  });
  const tc = await prisma.transferCertificate.create({
    data: { studentId: s1.id, schoolId: b1.id, tcNumber: "SMOKE-TC-001", reason: "Smoke test", issuedById: owner.id, issuedByName: owner.name },
  });
  const ptm = await prisma.pTMSession.create({
    data: { schoolId: b1.id, title: "Smoke PTM", scheduledAt: d("2026-04-20T10:00:00Z"), studentId: s1.id, academicYearId: ac1.year.id },
  });

  // ── Exams ─────────────────────────────────────────────────────────
  const exam = await prisma.exam.create({
    data: { schoolId: b1.id, termId: ac1.term.id, name: "Smoke Midterm", startDate: d("2026-05-01"), endDate: d("2026-05-03"), publishedAt: d("2026-05-04") },
  });
  await prisma.examPaper.create({
    data: { examId: exam.id, classId: ac1.cls.id, subjectId: ac1.subject.id, sectionId: ac1.section.id, date: d("2026-05-01"), startTime: "09:00", endTime: "10:00", maxMarks: 50 },
  });
  await prisma.examResult.create({
    data: { examId: exam.id, studentId: s1.id, subjectId: ac1.subject.id, marksObtained: 42, maxMarks: 50 },
  });

  // ── Admissions applicant ──────────────────────────────────────────
  const applicant = await prisma.applicant.create({
    data: {
      schoolId: b1.id, classId: ac1.cls.id, firstName: "Smoke", lastName: "Applicant",
      parentName: "Smoke Parent", parentPhone: "+96650SMOKE03", parentWhatsappNo: "+96650SMOKE03",
      status: "INQUIRY",
    },
  });

  const promotion = await prisma.promotionRecord.create({
    data: { studentId: s1.id, academicYearId: ac1.year.id, action: "PROMOTED", fromSectionId: ac1.section.id, toSectionId: ac1.section.id, remarks: "Smoke" },
  });

  const manifest = {
    password: PASSWORD,
    org: { id: org.id, slug: org.slug },
    schools: { b1: b1.id, b2: b2.id },
    users: {
      superAdmin: { id: superAdmin.id, email: superAdmin.email, role: "SUPER_ADMIN" },
      owner: { id: owner.id, email: owner.email, role: "ADMIN" },
      admin2: { id: admin2.id, email: admin2.email, role: "ADMIN" },
      teacher: { id: teacher.id, email: teacher.email, role: "TEACHER" },
      receptionist: { id: receptionist.id, email: receptionist.email, role: "RECEPTIONIST" },
    },
    academic: { year: ac1.year.id, term: ac1.term.id, class: ac1.cls.id, section: ac1.section.id, subject: ac1.subject.id },
    students: { s1: s1.id, s2: s2.id, s3: s3.id },
    parents: { p1: { id: p1.id, whatsappNo: p1.whatsappNo }, p2: { id: p2.id, whatsappNo: p2.whatsappNo } },
    fees: { structure: feeStructure.id, record1: fee1.id, record2: fee2.id },
    misc: {
      leave: leave.id, circular: circular.id, ptm: ptm.id, exam: exam.id, applicant: applicant.id,
      activity: activity.id, homework: homework.id, material: material.id,
      slot: slot.id, remark: remark.id, tc: tc.id, feeStructure: feeStructure.id,
      promotion: promotion.id,
    },
  };

  const fs = await import("node:fs");
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log("seed complete -> scripts/.testTenant.json");
  console.log(`org=${org.slug} branches=${b1.code},${b2.code} students=${s1.identifierCode},${s2.identifierCode},${s3.identifierCode}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());