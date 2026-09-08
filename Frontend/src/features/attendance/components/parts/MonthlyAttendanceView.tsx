'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { MonthlyAttendanceReport } from '@/types';
import { Card, EmptyState, SectionSkeleton } from '@/features/shared/components';
import StatCards from './StatCards';
import CalendarHeatmap from './CalendarHeatmap';
import MonthlyExportBar from './MonthlyExportBar';
import MonthlyFilters from './MonthlyFilters';
import OffDaysModal from './OffDaysModal';
import ClassMonthGroup from './ClassMonthGroup';
import { exportSchoolMonthlyCsv } from './attendanceReportCsv';
import toast from 'react-hot-toast';

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

  const handleExport = () => {
    if (!data || !schoolId) { toast.error('No data to export'); return; }
    exportSchoolMonthlyCsv({
      classes: filtered.length ? filtered : data.classes,
      offDays: data.offDays ?? [],
      weeklyOff: data.weeklyOff ?? [0, 6],
      year, month,
      filename: classFilter === 'ALL' ? `monthly-attendance-${year}-${String(month).padStart(2, '0')}` : `monthly-${classFilter.replace(/\s+/g, '-')}-${year}-${String(month).padStart(2, '0')}`,
    });
  };

  return (
    <div className="space-y-5">
      <MonthlyFilters
        years={years} year={year} month={month} classes={classes} classFilter={classFilter}
        onYear={setYear} onMonth={setMonth} onClass={setClassFilter}
        offDaysCount={data?.offDays?.length ?? 0}
        onOpenOffDays={() => setShowOff(true)}
      />

      <MonthlyExportBar disabled={loading || !data} onExport={handleExport} />

      {loading ? <SectionSkeleton /> : !data ? (
        <Card><EmptyState title="No data" description="No attendance data for this month." /></Card>
      ) : (
        <>
          <StatCards stats={[
            { label: 'Working Days', value: s?.totalWorkingDays ?? 0, accent: 'bg-gray-400' },
            { label: 'Present', value: s?.present ?? 0, accent: 'bg-emerald-500' },
            { label: 'Late', value: s?.late ?? 0, accent: 'bg-amber-500' },
            { label: 'Absent', value: s?.absent ?? 0, accent: 'bg-red-500' },
            { label: 'Leave', value: s?.leave ?? 0, accent: 'bg-primary-500' },
            ...((s?.halfDay ?? 0) > 0 ? [{ label: 'Half Day', value: s?.halfDay ?? 0, accent: 'bg-primary-500' }] : []),
          ]} />
          <CalendarHeatmap records={allRecords} year={year} month={month} weeklyOff={data?.weeklyOff} />

          {filtered.length === 0 ? (
            <Card><EmptyState title="No classes found" description="No attendance data for this filter." /></Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((cls) => (
                <ClassMonthGroup key={cls.classId} cls={cls} slug={slug}
                  offDays={data?.offDays ?? []} weeklyOff={data?.weeklyOff ?? [0, 6]} year={year} month={month} />
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
