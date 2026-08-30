/**
 * Seed org demo data for Oxford (jr Campus OX-F34-01) — aresharao9@gmail.com demo.
 *  1. Ensures admin password = aresharao
 *  2. Creates date-sheet papers for the current year's existing exams
 *  3. Seeds conduct remarks (authored by a real teacher)
 *  4. Seeds one scheduled PTM session
 * Idempotent-ish: papers are deleted+recreated; remarks/PTM guarded by existence.
 *
 * Usage: node --env-file=.env scripts/seed-org-data.js
 */
import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

const ORG_SLUG = 'oxford';
const SCHOOL_CODE = 'OX-F34-01';
const ADMIN_EMAIL = 'areesharao9@gmail.com';
const ADMIN_PASSWORD = 'aresharao';

const papersPerDay = 2;
const slotTimes = [['09:00', '11:00'], ['11:30', '13:30']];

function dayRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function ensureAdminPassword(schoolId) {
  const user = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL, schoolId } });
  if (!user) {
    console.log(`  ⚠ Admin ${ADMIN_EMAIL} not found in branch — skipping password ensure.`);
    return;
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const matches = bcrypt.compareSync(ADMIN_PASSWORD, user.password);
  if (!matches && hash !== user.password) {
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    console.log(`  ✓ Reset ${ADMIN_EMAIL} password to "${ADMIN_PASSWORD}".`);
  } else {
    console.log(`  ✓ ${ADMIN_EMAIL} password already correct.`);
  }
}

async function seedPapers(exam, classes) {
  const existing = await prisma.examPaper.count({ where: { examId: exam.id } });
  if (existing) {
    await prisma.examPaper.deleteMany({ where: { examId: exam.id } });
    console.log(`  ~ Cleared ${existing} old papers for "${exam.name}".`);
  }
  const totalPapers = classes.reduce((n, c) => n + c.subjects.length, 0);
  const neededDays = Math.ceil(totalPapers / papersPerDay);
  let dates = dayRange(exam.startDate, exam.endDate);
  if (dates.length < neededDays) {
    const widenedEnd = new Date(exam.startDate);
    widenedEnd.setDate(widenedEnd.getDate() + neededDays - 1);
    await prisma.exam.update({ where: { id: exam.id }, data: { endDate: widenedEnd } });
    dates = dayRange(exam.startDate, widenedEnd);
    console.log(`  ~ Widened "${exam.name}" window to ${dates.length} days (was ${exam.endDate.toISOString().slice(0, 10)}).`);
  }
  const papers = [];
  for (const cls of classes) {
    for (const subj of cls.subjects) {
      const k = papers.length;
      const dateIdx = Math.floor(k / papersPerDay);
      if (!dates[dateIdx]) break;
      const [startTime, endTime] = slotTimes[k % papersPerDay];
      papers.push({
        examId: exam.id,
        classId: cls.id,
        subjectId: subj.id,
        date: new Date(`${dates[dateIdx]}T04:00:00Z`),
        startTime,
        endTime,
        maxMarks: 100,
        roomNumber: `R${(k % 10) + 1}`,
      });
    }
  }
  if (papers.length) {
    await prisma.examPaper.createMany({ data: papers });
    console.log(`  ✓ "${exam.name}": ${papers.length} papers created.`);
  }
}

async function seedRemarks(currentYearId, students, teachers) {
  const author = teachers[0];
  if (!author) return;
  const existing = await prisma.conductRemark.count({ where: { academicYearId: currentYearId } });
  if (existing) {
    console.log(`  ~ ${existing} conduct remarks already exist — skipping.`);
    return;
  }
  const templates = [
    { type: 'POSITIVE', comment: 'Bahut mehnati aur tawajju pasand student hai.' },
    { type: 'NEUTRAL', comment: 'Satisfactory — mazeed pyaar barhane ki gunjaaish hai.' },
    { type: 'NEGATIVE', comment: 'Class mein tawajju kam — remarks dene ki zaroorat.' },
  ];
  const data = [];
  students.forEach((s, i) => {
    const t = templates[i % templates.length];
    data.push({ studentId: s.id, teacherId: author.id, academicYearId: currentYearId, type: t.type, comment: t.comment });
  });
  if (data.length) {
    await prisma.conductRemark.createMany({ data });
    console.log(`  ✓ ${data.length} conduct remarks seeded.`);
  }
}

async function seedPtm(schoolId, teachers, endDate) {
  const existing = await prisma.pTMSession.count({ where: { schoolId } });
  if (existing) {
    console.log(`  ~ ${existing} PTM session(s) already exist — skipping.`);
    return;
  }
  const scheduledAt = new Date(endDate);
  scheduledAt.setDate(scheduledAt.getDate() + 5);
  await prisma.pTMSession.create({
    data: {
      schoolId,
      title: 'Parents Teachers Meeting',
      description: 'Year-end PTM — results aur progress card distribution.',
      scheduledAt,
      location: 'Main Hall, Jr Campus',
      status: 'SCHEDULED',
      scope: 'WHOLE_SCHOOL',
      teacherIds: teachers.slice(0, 5).map((t) => t.id),
    },
  });
  console.log('  ✓ PTM session scheduled.');
}

async function main() {
  console.log('=== Oxford Org Demo Data Seed ===\n');
  const org = await prisma.organization.findFirst({ where: { slug: ORG_SLUG }, select: { id: true } });
  if (!org) {
    console.error('ERROR: Oxford org not found — aborting.');
    process.exit(1);
  }
  const school = await prisma.school.findFirst({ where: { organizationId: org.id, code: SCHOOL_CODE } });
  if (!school) {
    console.error(`ERROR: Branch "${SCHOOL_CODE}" not found — aborting.`);
    process.exit(1);
  }
  console.log(`Branch: ${school.name} (${school.code})\n`);

  await ensureAdminPassword(school.id);

  const year = await prisma.academicYear.findFirst({
    where: { schoolId: school.id, isCurrent: true, terms: { some: {} } },
    include: { terms: true },
  });
  if (!year) {
    console.error('ERROR: No current academic year with terms — aborting.');
    process.exit(1);
  }
  console.log(`Year: ${year.name} (${year.terms.length} terms)\n`);

  const classes = await prisma.class.findMany({
    where: { schoolId: school.id },
    select: { id: true, name: true, sections: { select: { id: true, name: true } }, subjects: { select: { id: true, name: true } } },
    orderBy: { order: 'asc' },
  });
  const withSubjects = classes.filter((c) => c.subjects.length > 0);
  console.log(`Classes with subjects: ${withSubjects.length}`);

  const exams = await prisma.exam.findMany({ orderBy: { startDate: 'asc' } });
  for (const exam of exams) await seedPapers(exam, withSubjects);

  const teachers = await prisma.user.findMany({ where: { schoolId: school.id, role: 'TEACHER' }, select: { id: true } });
  const students = await prisma.student.findMany({ where: { schoolId: school.id, status: 'ACTIVE' }, select: { id: true }, take: 6 });
  await seedRemarks(year.id, students, teachers);
  await seedPtm(school.id, teachers, year.endDate);

  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });