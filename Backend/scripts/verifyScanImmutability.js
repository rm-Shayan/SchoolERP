/**
 * Verifies that repeated gate scans never move the stored check-in.
 *
 * A student/staff member scans 2-3 times in a day (re-scan, card passed twice,
 * gate loop). The record that lands in the database must always be the FIRST
 * scan of that day; later student scans may only append to the scan log. An
 * explicit checkIn from an admin stays the only way to correct a record.
 *
 * Run:  node --env-file=dev.env scripts/verifyScanImmutability.js
 *
 * Kept out of `npm test` on purpose: the staff service opens BullMQ/Redis
 * connections, which would keep the test runner's event loop alive forever.
 * Builds throwaway fixtures (org -> branch -> class -> section -> parent ->
 * student + teacher) and removes them again.
 */
import prisma from '../src/config/db.js';
import attendanceRepository from '../src/modules/attendance/repository.js';
import staffAttendanceService from '../src/modules/staffAttendance/staffAttendance.service.js';
import { signAttendanceToken } from '../src/lib/utils/attendanceToken.js';

const stamp = Date.now();
const day = new Date();
day.setHours(0, 0, 0, 0);
const at = (h, m) => {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
};
const hhmm = (d) =>
  d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : 'null';

let failed = 0;
const assert = (label, ok, detail) => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const ctx = {};

async function seed() {
  ctx.org = await prisma.organization.create({
    data: {
      name: `ScanTest Org ${stamp}`,
      slug: `scan-test-org-${stamp}`,
      code: `SCANORG${stamp % 100000}`,
    },
  });
  ctx.school = await prisma.school.create({
    data: {
      organizationId: ctx.org.id,
      name: 'ScanTest Campus',
      code: `SCANCAMP${stamp % 100000}`,
      isDefaultBranch: true,
    },
  });
  const klass = await prisma.class.create({ data: { schoolId: ctx.school.id, name: 'ScanTest Class' } });
  ctx.section = await prisma.section.create({ data: { classId: klass.id, name: 'A' } });
  ctx.parent = await prisma.parent.create({
    data: { name: 'ScanTest Parent', whatsappNo: `92300${stamp % 10000000}` },
  });
  ctx.student = await prisma.student.create({
    data: {
      schoolId: ctx.school.id,
      sectionId: ctx.section.id,
      parentId: ctx.parent.id,
      identifierCode: `SCAN-QR-${stamp}`,
      rollNumber: '1',
      firstName: 'Scan',
      lastName: 'Student',
    },
  });
  ctx.staff = await prisma.user.create({
    data: {
      schoolId: ctx.school.id,
      organizationId: ctx.org.id,
      name: 'Scan Teacher',
      email: `scan-teacher-${stamp}@test.local`,
      password: 'x',
      role: 'TEACHER',
    },
  });
}

