import type { AttendanceRecord, StudentLite } from '@/types';
import { downloadBlob } from '@/lib/utils';
import { SYMBOL } from './matrixView';

const SYMBOL_OF = (st: string | undefined) => (st ? SYMBOL[st] ?? st : '');

function quote(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function toCsv(header: string[], rows: (string | number)[][], filename: string) {
  const csv = [header, ...rows].map((r) => r.map(quote).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

function monthCells(year: number, month: number, weeklyOff: number[]) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { day: number; weekend: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, weekend: weeklyOff.includes(new Date(year, month - 1, d).getDay()) });
  }
  return cells;
}

function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
const key = (studentId: string, date: string) => `${studentId}:${String(date).split('T')[0]}`;

/** Monthly matrix CSV — each student's daily status (P/L/A/LV/HD/W/H) + counts. */
export function exportSectionMatrixCsv(params: {
  students: StudentLite[];
  records: AttendanceRecord[];
  offDays: { date: string }[];
  weeklyOff: number[];
  year: number;
  month: number;
  label: string;
}) {
  const { students, records, offDays, weeklyOff, year, month, label } = params;
  const map = new Map<string, AttendanceRecord>();
  records.forEach((r) => map.set(key(r.studentId, r.date), r));
  const offSet = new Set(offDays.map((o) => o.date));
  const cells = monthCells(year, month, weeklyOff);
  const header = ['Student', 'Roll #', ...cells.map((c) => String(c.day)), 'P', 'L', 'A', 'LV', 'HD'];

  const rows = students.map((s) => {
    const counts = { P: 0, L: 0, A: 0, LV: 0, HD: 0 };
    const dayCells = cells.map(({ day, weekend }) => {
      const date = `${year}-${pad2(month)}-${pad2(day)}`;
      if (offSet.has(date)) return 'H';
      if (weekend) return 'W';
      const rec = map.get(key(s.id, date));
      if (rec) { const k = rec.status; if (k in counts) counts[k as keyof typeof counts] += 1; return SYMBOL_OF(rec.status); }
      return '';
    });
    return [`${s.firstName} ${s.lastName}`, String(s.rollNumber), ...dayCells, counts.P, counts.L, counts.A, counts.LV, counts.HD];
  });

  toCsv(header, rows, `${label}-attendance-${year}-${pad2(month)}`);
}

/** Whole-school monthly CSV — har section × student × date + counts (class/section columns). */
export function exportSchoolMonthlyCsv(params: {
  classes: { className: string; sections: { sectionName: string; students: StudentLite[]; records: AttendanceRecord[] }[] }[];
  offDays: { date: string }[];
  weeklyOff: number[];
  year: number;
  month: number;
  filename?: string;
}) {
  const { classes, offDays, weeklyOff, year, month, filename } = params;
  const offSet = new Set(offDays.map((o) => o.date));
  const cells = monthCells(year, month, weeklyOff);
  const header = ['Class', 'Section', 'Student', 'Roll #', ...cells.map((c) => String(c.day)), 'P', 'L', 'A', 'LV', 'HD'];
  const rows: (string | number)[][] = [];

  for (const cls of classes) {
    for (const sec of cls.sections) {
      const map = new Map<string, AttendanceRecord>();
      sec.records.forEach((r) => map.set(key(r.studentId, r.date), r));
      for (const s of sec.students) {
        const counts = { P: 0, L: 0, A: 0, LV: 0, HD: 0 };
        const dayCells = cells.map(({ day, weekend }) => {
          const date = `${year}-${pad2(month)}-${pad2(day)}`;
          if (offSet.has(date)) return 'H';
          if (weekend) return 'W';
          const rec = map.get(key(s.id, date));
          if (rec) { const k = rec.status; if (k in counts) counts[k as keyof typeof counts] += 1; return SYMBOL_OF(rec.status); }
          return '';
        });
        rows.push([cls.className, sec.sectionName, `${s.firstName} ${s.lastName}`, String(s.rollNumber), ...dayCells, counts.P, counts.L, counts.A, counts.LV, counts.HD]);
      }
    }
  }

  toCsv(header, rows, filename || `school-attendance-${year}-${pad2(month)}`);
}

/** Single-student monthly detail — one row per day (status + check in/out + remarks). */
export function exportStudentMonthCsv(params: {
  student: StudentLite;
  records: AttendanceRecord[];
  offDays: { date: string }[];
  weeklyOff: number[];
  year: number;
  month: number;
}) {
  const { student, records, offDays, weeklyOff, year, month } = params;
  const map = new Map<string, AttendanceRecord>();
  records.forEach((r) => map.set(key(r.studentId, r.date), r));
  const offSet = new Set(offDays.map((o) => o.date));
  const cells = monthCells(year, month, weeklyOff);
  const header = ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Remarks'];

  const rows = cells.map(({ day, weekend }) => {
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    const dow = new Date(year, month - 1, day).toLocaleDateString('en-PK', { weekday: 'short' });
    if (weekend) return [date, dow, 'Weekend', '', '', ''];
    if (offSet.has(date)) return [date, dow, 'School Off', '', '', ''];
    const rec = map.get(key(student.id, date));
    if (!rec) return [date, dow, 'Unmarked', '', '', ''];
    const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '');
    return [date, dow, rec.status.replace('_', ' '), time(rec.checkIn), time(rec.checkOut), rec.remarks ?? ''];
  });

  toCsv(header, rows, `${student.firstName}-${student.lastName}-${year}-${pad2(month)}`);
}
