import prisma from "../src/config/db.js";
import bcrypt from "bcryptjs";
import { generateIdentifierCode } from "../src/lib/identifier.js";

const ORG_CODE = "FALCON-HQ";
const SCHOOL_CODE = "GULSHAN-01";

const CLASS_NAMES = [
  "PlayGroup",
  "Nursery",
  "KG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
];

// Class 1–5 ko standard subjects dete hain (PlayGroup/Nursery/KG me nahi).
const SUBJECT_NAMES = ["Urdu", "English", "Mathematics", "General Science", "Islamiat", "Social Studies"];

// Oxford (Sindh Board) — Pakistani school: PlayGroup tak Class 8.
const OXFORD_SLUG = "oxford";
const OXFORD_CLASSES = [
  "PlayGroup",
  "Nursery",
  "KG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
];
// Sindh Board curriculum (Sindhi compulsory hai Sindh me).
const SINDH_SUBJECTS = [
  "English",
  "Urdu",
  "Sindhi",
  "Mathematics",
  "General Science",
  "Social Studies",
  "Islamiat",
  "Computer Science",
];

// ── Shared helpers (idempotent) ──────────────────────────────────

/** Academic year 2026-2027 (current) + Term 1 & 2, agar nahi hai to. */
async function ensureAcademicYear(schoolId) {
  let year = await prisma.academicYear.findFirst({
    where: { schoolId, name: "2026-2027" },
  });
  if (year) return { year, created: false };
  await prisma.academicYear.updateMany({
    where: { schoolId },
    data: { isCurrent: false },
  });
  year = await prisma.academicYear.create({
    data: {
      schoolId,
      name: "2026-2027",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      isCurrent: true,
    },
  });
  await prisma.term.createMany({
    data: [
      { academicYearId: year.id, name: "Term 1", startDate: new Date("2026-04-01"), endDate: new Date("2026-08-31") },
      { academicYearId: year.id, name: "Term 2", startDate: new Date("2026-09-01"), endDate: new Date("2027-03-31") },
    ],
  });
  return { year, created: true };
}

/**
 * Classes (order = index), sections ("A" har class me, "B" bhi jab
 * index >= extraSectionsFrom) aur subjects (index >= subjectsFrom).
 */
async function ensureClasses(schoolId, { classNames, extraSectionsFrom = Infinity, subjectsFrom = Infinity, subjectNames = [] }) {
  const byName = {};
  let created = 0;
  const templateNames = new Set();
  for (let i = 0; i < classNames.length; i++) {
    const name = classNames[i];
    let cls = await prisma.class.findFirst({ where: { schoolId, name } });
    if (!cls) {
      cls = await prisma.class.create({ data: { schoolId, name, order: i } });
      created++;
    }
    byName[name] = cls;

    for (const secName of i >= extraSectionsFrom ? ["A", "B"] : ["A"]) {
      const exists = await prisma.section.findFirst({ where: { classId: cls.id, name: secName } });
      if (!exists) {
        await prisma.section.create({ data: { classId: cls.id, name: secName, capacity: 40 } });
      }
      templateNames.add(secName);
    }

    if (i >= subjectsFrom) {
      for (const sub of subjectNames) {
        const exists = await prisma.subject.findFirst({ where: { classId: cls.id, name: sub } });
        if (!exists) {
          await prisma.subject.create({ data: { classId: cls.id, name: sub } });
        }
      }
    }
  }
  // School section pool (templates) — same names jo classes me assign hue.
  for (const tplName of templateNames) {
    const exists = await prisma.sectionTemplate.findFirst({ where: { schoolId, name: tplName } });
    if (!exists) {
      await prisma.sectionTemplate.create({ data: { schoolId, name: tplName } });
    }
  }
  return { byName, created };
}

