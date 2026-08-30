'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffAttendanceService } from '@/lib/api';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { PageHeader, Card, CardContent, EmptyState, ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import TodayStatusCard from './parts/TodayStatusCard';
import AttendanceStatCards from './parts/AttendanceStatCards';
import AttendanceCalendar from './parts/AttendanceCalendar';
import AttendanceLog from './parts/AttendanceLog';
import MonthComparison from './parts/MonthComparison';
import WeeklyBarChart from './parts/WeeklyBarChart';
import DayDetailModal from './parts/DayDetailModal';
import YearHeatmap from './parts/YearHeatmap';
import { openAttendanceReport, downloadAttendanceCSV } from './parts/AttendanceReport';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MyStaffAttendancePage() {
  const { user } = useAppSelector((s) => s.auth);
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [prevSummary, setPrevSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      // Last month range
      let pm = month - 1;
      let py = year;
      if (pm < 1) { pm = 12; py--; }
      const prevStart = `${py}-${String(pm).padStart(2, '0')}-01`;
      const prevLast = new Date(py, pm, 0).getDate();
      const prevEnd = `${py}-${String(pm).padStart(2, '0')}-${prevLast}`;

      const [curRes, prevRes] = await Promise.all([
        staffAttendanceService.getMyAttendance({ startDate, endDate }),
        staffAttendanceService.getMyAttendance({ startDate: prevStart, endDate: prevEnd }),
      ]);
      setRecords(curRes.data.data.records);
      setSummary(curRes.data.data.summary);
      setPrevSummary(prevRes.data.data.summary);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['staff Attendance Marked', 'staff attendance_marked'], load);

  const recordByDate = useMemo(() => {
    const map: Record<string, StaffAttendanceRecord> = {};
    records.forEach((r) => { map[r.date?.slice(0, 10)] = r; });
    return map;
  }, [records]);

  const todayRecord = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return recordByDate[todayStr] ?? null;
  }, [recordByDate, now]);

  const workingDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow !== 0) count++; // exclude Sundays
    }
    return count;
  }, [year, month]);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" description="Track your daily attendance and monthly summary." />

      {/* Today's status */}
      <TodayStatusCard todayRecord={todayRecord} recordByDate={recordByDate} now={now} />

      {/* Month nav + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">&larr;</button>
          <span className="font-semibold text-gray-900 min-w-[120px] text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">&rarr;</button>
          {!loading && records.length > 0 && <button onClick={() => openAttendanceReport({ staffName: user?.name ?? 'Staff', month, year, records, summary, workingDays })} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Print Report">🖨️</button>}
          {!loading && records.length > 0 && <button onClick={() => downloadAttendanceCSV({ staffName: user?.name ?? 'Staff', month, year, records, summary, workingDays })} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Download CSV">⬇️</button>}
        </div>
        {!loading && <AttendanceStatCards summary={summary} totalWorkingDays={workingDays} />}
      </div>

      {!loading && Object.keys(prevSummary).length > 0 && <MonthComparison current={summary} previous={prevSummary} currentLabel={`${MONTHS[month - 1]} ${year}`} previousLabel={`${MONTHS[month === 1 ? 11 : month - 2]} ${month === 1 ? year - 1 : year}`} />}

      {/* Calendar */}
      {loading ? (
        <Card><CardContent><ListSkeleton count={4} /></CardContent></Card>
      ) : records.length === 0 ? (
        <Card><CardContent className="py-12"><EmptyState title="No records" description="No attendance recorded for this month." /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <AttendanceCalendar year={year} month={month} today={now} recordByDate={recordByDate} onDayClick={setSelectedDay} />
          </CardContent>
        </Card>
      )}

      <button onClick={() => setShowHeatmap((v) => !v)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
        {showHeatmap ? '▲ Hide' : '▼ Show'} Full Year Heatmap
      </button>
      {showHeatmap && <YearHeatmap year={year} />}
      {!loading && records.length > 0 && (
        <WeeklyBarChart year={year} month={month} records={records} />
      )}

      {selectedDay && <DayDetailModal dateStr={selectedDay} record={recordByDate[selectedDay] ?? null} onClose={() => setSelectedDay(null)} />}

      {records.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance Log</h3>
            <AttendanceLog records={records} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