async function main() {
  await seed();

  // ── STUDENT: scans at 08:00, 10:00 and 15:00 (cutoff 08:30) ─────────────
  await attendanceRepository.upsertScanAndRecord(ctx.student.id, day, at(8, 0), 'QR', 'dev-1', '08:30');
  await attendanceRepository.upsertScanAndRecord(ctx.student.id, day, at(10, 0), 'QR', 'dev-1', '08:30');
  await attendanceRepository.upsertScanAndRecord(ctx.student.id, day, at(15, 0), 'QR', 'dev-2', '08:30');

  const s = await prisma.attendanceRecord.findUnique({
    where: { studentId_date: { studentId: ctx.student.id, date: day } },
  });
  assert('student checkIn stays at 1st scan (08:00)', hhmm(s.checkIn) === '08:00', hhmm(s.checkIn));
  assert('student status stays PRESENT', s.status === 'PRESENT', s.status);
  assert('student scanLog kept all 3 scans', s.scanLog?.length === 3, `len=${s.scanLog?.length}`);
  assert('student record exposes no checkOut', !('checkOut' in s), Object.keys(s).join(','));

  // late first scan must stay LATE (not silently become PRESENT on a re-scan)
  const lateDay = new Date(day);
  lateDay.setDate(lateDay.getDate() - 1);
  await attendanceRepository.upsertScanAndRecord(ctx.student.id, lateDay, at(9, 0), 'QR', 'dev-1', '08:30');
  await attendanceRepository.upsertScanAndRecord(ctx.student.id, lateDay, at(11, 0), 'QR', 'dev-1', '08:30');
  const late = await prisma.attendanceRecord.findUnique({
    where: { studentId_date: { studentId: ctx.student.id, date: lateDay } },
  });
  assert('late student checkIn stays 09:00', hhmm(late.checkIn) === '09:00', hhmm(late.checkIn));
  assert('late student status stays LATE', late.status === 'LATE', late.status);

  // ── STAFF: three gate scans, then one repeated admin mark ────────────────
  await prisma.staffAttendance.deleteMany({ where: { staffId: ctx.staff.id, date: day } });

  const token = signAttendanceToken({
    staffId: ctx.staff.id,
    organizationId: ctx.org.id,
    schoolId: ctx.school.id,
  });
  const scanner = { role: 'RECEPTIONIST', organizationId: ctx.org.id, schoolId: ctx.school.id };

  const first = await staffAttendanceService.scanCheckIn(scanner, token);
  const second = await staffAttendanceService.scanCheckIn(scanner, token);
  const third = await staffAttendanceService.scanCheckIn(scanner, token);

  const st = await prisma.staffAttendance.findUnique({
    where: { staffId_date: { staffId: ctx.staff.id, date: day } },
  });
  assert('staff 1st scan wrote a checkIn', Boolean(st.checkIn), hhmm(st.checkIn));
  assert('staff 2nd scan reports alreadyCheckedIn', second.alreadyCheckedIn === true);
  assert('staff 3rd scan reports alreadyCheckedIn', third.alreadyCheckedIn === true);
  assert(
    'staff checkIn identical across all 3 scans',
    new Date(first.record.checkIn).getTime() === st.checkIn.getTime(),
    `${hhmm(new Date(first.record.checkIn))} === ${hhmm(st.checkIn)}`
  );

  await staffAttendanceService.markAttendance(ctx.school.id, { staffId: ctx.staff.id, status: 'PRESENT' });
  const afterMark = await prisma.staffAttendance.findUnique({
    where: { staffId_date: { staffId: ctx.staff.id, date: day } },
  });
  assert(
    'staff checkIn survives a repeated admin mark',
    afterMark.checkIn.getTime() === st.checkIn.getTime(),
    `${hhmm(st.checkIn)} -> ${hhmm(afterMark.checkIn)}`
  );

  await staffAttendanceService.markAttendance(ctx.school.id, {
    staffId: ctx.staff.id,
    status: 'PRESENT',
    checkIn: at(7, 45),
  });
  const afterFix = await prisma.staffAttendance.findUnique({
    where: { staffId_date: { staffId: ctx.staff.id, date: day } },
  });
  assert('explicit admin checkIn still overrides to 07:45', hhmm(afterFix.checkIn) === '07:45', hhmm(afterFix.checkIn));

  // ── STAFF CHECK-OUT: first write wins, re-scan keeps the first time ──────
  const out1 = await staffAttendanceService.scanCheckOut(scanner, token);
  const out1Time = new Date(out1.record.checkOut).getTime();
  await new Promise((r) => setTimeout(r, 1100));
  const out2 = await staffAttendanceService.scanCheckOut(scanner, token);
  const out3 = await staffAttendanceService.scanCheckOut(scanner, token);

  const stOut = await prisma.staffAttendance.findUnique({
    where: { staffId_date: { staffId: ctx.staff.id, date: day } },
  });

  assert('staff check-out recorded on 1st scan', Boolean(stOut.checkOut), hhmm(stOut.checkOut));
  assert('staff check-out keeps checkIn from the morning', hhmm(stOut.checkIn) === '07:45', hhmm(stOut.checkIn));
  assert('staff 2nd check-out scan reports alreadyCheckedOut', out2.alreadyCheckedOut === true);
  assert('staff 3rd check-out scan reports alreadyCheckedOut', out3.alreadyCheckedOut === true);
  assert(
    'staff checkOut identical across re-scans (not moved to now)',
    new Date(stOut.checkOut).getTime() === out1Time,
    `${hhmm(new Date(out1Time))} === ${hhmm(stOut.checkOut)}`
  );

  // check-out without a check-in must be rejected
  const fresh = await prisma.user.create({
    data: {
      schoolId: ctx.school.id,
      organizationId: ctx.org.id,
      name: 'No CheckIn Teacher',
      email: `scan-noc-in-${stamp}@test.local`,
      password: 'x',
      role: 'TEACHER',
    },
  });
  const freshToken = signAttendanceToken({
    staffId: fresh.id,
    organizationId: ctx.org.id,
    schoolId: ctx.school.id,
  });
  let rejected = false;
  try {
    await staffAttendanceService.scanCheckOut(scanner, freshToken);
  } catch (e) {
    rejected = /check-in first/i.test(e.message);
  }
  assert('staff check-out without check-in is rejected', rejected);
}

main()
  .catch((e) => {
    failed++;
    console.error('ERROR', e.message);
  })
  .finally(async () => {
    if (ctx.org) await prisma.organization.delete({ where: { id: ctx.org.id } }).catch(() => {});
    if (ctx.parent) await prisma.parent.delete({ where: { id: ctx.parent.id } }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
    console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
    process.exit(failed === 0 ? 0 : 1);
  });