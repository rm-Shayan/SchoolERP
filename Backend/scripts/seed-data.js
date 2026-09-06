/**
 * Comprehensive Initial Setup Seeder — testing ke liye sab kuch.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-data.js --org <orgId>       (saari branches ke liye)
 *   node --env-file=.env scripts/seed-data.js --branch <schoolId> (ek branch ke liye)
 *
 * Optional flags:
 *   --students 20     (default: 20)
 *   --months 2        (fee records kitne mahine, default: 2)
 *   --teachers 3      (default: 3)
 *
 * Kya seed hota hai (per branch):
 *   1. Academic year (current) + Terms (Term 1, Term 2, Term 3)
 *   2. Classes 1-5 with sections A/B + Section Templates
 *   3. Subjects per class (Urdu, English, Math, Science, Islamiyat)
 *   4. Teachers with login (password: Teacher@123)
 *   5. Teacher assignments (teacher → class → subject → section)
 *   6. Monthly fee structure + line items
 *   7. Students across sections (parents with unique WhatsApp)
 *   8. Fee records: PAID/PARTIAL/UNPAID/OVERDUE mix + payments
 *   9. Terms + Exams + Exam Results
 *  10. Timetable slots (Mon-Fri, 5 periods per day)
 *  11. Attendance records (last 5 school days)
 *  12. Scan devices (Main Gate QR)
 *  13. Circulars (parents + teachers)
 *  14. Activities (sports day, etc.)
 *  15. PTM sessions
 *  16. Homework broadcasts
 *  17. Conduct remarks
 *  18. Applicants (admission pipeline)
 *
 * Idempotent: existing records dobara nahi bante.
 */
import prisma from '../src/config/db.js';
import bcryptjs from 'bcryptjs';
import { generateIdentifierCode } from '../src/lib/identifier.js';
import { pathToFileURL } from 'url';

// ─── CLI args ───────────────────────────────────────────────────────────────
function parseArgs() {
  const args = { orgIds: [], branchIds: [], students: 20, months: 2, teachers: 3 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--org') args.orgIds.push(...argv[++i].split(','));
    else if (k === '--branch') args.branchIds.push(...argv[++i].split(','));
    else if (k === '--students') args.students = parseInt(argv[++i], 10);
    else if (k === '--months') args.months = parseInt(argv[++i], 10);
    else if (k === '--teachers') args.teachers = parseInt(argv[++i], 10);
    else if (k === '--help' || k === '-h') { console.log(USAGE); process.exit(0); }
  }
  if (!args.orgIds.length && !args.branchIds.length) {
    console.error('ERROR: --org ya --branch required hai.\n' + USAGE);
    process.exit(1);
  }
  return args;
}
const USAGE = 'node --env-file=.env scripts/seed-data.js --org <id> | --branch <id> [--students 20] [--months 2] [--teachers 3]';

// ─── Fake data pools ────────────────────────────────────────────────────────
const FIRST_NAMES_M = ['Ahmed', 'Hassan', 'Bilal', 'Usman', 'Zain', 'Hamza', 'Ali', 'Omar', 'Faizan', 'Danish'];
const FIRST_NAMES_F = ['Fatima', 'Ayesha', 'Maryam', 'Zainab', 'Hira', 'Sana', 'Iqra', 'Noor', 'Rabia', 'Sidra'];
const LAST_NAMES = ['Khan', 'Ahmed', 'Malik', 'Sheikh', 'Raza', 'Iqbal', 'Hussain', 'Farooq', 'Siddiqui', 'Butt'];

const CLASSES = [
  { name: 'Class 1', code: 'C1', order: 1 },
  { name: 'Class 2', code: 'C2', order: 2 },
  { name: 'Class 3', code: 'C3', order: 3 },
  { name: 'Class 4', code: 'C4', order: 4 },
  { name: 'Class 5', code: 'C5', order: 5 },
];
const SECTION_NAMES = ['A', 'B'];

