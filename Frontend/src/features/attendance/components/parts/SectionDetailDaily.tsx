'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { DailyAttendanceReport } from '@/types';
import StatCards from './StatCards';
import AttendanceOverrideModal from './AttendanceOverrideModal';
import DayOffBanner from './DayOffBanner';
import DateNav from './DateNav';
import SectionDailyTable, { type DailyRow } from './SectionDailyTable';
import toast from 'react-hot-toast';

function getToday() { return new Date().toISOString().split('T')[0]; }
function readDateFromUrl(): string {
  if (typeof window === 'undefined') return getToday();
  const p = new URLSearchParams(window.location.search);
  return p.get('date') || getToday();
}

interface Props { sectionId: string; sectionName: string; className: string; }

export default function SectionDetailDaily({ sectionId }: Props) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [date, setDate] = useState(getToday);
  const [data, setData] = useState<DailyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [ov, setOv] = useState<DailyRow | null>(null);

  // Read date from URL on mount (avoids useSearchParams Suspense issue)
  useEffect(() => { setDate(readDateFromUrl()); }, []);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    try { setData(await attendanceService.getDailyReport({ schoolId, date })); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [schoolId, date]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => (data?.records ?? []).filter((r) => r.student?.sectionId === sectionId), [data, sectionId]);
  const s = useMemo(() => {
    const t = rows.length, p = rows.filter((r) => r.status === 'PRESENT').length;
    const l = rows.filter((r) => r.status === 'LATE').length, a = rows.filter((r) => r.status === 'ABSENT').length;
    const lv = rows.filter((r) => r.status === 'LEAVE').length, hd = rows.filter((r) => r.status === 'HALF_DAY').length;
    return { total: t, present: p, late: l, absent: a, leave: lv, halfDay: hd, pct: t > 0 ? Math.round(((p + l) / t) * 100) : 0 };
  }, [rows]);

  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weeklyOff = data?.weeklyOff ?? [0, 6];
  const isWeekend = weeklyOff.includes(new Date(date).getDay());
  const offDay = (data?.offDays ?? []).find((o) => o.date === date);
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try { await attendanceService.deleteRecord(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <DateNav date={date} onDate={setDate} onToday={() => setDate(getToday())} />
      </div>
      <p className="text-sm font-medium text-gray-600">{dayLabel}</p>

      {isWeekend || offDay ? (
        offDay ? (
          <DayOffBanner emoji="🎉" title={offDay.reason || 'School Off'} desc="No attendance recorded on a school off day / holiday." />
        ) : (
          <DayOffBanner emoji="🏖️" title="Weekend Off" desc="No attendance recorded on weekends." />
        )
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm text-gray-400">No attendance records for this section on this day.</p>
        </div>
      ) : (
        <>
          <StatCards stats={[
            { label: 'Total', value: s.total, accent: 'bg-gray-400' },
            { label: 'Present', value: s.present, accent: 'bg-emerald-500' },
            { label: 'Late', value: s.late, accent: 'bg-amber-500' },
            { label: 'Absent', value: s.absent, accent: 'bg-red-500' },
            { label: 'Leave', value: s.leave, accent: 'bg-blue-500' },
            ...(s.halfDay > 0 ? [{ label: 'Half Day', value: s.halfDay, accent: 'bg-cyan-500' }] : []),
          ]} />
          <SectionDailyTable rows={rows} onOverride={setOv} onDelete={handleDelete} />
        </>
      )}
      {ov && (
        <AttendanceOverrideModal
          studentId={ov.studentId}
          studentName={`${ov.student?.firstName ?? ''} ${ov.student?.lastName ?? ''}`.trim() || undefined}
          currentStatus={ov.status}
          recordId={ov.id}
          date={date}
          onClose={() => { setOv(null); load(); }}
        />
      )}
    </div>
  );
}
