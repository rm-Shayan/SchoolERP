'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { AttendanceRecord, DailyAttendanceReport } from '@/types';
import { Card, EmptyState, Select } from '@/features/shared/components';
import StatCards from './StatCards';
import SectionDayCard from './SectionDayCard';
import DayOffBanner from './DayOffBanner';
import toast from 'react-hot-toast';

function getToday() { return new Date().toISOString().split('T')[0]; }

function shiftDate(d: string, days: number) {
  const dt = new Date(d); dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
}

interface SectionGroup { classId: string; className: string; sectionId: string; sectionName: string; records: AttendanceRecord[]; }

export default function DailyAttendanceView() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [date, setDate] = useState(getToday);
  const [data, setData] = useState<DailyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const groups = useMemo<SectionGroup[]>(() => {
    if (!data?.records) return [];
    const map = new Map<string, SectionGroup>();
    for (const rec of data.records) {
      const sid = rec.student?.sectionId ?? 'unknown';
      if (!map.has(sid)) map.set(sid, {
        classId: rec.student?.section?.classId ?? '', className: rec.student?.section?.class?.name ?? 'Unknown',
        sectionId: sid, sectionName: rec.student?.section?.name ?? '?', records: [],
      });
      map.get(sid)!.records.push(rec);
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName));
  }, [data]);

  const classNames = useMemo(() => [{ value: 'ALL', label: 'All Classes' },
    ...Array.from(new Set(groups.map((g) => g.className))).map((n) => ({ value: n, label: n }))], [groups]);

  const filtered = useMemo(() => classFilter === 'ALL' ? groups : groups.filter((g) => g.className === classFilter), [groups, classFilter]);

  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
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
        <div className="w-44">
          <Select label="Class" placeholder="All Classes" options={classNames} value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="!h-9 !text-xs" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600">{dayLabel}</p>

      {isWeekend || offDay ? (
        offDay ? (
          <DayOffBanner emoji="🎉" title={offDay.reason || 'School Off'} desc="No attendance recorded on a school off day / holiday." />
        ) : (
          <DayOffBanner emoji="🏖️" title="Weekend Off" desc="No attendance recorded on the school's weekly off days." />
        )
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No data" description="No attendance records for this day." /></Card>
      ) : (
        <>
          {data?.summary && (
            <StatCards stats={[
              { label: 'Marked', value: data.summary.totalMarked, accent: 'bg-gray-400' },
              { label: 'Present', value: data.summary.present, accent: 'bg-emerald-500' },
              { label: 'Late', value: data.summary.late, accent: 'bg-amber-500' },
              { label: 'Absent', value: data.summary.absent, accent: 'bg-red-500' },
              { label: 'Leave', value: data.summary.leave, accent: 'bg-blue-500' },
            ]} />
          )}
          {filtered.map((g) => (
            <SectionDayCard key={g.sectionId} className={g.className} sectionName={g.sectionName} sectionId={g.sectionId} date={date} records={g.records}
              isOpen={expanded === g.sectionId} onToggle={() => setExpanded(expanded === g.sectionId ? null : g.sectionId)} />
          ))}
        </>
      )}
    </div>
  );
}