const SUBJECTS = [
  { name: 'Urdu', code: 'URD' },
  { name: 'English', code: 'ENG' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Science', code: 'SCI' },
  { name: 'Islamiyat', code: 'ISL' },
];

const FEE_ITEMS = [
  { title: 'Tuition Fee', amount: 3500 },
  { title: 'Exam Fee', amount: 300 },
  { title: 'Computer Lab', amount: 500 },
];

const PERIODS = [
  { start: '08:00', end: '08:45' },
  { start: '08:45', end: '09:30' },
  { start: '09:45', end: '10:30' },
  { start: '10:30', end: '11:15' },
  { start: '11:30', end: '12:15' },
];
// Mon=1 ... Fri=5 (weekdays only for timetable)
const WEEKDAYS = [1, 2, 3, 4, 5];

const CIRCULARS = [
  { title: 'Annual Sports Day', content: 'Annual sports day will be held on 15th September. All students must participate.', audience: 'PARENTS' },
  { title: 'Staff Meeting Notice', content: 'Mandatory staff meeting on Friday at 2:00 PM in the conference room.', audience: 'TEACHERS' },
  { title: 'Holiday Notification', content: 'School will remain closed on 14th August for Independence Day.', audience: 'ALL' },
];

const ACTIVITIES = [
  { title: 'Annual Sports Day', description: 'Inter-class sports competition', daysOffset: 20 },
  { title: 'Science Exhibition', description: 'Student science projects display', daysOffset: 35 },
  { title: 'Quran Recitation Competition', description: 'Tilawat competition for all classes', daysOffset: 15 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const sumItems = (items) => items.reduce((s, it) => s + Number(it.amount), 0);
function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

let parentPhoneCounter = 3234000000;
async function uniqueParentNumber() {
  for (let attempt = 0; attempt < 200; attempt++) {
    parentPhoneCounter++;
    const num = `0${parentPhoneCounter}`;
    const clash = await prisma.parent.findUnique({ where: { whatsappNo: num } });
    if (!clash) return num;
  }
  throw new Error('Unique parent WhatsApp number generate nahi ho saka');
}

// ─── 1. Academic Year + Terms ───────────────────────────────────────────────
async function ensureAcademicYear(schoolId) {
  const existing = await prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
  if (existing) return existing;
  const y = new Date().getFullYear();
  return prisma.academicYear.create({
    data: {
      schoolId, name: `${y}-${y + 1}`,
      startDate: new Date(y, 0, 1), endDate: new Date(y, 11, 31), isCurrent: true,
    },
  });
}

async function ensureTerms(academicYearId) {
  const existing = await prisma.term.findMany({ where: { academicYearId } });
  if (existing.length) return existing;
  const y = new Date().getFullYear();
  return Promise.all([
    prisma.term.create({ data: { academicYearId, name: 'Term 1', startDate: new Date(y, 0, 1), endDate: new Date(y, 4, 31) } }),
    prisma.term.create({ data: { academicYearId, name: 'Term 2', startDate: new Date(y, 5, 1), endDate: new Date(y, 8, 30) } }),
    prisma.term.create({ data: { academicYearId, name: 'Term 3', startDate: new Date(y, 9, 1), endDate: new Date(y, 11, 31) } }),
  ]);
}

// ─── 2. Classes + Sections + Section Templates ──────────────────────────────
async function ensureClassesAndSections(schoolId) {
  const sectionsOut = [];
  for (const c of CLASSES) {
    let klass = await prisma.class.findFirst({ where: { schoolId, name: c.name } });
    if (!klass) {
      klass = await prisma.class.create({ data: { schoolId, name: c.name, code: c.code, order: c.order } });
      for (const s of SECTION_NAMES) {
        sectionsOut.push(await prisma.section.create({ data: { classId: klass.id, name: s, capacity: 30 } }));
      }
    } else {
      const secs = await prisma.section.findMany({ where: { classId: klass.id }, orderBy: { name: 'asc' } });
      sectionsOut.push(...secs);
    }
  }
  return sectionsOut;
}

async function ensureSectionTemplates(schoolId) {
  const existing = await prisma.sectionTemplate.findMany({ where: { schoolId } });
  if (existing.length) return existing;
  return Promise.all(SECTION_NAMES.map((name) => prisma.sectionTemplate.create({ data: { schoolId, name } })));
}

// ─── 3. Subjects per class ──────────────────────────────────────────────────
async function ensureSubjects(classes) {
  const allSubjects = [];
  for (const cls of classes) {
    const existing = await prisma.subject.findMany({ where: { classId: cls.id } });
    if (existing.length) { allSubjects.push(...existing); continue; }
    for (const sub of SUBJECTS) {
      allSubjects.push(await prisma.subject.create({ data: { classId: cls.id, name: sub.name, code: sub.code } }));
    }
  }
  return allSubjects;
}

// ─── 4. Teachers ────────────────────────────────────────────────────────────
async function createTeachers(schoolId, organizationId, count, schoolCode) {
  let made = 0;
  for (let i = 1; i <= count; i++) {
    const email = `teacher${i}.${schoolCode.toLowerCase()}@seed.example.com`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) continue;
    const names = ['Sir Ahmed', 'Miss Ayesha', 'Sir Hassan', 'Miss Fatima', 'Sir Usman', 'Miss Maryam', 'Sir Bilal', 'Miss Zainab'];
    await prisma.user.create({
      data: {
        organizationId, schoolId,
        name: names[i - 1] || `Teacher ${i}`,
        username: `${schoolCode.toUpperCase()}-T${1000 + i}`,
        email,         password: await bcryptjs.hash('Teacher@123', 12),
        role: 'TEACHER', isActive: true,
      },
    });
    made++;
  }
  // Also create a branch ADMIN (principal) if not exists
  const adminEmail = `admin.${schoolCode.toLowerCase()}@seed.example.com`;
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        organizationId, schoolId,
        name: `Principal ${schoolCode}`,
        username: `${schoolCode.toUpperCase()}-ADMIN`,
        email: adminEmail,
        password: await bcryptjs.hash('Admin@123', 12),
        role: 'ADMIN', isActive: true,
      },
    });
    console.log(`  Admin created: ${adminEmail} / Admin@123`);
  }
  return made;
}

