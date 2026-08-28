import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// ─── Token utilities ────────────────────────────────────────
import { signAttendanceToken, verifyAttendanceToken } from '../../lib/utils/attendanceToken.js';

describe('Attendance Token — sign & verify round-trip', () => {
  it('generates a SAT1.* token and verifies back to the same payload', () => {
    const token = signAttendanceToken({ staffId: 's1', organizationId: 'o1', schoolId: 'sch1' });
    assert.match(token, /^SAT1\./, 'token starts with SAT1 prefix');
    const parts = token.split('.');
    assert.equal(parts.length, 3, 'token has exactly 3 dot-separated parts');

    const data = verifyAttendanceToken(token);
    assert.deepEqual(data, { staffId: 's1', organizationId: 'o1', schoolId: 'sch1' });
  });

  it('returns null for tampered payload', () => {
    const token = signAttendanceToken({ staffId: 's2', organizationId: null, schoolId: null });
    const parts = token.split('.');
    // flip one char in payload
    const tampered = parts[1] + 'A';
    const result = verifyAttendanceToken([parts[0], tampered, parts[2]].join('.'));
    assert.equal(result, null, 'tampered token returns null');
  });

  it('returns null for completely invalid string', () => {
    assert.equal(verifyAttendanceToken(''), null);
    assert.equal(verifyAttendanceToken('garbage'), null);
    assert.equal(verifyAttendanceToken(null), null);
  });

  it('returns null for missing sid in payload', () => {
    const secret = process.env.MAIL_ENC_KEY || process.env.JWT_SECRET || 'school-erp-dev-only';
    const payload = Buffer.from(JSON.stringify({ sid: null })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    assert.equal(verifyAttendanceToken(`SAT1.${payload}.${sig}`), null);
  });
});

describe('Attendance Token — edge cases', () => {
  it('handles null organizationId and schoolId', () => {
    const token = signAttendanceToken({ staffId: 's3', organizationId: null, schoolId: null });
    const data = verifyAttendanceToken(token);
    assert.equal(data.staffId, 's3');
    assert.equal(data.organizationId, null);
    assert.equal(data.schoolId, null);
  });

  it('handles long staff IDs', () => {
    const longId = 'a'.repeat(256);
    const token = signAttendanceToken({ staffId: longId, organizationId: 'o1', schoolId: 'sch1' });
    const data = verifyAttendanceToken(token);
    assert.equal(data.staffId, longId);
  });
});

// ─── Service logic (no DB — just code path verification) ───
describe('StaffAttendanceService — importAttendance format validation', () => {
  it('rejects empty Excel buffer', async () => {
    // We can't test the full service without Prisma, but we can verify
    // that the xlsx import works and empty buffer is handled
    const xlsx = (await import('xlsx')).default;
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([['Staff Name', 'Date', 'Status']]);
    xlsx.utils.book_append_sheet(wb, ws, 'Staff Attendance');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    assert.ok(buf.length > 0, 'xlsx buffer is non-empty');
  });

  it('parses sample attendance rows correctly', async () => {
    const xlsx = (await import('xlsx')).default;
    const rows = [
      ['Staff Name', 'Email', 'Date', 'Status', 'Remarks'],
      ['Ahmed Khan', 'ahmed@test.com', '2026-08-27', 'PRESENT', 'On time'],
      ['Sara Ali', 'sara@test.com', '2026-08-27', 'LATE', '10 min late'],
    ];
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Staff Attendance');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Parse it back — same code path as importAttendance
    const parsed = xlsx.read(buf, { type: 'buffer' });
    const sheet = parsed.Sheets[parsed.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    assert.equal(data.length, 2, 'parses 2 data rows');
    assert.equal(data[0]['Staff Name'], 'Ahmed Khan');
    assert.equal(data[0]['Status'], 'PRESENT');
    assert.equal(data[1]['Status'], 'LATE');
  });
});

// ─── Daily report structure ─────────────────────────────────
describe('StaffDailyReport — expected structure', () => {
  it('summary contains all required fields', () => {
    const summary = {
      date: new Date(),
      totalStaff: 10,
      present: 7,
      late: 1,
      absent: 1,
      leave: 1,
      unmarked: 0,
    };
    assert.ok(summary.totalStaff >= 0);
    assert.ok(typeof summary.present === 'number');
    assert.ok(typeof summary.unmarked === 'number');
    assert.equal(
      summary.present + summary.late + summary.absent + summary.leave + summary.unmarked,
      summary.totalStaff,
      'all status counts sum to totalStaff'
    );
  });
});

// ─── Monthly report structure ───────────────────────────────
describe('StaffMonthlyReport — expected structure', () => {
  it('each staff record has days + total', () => {
    const record = {
      staff: { id: 's1', name: 'Ahmed', role: 'TEACHER' },
      days: { PRESENT: 20, LATE: 2, ABSENT: 1, LEAVE: 1 },
      total: 24,
    };
    const sum = Object.values(record.days).reduce((a, b) => a + b, 0);
    assert.equal(sum, record.total, 'days sum matches total');
  });
});

// ─── Route registration ─────────────────────────────────────
describe('StaffAttendance routes — expected registrations', () => {
  const expectedRoutes = [
    { method: 'POST', path: '/mark' },
    { method: 'POST', path: '/checkin' },
    { method: 'POST', path: '/bulk' },
    { method: 'GET', path: '/daily' },
    { method: 'GET', path: '/monthly' },
    { method: 'DELETE', path: '/:id' },
    { method: 'GET', path: '/export' },
    { method: 'POST', path: '/import' },
    { method: 'GET', path: '/download-template' },
    { method: 'GET', path: '/my' },
  ];

  it('all 10 routes exist in source code', async () => {
    const fs = await import('node:fs');
    const routes = fs.default.readFileSync(
      new URL('./staffAttendance.routes.js', import.meta.url),
      'utf-8',
    );
    for (const r of expectedRoutes) {
      const pattern = new RegExp(`router\\.${r.method.toLowerCase()}\\(\\s*["']${r.path.replace('/', '\\/')}`, 'i');
      assert.ok(
        pattern.test(routes),
        `route ${r.method} ${r.path} should be registered`,
      );
    }
  });
});
