'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { MonthlyAttendanceReport } from '@/types';
import { TableSkeleton } from '@/features/shared/components';
import AttendanceOverrideModal from './AttendanceOverrideModal';
import MonthlyMatrixTable from './MonthlyMatrixTable';
import SectionMonthExportBar from './SectionMonthExportBar';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  sectionId: string;
}

export default function SectionMonthPanel({ sectionId }: Props) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [ov, setOv] = useState<{ studentId: string; date: string } | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    try { setData(await attendanceService.getMonthlyReport({ schoolId, year, month })); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [schoolId, year, month]);
  useEffect(() => { load(); }, [load]);

  const section = useMemo(() => {
    if (!data) return null;
    for (const cls of data.classes) {
      const found = cls.sections.find((s) => s.sectionId === sectionId);
      if (found) return found;
    }
    return null;
  }, [data, sectionId]);

  const students = section?.students ?? [];
  const records = section?.records ?? [];
  const stats = useMemo(() => {
    const p = records.filter((r) => r.status === 'PRESENT').length;
    const l = records.filter((r) => r.status === 'LATE').length;
    const a = records.filter((r) => r.status === 'ABSENT').length;
    const lv = records.filter((r) => r.status === 'LEAVE').length;
    const hd = records.filter((r) => r.status === 'HALF_DAY').length;
    const t = records.length;
    return { present: p, late: l, absent: a, leave: lv, halfDay: hd, pct: t > 0 ? Math.round(((p + l) / t) * 100) : 0 };
  }, [records]);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Month</label>
          <select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Year</label>
          <select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
        {[
          { k: 'present', l: 'Present', c: 'text-emerald-600' },
          { k: 'late', l: 'Late', c: 'text-amber-600' },
          { k: 'absent', l: 'Absent', c: 'text-red-500' },
          { k: 'leave', l: 'Leave', c: 'text-blue-600' },
          { k: 'halfDay', l: 'Half', c: 'text-cyan-600' },
        ].map((it) => (
          <div key={it.k} className="flex items-center gap-1.5">
            <span className={cn('text-lg font-extrabold tabular-nums', it.c)}>{stats[it.k as keyof typeof stats] as number}</span>
            <span className="text-[10px] font-medium text-gray-400">{it.l}</span>
          </div>
        ))}
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold tabular-nums text-primary-700">{stats.pct}%</span>
          <span className="text-[10px] font-medium text-gray-400">Rate</span>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <span className="flex items-center text-[11px] font-semibold text-gray-500">{students.length} students</span>
        <div className="ml-auto">
          <SectionMonthExportBar
            sectionLabel={`${section?.className ?? 'Class'} ${section?.sectionName ?? ''}`.trim()}
            students={students}
            records={records}
            offDays={data?.offDays ?? []}
            weeklyOff={data?.weeklyOff ?? [0, 6]}
            year={year}
            month={month}
          />
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} cols={5} /> : (
        <MonthlyMatrixTable students={students} records={records} offDays={data?.offDays ?? []} weeklyOff={data?.weeklyOff ?? [0, 6]} year={year} month={month}
          onOverride={(sid, dt) => setOv({ studentId: sid, date: dt })} />
      )}

      {ov && schoolId && (
        <AttendanceOverrideModal studentId={ov.studentId} date={ov.date} schoolId={schoolId}
          onClose={() => { setOv(null); load(); }} />
      )}
    </div>
  );
}