// ─── 5. Teacher Assignments ─────────────────────────────────────────────────
async function ensureTeacherAssignments(teachers, classes, sections, allSubjects) {
  let made = 0;
  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    // Assign each teacher to 2 classes, each with 2 subjects
    const assignedClasses = classes.slice(i * 1, i * 1 + 2);
    for (const cls of assignedClasses) {
      const classSubjects = allSubjects.filter((s) => s.classId === cls.id).slice(0, 2);
      const classSections = sections.filter((s) => s.classId === cls.id);
      for (const sub of classSubjects) {
        // Assign to first section of the class
        const sec = classSections[0];
        const exists = await prisma.teacherAssignment.findFirst({
          where: { teacherId: teacher.id, classId: cls.id, subjectId: sub.id, sectionId: sec?.id ?? null },
        });
        if (!exists) {
          await prisma.teacherAssignment.create({
            data: { teacherId: teacher.id, classId: cls.id, subjectId: sub.id, sectionId: sec?.id ?? null },
          });
          made++;
        }
      }
    }
  }
  return made;
}

// ─── 6. Fee Structure ───────────────────────────────────────────────────────
async function ensureFeeStructure(schoolId, academicYearId, classes) {
  const name = `Monthly Tuition ${new Date().getFullYear()}`;
  const existing = await prisma.feeStructure.findFirst({ where: { schoolId, name }, include: { lineItems: true } });
  if (existing) return { structure: existing, total: sumItems(existing.lineItems) };
  const structure = await prisma.feeStructure.create({
    data: {
      schoolId, academicYearId, name,
      classes: { connect: classes.map((c) => ({ id: c.id })) },
      lineItems: { create: FEE_ITEMS.map((it) => ({ ...it })) },
    },
    include: { lineItems: true },
  });
  return { structure, total: sumItems(structure.lineItems) };
}

