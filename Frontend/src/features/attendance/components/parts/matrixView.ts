import type { AttendanceRecord } from '@/types';

/** Day-columns per segment — "initial 12 days, then next 15, then rest". */
export const SEGMENT = 12;

export const SYMBOL: Record<string, string> = {
  PRESENT: 'P',
  LATE: 'L',
  ABSENT: 'A',
  LEAVE: 'LV',
  HALF_DAY: 'HD',
  MANUAL_OVERRIDE: 'MO',
};

export const CELL_STYLE: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  LATE: 'bg-amber-100 text-amber-700',
  ABSENT: 'bg-red-100 text-red-600',
  LEAVE: 'bg-primary-100 text-primary-600',
  HALF_DAY: 'bg-cyan-100 text-cyan-700',
  MANUAL_OVERRIDE: 'bg-purple-100 text-purple-600',
};

export const DOW_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Off day / holiday cell (extra closure beyond weekends) */
export const OFF_STYLE = 'bg-orange-50 text-orange-500';

export const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function buildSegments(total: number) {
  const segs: { from: number; to: number }[] = [];
  for (let start = 1; start <= total; start += SEGMENT) {
    segs.push({ from: start, to: Math.min(start + SEGMENT - 1, total) });
  }
  return segs;
}

export function buildRecordMap(records: AttendanceRecord[]) {
  const map = new Map<string, AttendanceRecord>();
  for (const r of records) map.set(`${r.studentId}:${String(r.date).split('T')[0]}`, r);
  return map;
}

/** Off-day lookup: date -> reason */
export function buildOffDayMap(offDays: { date: string; reason?: string | null }[]) {
  return new Map(offDays.map((o) => [o.date, o.reason || 'School Off']));
}