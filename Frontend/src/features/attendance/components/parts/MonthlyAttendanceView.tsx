'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { MonthlyAttendanceReport, ClassAttendanceGroup } from '@/types';
import { Card, EmptyState, SectionSkeleton } from '@/features/shared/components';
import StatCards from './StatCards';
import CalendarHeatmap from './CalendarHeatmap';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MonthlyAttendanceView() {
  const { user, school, organization } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const slug = organization?.slug;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    try { setData(await attendanceService.getMonthlyReport({ schoolId, year, month })); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [schoolId, year, month]);
  useEffect(() => { load(); }, [load]);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - i), []);
  const classes = useMemo(() =>
    [{ value: 'ALL', label: 'All Classes' }, ...(data?.classes ?? []).map((c) => ({ value: c.classId, label: c.className }))]
  , [data]);
  const filtered = useMemo(() =>
    classFilter === 'ALL' ? (data?.classes ?? []) : data?.classes.filter((c) => c.classId === classFilter) ?? []
  , [data, classFilter]);

  const s = data?.summary;
  const allRecords = useMemo(() => {
    if (!data) return [];
    return data.classes.flatMap((c) => c.sections.flatMap((sec) => sec.records));
  }, [data]);

  return (
    <div className="space-y-5">
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
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="w-44">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Class</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 outline-none">
            {classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? <SectionSkeleton /> : !data ? (
        <Card><EmptyState title="No data" description="No attendance data for this month." /></Card>
      ) : (
        <>
          <StatCards stats={[
            { label: 'Working Days', value: s?.totalWorkingDays ?? 0, accent: 'bg-gray-400' },
            { label: 'Present', value: s?.present ?? 0, accent: 'bg-emerald-500' },
            { label: 'Late', value: s?.late ?? 0, accent: 'bg-amber-500' },
            { label: 'Absent', value: s?.absent ?? 0, accent: 'bg-red-500' },
            { label: 'Leave', value: s?.leave ?? 0, accent: 'bg-blue-500' },
          ]} />
          <CalendarHeatmap records={allRecords} year={year} month={month} />

          {filtered.length === 0 ? (
            <Card><EmptyState title="No classes found" description="No attendance data for this filter." /></Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((cls) => (
                <ClassMonthGroup key={cls.classId} cls={cls} slug={slug} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClassMonthGroup({ cls, slug }: { cls: ClassAttendanceGroup; slug?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">{cls.className}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {cls.sections.map((sec) => {
          const total = sec.summary.totalStudents * (sec.summary.totalRecords > 0 ? 1 : 0);
          const totalR = sec.summary.totalRecords;
          const pct = totalR > 0 ? Math.round(((sec.summary.present + sec.summary.late) / totalR) * 100) : 0;
          const detailPath = slug ? `/o/${slug}/branch/attendance/records/${sec.sectionId}` : `/branch/attendance/records/${sec.sectionId}`;
          return (
            <div key={sec.sectionId} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{sec.sectionName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] text-gray-400">{sec.summary.totalStudents} students</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">{sec.summary.present}P</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">{sec.summary.late}L</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold">{sec.summary.absent}A</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-lg font-extrabold text-gray-900">{pct}<span className="text-xs font-medium text-gray-400">%</span></p>
                </div>
                <Link href={detailPath}
                  className="h-8 px-3 rounded-lg bg-primary-50 text-primary-700 text-[11px] font-semibold hover:bg-primary-100 transition flex items-center gap-1">
                  Details
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