// ─── 7. Students + Parents ──────────────────────────────────────────────────
async function createStudents(schoolId, sections, count) {
  const sectionIds = sections.map((s) => s.id);
  const existingRolls = new Set(
    (await prisma.student.findMany({ where: { sectionId: { in: sectionIds } }, select: { sectionId: true, rollNumber: true } }))
      .map((s) => `${s.sectionId}:${s.rollNumber}`)
  );
  const rollCounters = {};
  const created = [];

  for (let i = 0; i < count; i++) {
    const section = sections[i % sections.length];
    const key = section.id;
    let roll;
    do { roll = String((rollCounters[key] = (rollCounters[key] || 100) + 1)); } while (existingRolls.has(`${key}:${roll}`));
    existingRolls.add(`${key}:${roll}`);

    const isMale = i % 2 === 0;
    const firstName = isMale ? FIRST_NAMES_M[i % FIRST_NAMES_M.length] : FIRST_NAMES_F[i % FIRST_NAMES_F.length];
    const lastName = LAST_NAMES[Math.floor(i / 10) % LAST_NAMES.length];

    const parent = await prisma.parent.create({
      data: {
        name: `${lastName} Sahib`, whatsappNo: await uniqueParentNumber(),
        email: `parent.${Date.now()}.${i}@seed.example.com`, address: 'Seed Street, Lahore',
      },
    });

    created.push(await prisma.student.create({
      data: {
        schoolId, sectionId: section.id, parentId: parent.id,
        identifierCode: generateIdentifierCode(), rollNumber: roll,
        firstName, lastName, gender: isMale ? 'male' : 'female',
        dob: new Date(2014 + (i % 5), (i % 12), ((i * 7) % 27) + 1),
        status: 'ACTIVE',
      },
    }));
  }
  return created;
}

// ─── 8. Fee Records + Payments ──────────────────────────────────────────────
async function seedFeeRecords(students, totalAmount, monthsBack) {
  const studentIds = students.map((s) => s.id);
  const existing = new Set(
    (await prisma.feeRecord.findMany({ where: { studentId: { in: studentIds } }, select: { studentId: true, dueDate: true } }))
      .map((r) => `${r.studentId}:${monthKey(r.dueDate)}`)
  );

  const now = new Date();
  let made = 0, paidCount = 0, partialCount = 0;
  for (let mIdx = monthsBack - 1; mIdx >= 0; mIdx--) {
    const dueMonth = new Date(now.getFullYear(), now.getMonth() - mIdx, 1);
    const dueDate = new Date(dueMonth.getFullYear(), dueMonth.getMonth(), 10);
    const isPastDue = dueDate < now;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      if (existing.has(`${student.id}:${monthKey(dueDate)}`)) continue;

      const roll = (i + mIdx) % 10;
      let status = 'UNPAID';
      let paidAmount = 0;
      let payment = null;
      if (roll <= 5) { status = 'PAID'; paidAmount = totalAmount; payment = { amount: totalAmount, method: roll <= 4 ? 'CASH' : 'ONLINE', reference: roll <= 4 ? null : `TXN-${Date.now()}-${i}` }; }
      else if (roll === 6 || roll === 9) { status = 'PARTIAL'; paidAmount = roll === 6 ? 2000 : 1500; payment = { amount: paidAmount, method: 'CASH', reference: null }; }
      else if (roll === 7 && isPastDue) { status = 'OVERDUE'; }

      const record = await prisma.feeRecord.create({
        data: { studentId: student.id, dueDate, totalAmount, paidAmount, status, dueCharges: 0 },
      });
      if (payment) {
        const paidAt = new Date(Math.min(dueDate.getTime() - 2 * 86400000, Date.now()));
        await prisma.feePayment.create({ data: { feeRecordId: record.id, amount: payment.amount, method: payment.method, reference: payment.reference, paidAt } });
        status === 'PAID' ? paidCount++ : partialCount++;
      }
      made++;
    }
  }
  return { records: made, paidPayments: paidCount, partialPayments: partialCount };
}

