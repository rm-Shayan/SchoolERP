export const TIME_SLOTS = [
  { key: 'attendanceStartTime', label: 'Scan Start', desc: 'QR scanning opens', color: 'bg-primary-500', defaultVal: '07:45' },
  { key: 'attendanceCutoffTime', label: 'Late Cutoff', desc: 'Unmarked → LATE', color: 'bg-amber-500', defaultVal: '08:30' },
  { key: 'attendanceAbsentTime', label: 'Absent Cutoff', desc: 'Still late → ABSENT', color: 'bg-red-500', defaultVal: '10:00' },
  { key: 'attendanceAlertTime', label: 'Alert Time', desc: 'Parent notifications', color: 'bg-purple-500', defaultVal: '09:30' },
] as const;

export type TimeSlotKey = (typeof TIME_SLOTS)[number]['key'];

/** Convert HH:MM to minutes since midnight. */
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Validate attendance time ordering: start < cutoff ≤ alert ≤ absent.
 * Returns null if valid, or an error message string.
 */
export function validateAttendanceOrder(times: Record<TimeSlotKey, string>): string | null {
  const s = toMin(times.attendanceStartTime || '07:45');
  const c = toMin(times.attendanceCutoffTime || '08:30');
  const a = toMin(times.attendanceAbsentTime || '10:00');
  const al = toMin(times.attendanceAlertTime || '09:30');
  if (!(s < c && c <= al && al <= a)) {
    return 'Attendance times must be ordered: Start < Late Cutoff ≤ Alert ≤ Absent';
  }
  return null;
}
