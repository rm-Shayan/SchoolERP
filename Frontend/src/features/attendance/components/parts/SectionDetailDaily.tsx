'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { DailyAttendanceReport } from '@/types';
import StatCards from './StatCards';
import AttendanceOverrideModal from './AttendanceOverrideModal';
import DayOffBanner from './DayOffBanner';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function getToday() { return new Date().toISOString().split('T')[0]; }
function shiftDate(d: string, n: number) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; }

const ST: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  LEAVE: { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500' },
  HALF_DAY: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
};

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
  const [ov, setOv] = useState<{ studentId: string; date: string } | null>(null);

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
        <button onClick={() => setDate(shiftDate(date, -1))} className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
        <button onClick={() => setDate(shiftDate(date, 1))} className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <button onClick={() => setDate(getToday())} className="h-9 px-3 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100">Today</button>
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
            { label: 'Leave', value: s.leave, accent: 'bg-primary-500' },
            ...(s.halfDay > 0 ? [{ label: 'Half Day', value: s.halfDay, accent: 'bg-primary-500' }] : []),
          ]} />
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Student</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Check In</th>
                <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Action</th>
              </tr></thead>
              <tbody>{rows.map((r) => {
                const st = ST[r.status] ?? ST.PRESENT;
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900 text-xs">{r.student?.firstName} {r.student?.lastName}</p>
                      <p className="text-[10px] text-gray-400">#{r.student?.rollNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', st.bg, st.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setOv({ studentId: r.studentId, date: r.date.slice(0, 10) })} className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">Override</button>
                        <button onClick={() => handleDelete(r.id)} className="text-[11px] font-semibold text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </>
      )}
      {ov && schoolId && <AttendanceOverrideModal studentId={ov.studentId} date={ov.date} schoolId={schoolId} onClose={() => { setOv(null); load(); }} />}
    </div>
  );
}