// ─── 9. Exams + Exam Results ────────────────────────────────────────────────
async function ensureExams(schoolId, terms, students, allSubjects) {
  if (!terms.length || !students.length) return { exams: 0, results: 0 };

  // Find first term
  const term = terms[0];
  const examName = 'Mid-Term Examination';
  let exam = await prisma.exam.findFirst({ where: { schoolId, termId: term.id, name: examName } });
  if (exam) return { exams: 1, results: 0 };

  exam = await prisma.exam.create({
    data: {
      schoolId, termId: term.id, name: examName,
      startDate: new Date(), endDate: new Date(Date.now() + 7 * 86400000),
    },
  });

  // Create results for first 10 students
  let resultsMade = 0;
  const sampleStudents = students.slice(0, Math.min(10, students.length));
  for (const student of sampleStudents) {
    const section = await prisma.section.findUnique({ where: { id: student.sectionId } });
    if (!section) continue;
    const classSubjects = allSubjects.filter((s) => s.classId === section.classId);
    for (const sub of classSubjects.slice(0, 3)) { // 3 subjects per student
      const maxMarks = 100;
      const marksObtained = 40 + Math.floor(Math.random() * 55); // 40-95
      const exists = await prisma.examResult.findFirst({ where: { examId: exam.id, studentId: student.id, subjectId: sub.id } });
      if (!exists) {
        await prisma.examResult.create({
          data: { examId: exam.id, studentId: student.id, subjectId: sub.id, marksObtained, maxMarks },
        });
        resultsMade++;
      }
    }
  }
  return { exams: 1, results: resultsMade };
}

// ─── 10. Timetable Slots ────────────────────────────────────────────────────
async function ensureTimetable(sections, teachers, allSubjects) {
  let made = 0;
  for (const section of sections) {
    const existing = await prisma.timetableSlot.count({ where: { sectionId: section.id } });
    if (existing > 0) continue;

    const classSubjects = allSubjects.filter((s) => s.classId === section.classId);
    if (!classSubjects.length || !teachers.length) continue;

    for (const day of WEEKDAYS) {
      for (let p = 0; p < Math.min(PERIODS.length, classSubjects.length); p++) {
        const subject = classSubjects[p];
        const teacher = teachers[(day + p) % teachers.length]; // rotate teachers
        const exists = await prisma.timetableSlot.findFirst({
          where: { sectionId: section.id, subjectId: subject.id, dayOfWeek: day, startTime: PERIODS[p].start },
        });
        if (!exists) {
          await prisma.timetableSlot.create({
            data: {
              sectionId: section.id, subjectId: subject.id, teacherId: teacher.id,
              dayOfWeek: day, startTime: PERIODS[p].start, endTime: PERIODS[p].end,
            },
          });
          made++;
        }
      }
    }
  }
  return made;
}

// ─── 11. Attendance Records (last 5 school days) ────────────────────────────
async function ensureAttendance(students) {
  let made = 0;
  const now = new Date();
  // Get last 5 weekdays
  const dates = [];
  const d = new Date(now);
  while (dates.length < 5) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) dates.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }

  for (const date of dates) {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const exists = await prisma.attendanceRecord.findFirst({
        where: { studentId: student.id, date: dateOnly },
      });
      if (exists) continue;

      const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];
      const status = statuses[i % statuses.length];

      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id, date: dateOnly, status,
          checkIn: status !== 'ABSENT' ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 7, 45 + (i % 15)) : null,
        },
      });
      made++;
    }
  }
  return made;
}

// ─── 12. Scan Devices ───────────────────────────────────────────────────────
async function ensureScanDevice(schoolId) {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { scanDevices: true } });
  if (school?.scanDevices?.length > 0) return school.scanDevices[0];
  const device = { id: crypto.randomUUID(), deviceName: 'Main Gate Scanner', type: 'QR_WEB_CAMERA', location: 'Main Gate', deviceMac: null };
  await prisma.school.update({ where: { id: schoolId }, data: { scanDevices: [device] } });
  return device;
}

// ─── 13. Circulars ──────────────────────────────────────────────────────────
async function ensureCirculars(schoolId) {
  const existing = await prisma.circular.count({ where: { schoolId } });
  if (existing > 0) return 0;
  let made = 0;
  for (const c of CIRCULARS) {
    await prisma.circular.create({ data: { schoolId, ...c } });
    made++;
  }
  return made;
}

// ─── 14. Activities ─────────────────────────────────────────────────────────
async function ensureActivities(schoolId) {
  const existing = await prisma.activity.count({ where: { schoolId } });
  if (existing > 0) return 0;
  let made = 0;
  const now = new Date();
  for (const a of ACTIVITIES) {
    await prisma.activity.create({
      data: { schoolId, title: a.title, description: a.description, eventDate: new Date(now.getTime() + a.daysOffset * 86400000) },
    });
    made++;
  }
  return made;
}

