'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import { academicService } from '@/lib/api';
import type { AttendanceRecord, DailyAttendanceReport } from '@/types';
import { Card, EmptyState, Pagination } from '@/features/shared/components';
import StatCards from './StatCards';
import SectionDayCard from './SectionDayCard';
import DayOffBanner from './DayOffBanner';
import DailyViewToolbar from './DailyViewToolbar';
import { exportToCsv } from './attendanceExport';
import toast from 'react-hot-toast';

const CARDS_PER_PAGE = 5;

function getToday() { return new Date().toISOString().split('T')[0]; }

function shiftDate(d: string, days: number) {
  const dt = new Date(d); dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
}

interface ScaffoldSection { id: string; name: string; }
interface ScaffoldClass { id: string; name: string; sections: ScaffoldSection[]; }
interface SectionGroup { classId: string; className: string; sectionId: string; sectionName: string; records: AttendanceRecord[]; }

export default function DailyAttendanceView() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [date, setDate] = useState(getToday);
  const [data, setData] = useState<DailyAttendanceReport | null>(null);
  const [scaffold, setScaffold] = useState<ScaffoldClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!schoolId) { setScaffold([]); return; }
    academicService.getClassesBySchool(schoolId).then((cs) => {
      setScaffold(cs.map((c) => ({
        id: c.id, name: c.name,
        sections: (c.sections ?? []).map((s) => ({ id: s.id, name: s.name })),
      })));
    }).catch(() => setScaffold([]));
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    try { setData(await attendanceService.getDailyReport({ schoolId, date })); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [schoolId, date]);
  useEffect(() => { load(); }, [load]);

  const weeklyOff = data?.weeklyOff ?? [0, 6];
  const isWeekend = weeklyOff.includes(new Date(date).getDay());
  const offDay = (data?.offDays ?? []).find((o) => o.date === date);

  // Each section's node is pre-created (independent of records), then records are filled in.
  const groups = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>();
    for (const c of scaffold) {
      for (const s of c.sections) {
        if (!map.has(s.id)) map.set(s.id, {
          classId: c.id, className: c.name, sectionId: s.id, sectionName: s.name, records: [],
        });
      }
    }
    for (const rec of data?.records ?? []) {
      const sid = rec.student?.sectionId ?? rec.student?.section?.id ?? 'unassigned';
      if (!map.has(sid)) map.set(sid, {
        classId: rec.student?.section?.classId ?? '', className: rec.student?.section?.class?.name ?? 'Unassigned',
        sectionId: sid, sectionName: rec.student?.section?.name ?? '?', records: [],
      });
      map.get(sid)!.records.push(rec);
    }
    return Array.from(map.values())
      .filter((g) => g.sectionId !== 'unassigned' || g.records.length > 0)
      .sort((a, b) => a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName));
  }, [data, scaffold]);

  const classNames = useMemo(() => [{ value: 'ALL', label: 'All Classes' },
    ...Array.from(new Set(groups.map((g) => g.className))).map((n) => ({ value: n, label: n }))], [groups]);

  const statsBySection = useMemo(() => new Map((data?.sectionStats ?? []).map((s) => [s.sectionId, s])), [data]);

  const filtered = useMemo(() => classFilter === 'ALL' ? groups : groups.filter((g) => g.className === classFilter), [groups, classFilter]);

  // When filter/date changes, reset to page 1 (otherwise the user stays on an old page).
  useEffect(() => { setPage(1); }, [date, classFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  const handleExport = () => {
    if (!data?.records.length) { toast.error('No records to export'); return; }
    exportToCsv(data.records, `attendance-daily-${date}`);
  };

  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <DailyViewToolbar date={date} classFilter={classFilter} classOptions={classNames}
        onDate={setDate} onClass={setClassFilter}
        onPrev={() => setDate(shiftDate(date, -1))} onNext={() => setDate(shiftDate(date, 1))}
        onToday={() => setDate(getToday())} onExport={handleExport} />
      <p className="text-sm font-medium text-gray-600">{dayLabel}</p>

      {isWeekend || offDay ? (
        offDay ? (
          <DayOffBanner emoji="🎉" title={offDay.reason || 'School Off'} desc="No attendance recorded on a school off day / holiday." />
        ) : (
          <DayOffBanner emoji="🏖️" title="Weekend Off" desc="No attendance recorded on the school's weekly off days." />
        )
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No classes found" description="No classes or sections are set up for this school." /></Card>
      ) : (
        <>
          {data?.summary && (
            <StatCards stats={[
              { label: 'Marked', value: data.summary.totalMarked, accent: 'bg-gray-400' },
              { label: 'Present', value: data.summary.present, accent: 'bg-emerald-500' },
              { label: 'Late', value: data.summary.late, accent: 'bg-amber-500' },
              { label: 'Absent', value: data.summary.absent, accent: 'bg-red-500' },
              { label: 'Leave', value: data.summary.leave, accent: 'bg-primary-500' },
              ...(data.summary.halfDay > 0 ? [{ label: 'Half Day', value: data.summary.halfDay, accent: 'bg-cyan-500' }] : []),
            ]} />
          )}
          {pageItems.map((g) => (
            <SectionDayCard key={g.sectionId} className={g.className} sectionName={g.sectionName} sectionId={g.sectionId} date={date} records={g.records}
              totalStudents={statsBySection.get(g.sectionId)?.totalStudents}
              isOpen={expanded === g.sectionId} onToggle={() => setExpanded(expanded === g.sectionId ? null : g.sectionId)} />
          ))}
          {filtered.length > CARDS_PER_PAGE && (
            <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={CARDS_PER_PAGE}
              onPageChange={(p) => { setPage(p); setExpanded(null); }} />
          )}
        </>
      )}
    </div>
  );
}
