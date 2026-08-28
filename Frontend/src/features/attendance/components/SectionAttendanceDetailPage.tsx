'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useParams } from 'next/navigation';
import { attendanceService } from '@/lib/api/attendanceService';
import type { MonthlyAttendanceReport } from '@/types';
import { TableSkeleton } from '@/features/shared/components';
import StudentAttendanceTable from './parts/StudentAttendanceTable';
import AttendanceOverrideModal from './parts/AttendanceOverrideModal';
import SectionDetailDaily from './parts/SectionDetailDaily';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SectionAttendanceDetailPage() {
  const params = useParams();
  const sectionId = params?.sectionId as string;
  const { school, organization, user } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const slug = organization?.slug;

  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [ov, setOv] = useState<{ studentId: string; date: string } | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    try { setData(await attendanceService.getMonthlyReport({ schoolId, year, month })); }
    catch {} finally { setLoading(false); }
  }, [schoolId, year, month]);
  useEffect(() => { if (mode === 'monthly') load(); }, [load, mode]);

  const section = useMemo(() => {
    if (!data || !sectionId) return null;
    for (const cls of data.classes) {
      const found = cls.sections.find((s) => s.sectionId === sectionId);
      if (found) return found;
    }
    return null;
  }, [data, sectionId]);

  const records = section?.records ?? [];
  const stats = useMemo(() => {
    const t = records.length;
    const p = records.filter((r) => r.status === 'PRESENT').length;
    const l = records.filter((r) => r.status === 'LATE').length;
    const a = records.filter((r) => r.status === 'ABSENT').length;
    const lv = records.filter((r) => r.status === 'LEAVE').length;
    return { present: p, late: l, absent: a, leave: lv, pct: t > 0 ? Math.round(((p + l) / t) * 100) : 0 };
  }, [records]);

  const backPath = slug ? `/o/${slug}/branch/attendance/records` : '/branch/attendance/records';
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try { await attendanceService.deleteRecord(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const sectionName = section?.sectionName ?? '';
  const className = section?.className ?? '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href={backPath} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 mb-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Records
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{className && sectionName ? `${className} — ${sectionName}` : 'Section Attendance'}</h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { key: 'daily' as const, label: '📅 Daily' },
          { key: 'monthly' as const, label: '📊 Monthly' },
        ]).map((t) => (
          <button key={t.key} onClick={() => setMode(t.key)}
            className={cn('px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              mode === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Daily View */}
      {mode === 'daily' && sectionId && (
        <SectionDetailDaily sectionId={sectionId} sectionName={sectionName} className={className} />
      )}

      {/* Monthly View */}
      {mode === 'monthly' && (
        <>
          <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-end gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Month</label>
                <select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 outline-none">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Year</label>
                <select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}
                  className="h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 outline-none">
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50/50">
            {[
              { k: 'present', l: 'Present', c: 'text-emerald-600' },
              { k: 'late', l: 'Late', c: 'text-amber-600' },
              { k: 'absent', l: 'Absent', c: 'text-red-500' },
              { k: 'leave', l: 'Leave', c: 'text-blue-600' },
            ].map((item) => (
              <div key={item.k} className="flex items-center gap-1.5">
                <span className={cn('text-lg font-extrabold tabular-nums', item.c)}>{stats[item.k as keyof typeof stats] as number}</span>
                <span className="text-[10px] font-medium text-gray-400">{item.l}</span>
              </div>
            ))}
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tabular-nums text-primary-700">{stats.pct}%</span>
              <span className="text-[10px] font-medium text-gray-400">Rate</span>
            </div>
          </div>
          {loading ? <TableSkeleton rows={8} cols={5} /> : (
            <StudentAttendanceTable records={records} onOverride={(sid, dt) => setOv({ studentId: sid, date: dt })} onDelete={handleDelete} />
          )}
        </>
      )}

      {ov && schoolId && (
        <AttendanceOverrideModal studentId={ov.studentId} date={ov.date} schoolId={schoolId}
          onClose={() => { setOv(null); if (mode === 'monthly') load(); }} />
      )}
    </div>
  );
}