// ─── 15. PTM Sessions ───────────────────────────────────────────────────────
async function ensurePTMSessions(schoolId, teacherIds) {
  const existing = await prisma.pTMSession.count({ where: { schoolId } });
  if (existing > 0) return 0;
  const now = new Date();
  await prisma.pTMSession.create({
    data: {
      schoolId, title: 'Parent-Teacher Meeting — Term 1',
      description: 'Discuss mid-term results and student progress',
      scheduledAt: new Date(now.getTime() + 14 * 86400000),
      location: 'School Auditorium', status: 'SCHEDULED', scope: 'WHOLE_SCHOOL',
      teacherIds: teacherIds.slice(0, 3),
    },
  });
  return 1;
}

// ─── 16. Homework Broadcasts ────────────────────────────────────────────────
async function ensureHomework(schoolId, sections, teachers) {
  const existing = await prisma.homeworkBroadcast.count({ where: { schoolId } });
  if (existing > 0) return 0;
  let made = 0;
  const titles = ['Math Exercise 3.2', 'English Reading Passage', 'Science Chapter Review'];
  for (let i = 0; i < Math.min(3, sections.length); i++) {
    await prisma.homeworkBroadcast.create({
      data: {
        schoolId, sectionId: sections[i].id,
        createdById: teachers[0]?.id,
        title: titles[i], content: `Complete the assigned work and bring it tomorrow.`,
      },
    });
    made++;
  }
  return made;
}

// ─── 17. Conduct Remarks ────────────────────────────────────────────────────
async function ensureConductRemarks(students, teachers) {
  if (!students.length || !teachers.length) return 0;
  const existing = await prisma.conductRemark.count();
  if (existing > 0) return 0;
  let made = 0;
  const comments = [
    { type: 'POSITIVE', comment: 'Excellent participation in class today.' },
    { type: 'NEUTRAL', comment: 'Needs to focus more during lectures.' },
    { type: 'NEGATIVE', comment: 'Found using phone during class hours.' },
    { type: 'POSITIVE', comment: 'Helped classmates with their work.' },
  ];
  for (let i = 0; i < Math.min(4, students.length); i++) {
    await prisma.conductRemark.create({
      data: {
        studentId: students[i].id, teacherId: teachers[0].id,
        ...comments[i],
      },
    });
    made++;
  }
  return made;
}

// ─── 18. Applicants (Admission Pipeline) ────────────────────────────────────
async function ensureApplicants(schoolId, classes) {
  const existing = await prisma.applicant.count({ where: { schoolId } });
  if (existing > 0) return 0;
  if (!classes.length) return 0;
  let made = 0;
  const applicants = [
    { firstName: 'Talha', lastName: 'Butt', status: 'INQUIRY' },
    { firstName: 'Saad', lastName: 'Raza', status: 'TEST_SCHEDULED' },
    { firstName: 'Amina', lastName: 'Sheikh', status: 'FORM_SUBMITTED' },
  ];
  for (const a of applicants) {
    await prisma.applicant.create({
      data: {
        schoolId, classId: classes[0].id, ...a,
        parentName: `${a.lastName} Sahib`,
        parentPhone: `0300${String(1000000 + made)}`,
        parentWhatsappNo: `0321${String(1000000 + made)}`,
      },
    });
    made++;
  }
  return made;
}