async function main() {
  const hashed = (pwd) => bcrypt.hash(pwd, 10);

  // ── 1. Organization ─────────────────────────────────────────────
  let org = await prisma.organization.findUnique({ where: { code: ORG_CODE } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Falcon Academy Systems", slug: "falcon-hq", code: ORG_CODE },
    });
    console.log("Default Organization seeded.");
  }

  // ── 2. Platform Super Admin (no org — manages whole platform) ────
  const superEmail = "superadmin@schoolerp.com";
  const superPassword = "superadmin123";
  let superAdmin = await prisma.user.findUnique({ where: { email: superEmail } });
  if (superAdmin) {
    // Seed ke documented credentials hamesha valid rakho (Docker re-seed safe).
    await prisma.user.update({
      where: { email: superEmail },
      data: { password: await hashed(superPassword) },
    });
  } else {
    superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin User",
        email: superEmail,
        password: await hashed(superPassword),
        role: "SUPER_ADMIN",
        organizationId: null,
        isActive: true,
      },
    });
    console.log("Super Admin user seeded.");
  }
  console.log(`Super Admin → ${superEmail} / ${superPassword}`);

  // ── 3. Branch (School) under the org ────────────────────────────
  let school = await prisma.school.findUnique({ where: { code: SCHOOL_CODE } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        organizationId: org.id,
        name: "Falcon Academy — Gulshan Campus",
        code: SCHOOL_CODE,
        address: "Main University Road, Gulshan-e-Iqbal, Karachi",
        phone: "021-34961234",
        status: "ACTIVE",
      },
    });
    console.log("Default School seeded.");
  }

  // ── 4. Branch Principal (ADMIN) user (logs in with email + password) ──
  // SUPER_ADMIN sirf platform owner (organizationId = null) ke liye hai —
  // org ka admin ab hamesha branch-scoped ADMIN (Principal) hota hai.
  const adminEmail = "admin@falconacademy.com";
  const adminPassword = "admin123";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (admin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: await hashed(adminPassword), isActive: true, role: "ADMIN", schoolId: school.id },
    });
  } else {
    admin = await prisma.user.create({
      data: {
        name: "Falcon Branch Principal",
        username: "FALCON-ADMIN",
        email: adminEmail,
        password: await hashed(adminPassword),
        phone: "0300-1234567",
        role: "ADMIN",
        organizationId: org.id,
        schoolId: school.id,
        isActive: true,
      },
    });
    console.log("Branch Principal user seeded.");
  }
  console.log(`Branch Principal → ${adminEmail} / ${adminPassword}`);

  // ── 5. Teacher (Staff tab demo) ─────────────────────────────────
  const teacherEmail = "teacher@falconacademy.com";
  let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        name: "Uzma Jabeen",
        username: "STF-1001",
        email: teacherEmail,
        password: await hashed("teacher123"),
        phone: "0301-7654321",
        role: "TEACHER",
        organizationId: org.id,
        schoolId: school.id,
        isActive: true,
      },
    });
    console.log(`Teacher seeded → ${teacherEmail} / teacher123`);
  }

  // ── 6. Falcon — Academic Year + Classes + Sections + Subjects ───
  const falconYear = await ensureAcademicYear(school.id);
  const falconClasses = await ensureClasses(school.id, {
    classNames: CLASS_NAMES,
    extraSectionsFrom: 5, // Class 3–5 ko A + B
    subjectsFrom: 3, // Class 1–5 ko subjects
    subjectNames: SUBJECT_NAMES,
  });
  console.log(`Falcon: year ${falconYear.created ? "created" : "exists"}, classes created: ${falconClasses.created}.`);
  const classes = falconClasses.byName;
  const year = falconYear.year;
  const classOf = (name) => classes[name].id;

  // ── 7. Admission pipeline applicants (Admissions tab demo) ──────
  const applicants = [
    { firstName: "Ahmed", lastName: "Raza", gender: "MALE", classId: classOf("Class 1"), parentName: "Muhammad Raza", parentWhatsappNo: "0311-1111111", status: "INQUIRY" },
    { firstName: "Fatima", lastName: "Noor", gender: "FEMALE", classId: classOf("KG"), parentName: "Abdul Noor", parentWhatsappNo: "0312-2222222", status: "TEST_SCHEDULED" },
    { firstName: "Hamza", lastName: "Ali", gender: "MALE", classId: classOf("Class 2"), parentName: "Imran Ali", parentWhatsappNo: "0313-3333333", status: "TEST_PASSED" },
    { firstName: "Ayesha", lastName: "Siddiqui", gender: "FEMALE", classId: classOf("Class 3"), parentName: "Kamran Siddiqui", parentWhatsappNo: "0314-4444444", status: "FORM_SUBMITTED" },
    { firstName: "Bilal", lastName: "Khan", gender: "MALE", classId: classOf("Class 1"), parentName: "Shahid Khan", parentWhatsappNo: "0315-5555555", status: "APPROVED" },
    { firstName: "Zainab", lastName: "Malik", gender: "FEMALE", classId: classOf("Class 4"), parentName: "Nadeem Malik", parentWhatsappNo: "0316-6666666", status: "FEE_PENDING", advanceFeeAmount: 20000 },
    { firstName: "Hassan", lastName: "Ahmed", gender: "MALE", classId: classOf("Class 1"), parentName: "Faisal Ahmed", parentWhatsappNo: "0317-7777777", status: "ENROLLED", advanceFeeAmount: 20000 },
  ];
  let applicantsCreated = 0;
  for (const a of applicants) {
    const existing = await prisma.applicant.findFirst({
      where: { schoolId: school.id, firstName: a.firstName, lastName: a.lastName, parentWhatsappNo: a.parentWhatsappNo },
    });
    if (existing) continue;
    await prisma.applicant.create({
      data: {
        schoolId: school.id,
        classId: a.classId,
        firstName: a.firstName,
        lastName: a.lastName,
        gender: a.gender,
        parentName: a.parentName,
        parentPhone: a.parentWhatsappNo,
        parentWhatsappNo: a.parentWhatsappNo,
        parentEmail: `${a.firstName.toLowerCase()}.${a.lastName.toLowerCase()}@example.com`,
        status: a.status,
        advanceFeeAmount: a.advanceFeeAmount ?? null,
      },
    });
    applicantsCreated++;
  }
  console.log(`Applicants seeded (${applicantsCreated} new, pipeline of ${applicants.length}).`);

  // ── 8. Parents + Students (Students tab / QR demo) ──────────────
  const students = [
    { firstName: "Hassan", lastName: "Ahmed", gender: "MALE", roll: "101", section: "A", className: "Class 1", parentName: "Faisal Ahmed", parentWhatsapp: "0317-7777777" },
    { firstName: "Marium", lastName: "Fatima", gender: "FEMALE", roll: "102", section: "A", className: "Class 1", parentName: "Shahid Khan", parentWhatsapp: "0315-5555555" },
    { firstName: "Ali", lastName: "Hassan", gender: "MALE", roll: "103", section: "A", className: "Class 2", parentName: "Imran Ali", parentWhatsapp: "0313-3333333" },
  ];
  let studentsCreated = 0;
  for (const s of students) {
    const existing = await prisma.student.findFirst({ where: { schoolId: school.id, rollNumber: s.roll } });
    if (existing) continue;

    let parent = await prisma.parent.findUnique({ where: { whatsappNo: s.parentWhatsapp } });
    if (!parent) {
      parent = await prisma.parent.create({
        data: { name: s.parentName, whatsappNo: s.parentWhatsapp, phone: s.parentWhatsapp, email: `${s.parentName.replace(/\s+/g, ".").toLowerCase()}@example.com` },
      });
    }

    const section = await prisma.section.findFirst({
      where: { class: { schoolId: school.id, name: s.className }, name: s.section },
    });

    await prisma.student.create({
      data: {
        schoolId: school.id,
        sectionId: section.id,
        parentId: parent.id,
        identifierCode: generateIdentifierCode(),
        rollNumber: s.roll,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        status: "ACTIVE",
      },
    });
    studentsCreated++;
  }
  console.log(`Students seeded (${studentsCreated} new).`);

  // ── 9. Fee structure (Fee Structures tab demo) ─────────────────
  const feeExists = await prisma.feeStructure.findFirst({
    where: { schoolId: school.id, name: "Monthly Tuition 2026-27" },
  });
  if (!feeExists) {
    await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        classId: classOf("Class 1"),
        academicYearId: year.id,
        name: "Monthly Tuition 2026-27",
        lineItems: {
          create: [
            { title: "Tuition Fee", amount: 5000 },
            { title: "Transport", amount: 2000 },
            { title: "Miscellaneous", amount: 500 },
          ],
        },
      },
    });
    console.log("Fee structure seeded.");
  }

  // ── 10. Oxford (Sindh Board) — default academic setup ───────────
  const oxfordOrg = await prisma.organization.findUnique({ where: { slug: OXFORD_SLUG } });
  if (oxfordOrg) {
    const oxSchools = await prisma.school.findMany({
      where: { organizationId: oxfordOrg.id },
      select: { id: true, name: true, code: true },
    });
    if (oxSchools.length === 0) {
      console.log("Oxford org mila, lekin koi school (branch) nahi — academic setup skip.");
    }
    for (const oxSchool of oxSchools) {
      const oxYear = await ensureAcademicYear(oxSchool.id);
      const oxClasses = await ensureClasses(oxSchool.id, {
        classNames: OXFORD_CLASSES,
        subjectsFrom: 3, // Class 1–8 ko Sindh Board subjects
        subjectNames: SINDH_SUBJECTS,
      });
      console.log(
        `Oxford → ${oxSchool.name} (${oxSchool.code}): year ${oxYear.created ? "created" : "exists"}, ` +
          `classes created: ${oxClasses.created} (${OXFORD_CLASSES.length} total), subjects linked Class 1-8.`
      );
    }
  } else {
    console.log(`Oxford org (slug: ${OXFORD_SLUG}) nahi mila — skip.`);
  }

  console.log("\nSeed complete.");
  console.log("──────────────────────────────────────────────");
  console.log("Logins:");
  console.log(`  Platform Super Admin → ${superEmail} / ${superPassword}`);
  console.log(`  Org Admin (branch portal) → ${adminEmail} / ${adminPassword}`);
  console.log(`  Teacher → ${teacherEmail} / teacher123`);
  console.log(`School code (parent/student login): ${SCHOOL_CODE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
