'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { MonthlyAttendanceReport, ClassAttendanceGroup } from '@/types';
import { Card, EmptyState, SectionSkeleton } from '@/features/shared/components';
import StatCards from './StatCards';
import CalendarHeatmap from './CalendarHeatmap';
import MonthlyFilters from './MonthlyFilters';
import OffDaysModal from './OffDaysModal';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [showOff, setShowOff] = useState(false);

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
      <MonthlyFilters
        years={years} year={year} month={month} classes={classes} classFilter={classFilter}
        onYear={setYear} onMonth={setMonth} onClass={setClassFilter}
        offDaysCount={data?.offDays?.length ?? 0}
        onOpenOffDays={() => setShowOff(true)}
      />

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
          <CalendarHeatmap records={allRecords} year={year} month={month} weeklyOff={data?.weeklyOff} />

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

      {showOff && schoolId && (
        <OffDaysModal open={showOff} schoolId={schoolId} weeklyOff={data?.weeklyOff ?? [0, 6]}
          onClose={() => { setShowOff(false); load(); }} />
      )}
    </div>
  );
}

function ClassMonthGroup({ cls, slug }: { cls: ClassAttendanceGroup; slug?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <p className="text-sm font-bold text-gray-900">{cls.className}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {cls.sections.map((sec) => {
          const totalR = sec.summary.totalRecords;
          const pct = totalR > 0 ? Math.round(((sec.summary.present + sec.summary.late) / totalR) * 100) : 0;
          const detailPath = slug ? `/o/${slug}/branch/attendance/records/${sec.sectionId}` : `/branch/attendance/records/${sec.sectionId}`;
          return (
            <div key={sec.sectionId} className="flex items-center justify-between p-4 transition hover:bg-gray-50/50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{sec.sectionName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-400">{sec.summary.totalStudents} students</span>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{sec.summary.present}P</span>
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{sec.summary.late}L</span>
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">{sec.summary.absent}A</span>
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-extrabold text-gray-900">{pct}<span className="text-xs font-medium text-gray-400">%</span></p>
                </div>
                <Link href={detailPath}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-50 px-3 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100">
                  Details
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}