// ─── Main Seeding Logic ─────────────────────────────────────────────────────
async function seedBranch(school, opts) {
  console.log(`\n=== Seeding: ${school.name} (${school.code}) ===`);

  const year = await ensureAcademicYear(school.id);
  console.log(`  Academic year: ${year.name}`);

  const terms = await ensureTerms(year.id);
  console.log(`  Terms: ${terms.length}`);

  const sections = await ensureClassesAndSections(school.id);
  console.log(`  Sections: ${sections.length}`);

  await ensureSectionTemplates(school.id);
  console.log(`  Section templates created`);

  const classes = [...new Map(sections.map((s) => [s.classId, { id: s.classId }])).values()];
  const allSubjects = await ensureSubjects(classes);
  console.log(`  Subjects: ${allSubjects.length} (${SUBJECTS.length} per class)`);

  const teacherCount = await createTeachers(school.id, school.organizationId, opts.teachers, school.code);
  console.log(`  Teachers created: ${teacherCount} (login: Teacher@123)`);

  // Fetch all teachers for this school
  const teachers = await prisma.user.findMany({ where: { schoolId: school.id, role: 'TEACHER' } });

  const assignments = await ensureTeacherAssignments(teachers, classes, sections, allSubjects);
  console.log(`  Teacher assignments: ${assignments}`);

  const { structure, total } = await ensureFeeStructure(school.id, year.id, classes);
  console.log(`  Fee structure: "${structure.name}" — Rs ${total}/month`);

  const students = await createStudents(school.id, sections, opts.students);
  console.log(`  Students created: ${students.length}`);

  const feeStats = await seedFeeRecords(students, total, Math.max(1, opts.months));
  console.log(`  Fee records: ${feeStats.records} (PAID: ${feeStats.paidPayments}, PARTIAL: ${feeStats.partialPayments})`);

  const examStats = await ensureExams(school.id, terms, students, allSubjects);
  console.log(`  Exams: ${examStats.exams}, Results: ${examStats.results}`);

  const timetableSlots = await ensureTimetable(sections, teachers, allSubjects);
  console.log(`  Timetable slots: ${timetableSlots}`);

  const attendanceRecords = await ensureAttendance(students);
  console.log(`  Attendance records: ${attendanceRecords}`);

  await ensureScanDevice(school.id);
  console.log(`  Scan device: Main Gate Scanner`);

  const circularCount = await ensureCirculars(school.id);
  console.log(`  Circulars: ${circularCount}`);

  const activityCount = await ensureActivities(school.id);
  console.log(`  Activities: ${activityCount}`);

  const ptmCount = await ensurePTMSessions(school.id, teachers.map((t) => t.id));
  console.log(`  PTM sessions: ${ptmCount}`);

  const hwCount = await ensureHomework(school.id, sections, teachers);
  console.log(`  Homework broadcasts: ${hwCount}`);

  const conductCount = await ensureConductRemarks(students, teachers);
  console.log(`  Conduct remarks: ${conductCount}`);

  const applicantCount = await ensureApplicants(school.id, classes);
  console.log(`  Applicants: ${applicantCount}`);

  // Print login credentials
  const staff = await prisma.user.findMany({
    where: { schoolId: school.id },
    select: { name: true, email: true, role: true },
  });
  console.log(`\n  Login credentials for ${school.name}:`);
  for (const u of staff) {
    const pw = u.role === 'ADMIN' ? 'Admin@123' : 'Teacher@123';
    console.log(`    ${u.role}: ${u.email} / ${pw}`);
  }
}

async function main() {
  const opts = parseArgs();
  console.log('=== School ERP — Initial Setup Seeder ===\n');

  const schools = [];
  if (opts.branchIds.length) {
    const found = await prisma.school.findMany({ where: { id: { in: opts.branchIds } } });
    if (found.length !== opts.branchIds.length) {
      console.error('ERROR: kuch branch IDs nahi mile:', opts.branchIds.filter((id) => !found.some((s) => s.id === id)));
      process.exit(1);
    }
    schools.push(...found);
  }
  if (opts.orgIds.length) {
    const found = await prisma.school.findMany({ where: { organizationId: { in: opts.orgIds } } });
    if (!found.length) { console.error('ERROR: in organizations mein koi branch nahi mili'); process.exit(1); }
    schools.push(...found);
  }

  console.log(`Branches to seed: ${schools.length}`);
  console.log(`Options: --students ${opts.students} --teachers ${opts.teachers} --months ${opts.months}\n`);

  for (const school of schools) await seedBranch(school, opts);

  console.log('\n✔ Done! Saari initial setup data create ho gayi hai.');
  console.log('\nQuick login credentials:');
  console.log('  Admin login:  schoolCode + admin.<code>@seed.example.com / Admin@123');
  console.log('  Teacher login: schoolCode + teacher1.<code>@seed.example.com / Teacher@123');
}

// ─── Entry guard ─────────────────────────────────────────────────────────────
// Direct run (npm run seed / node scripts/seed-data.js) → main().
// Imported as a module (scripts/demo-data.js) → reuse seedBranch() only.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((err) => { console.error('SEED FAILED:', err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}

export { seedBranch };
