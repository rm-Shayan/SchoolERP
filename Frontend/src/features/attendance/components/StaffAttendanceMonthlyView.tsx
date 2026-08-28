'use client';

import { useCallback, useEffect, useState } from 'react';
import { staffAttendanceService } from '@/lib/api';
import type { StaffMonthlyReport } from '@/lib/api/staffAttendanceService';
import { Card, EmptyState } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const DAY_COLORS: Record<number, string> = {
  0: 'bg-red-50 text-red-600',
  1: 'bg-emerald-50 text-emerald-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-blue-50 text-blue-600',
  4: 'bg-gray-50 text-gray-500',
};

const DAY_LABELS: Record<number, string> = { 0: '—', 1: 'P', 2: 'L', 3: 'A', 4: 'Lv' };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function StaffAttendanceMonthlyView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<StaffMonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffAttendanceService.getMonthlyReport(year, month);
      setReport(res.data.data);
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const daysInMonth = getDaysInMonth(year, month);
  const monthLabel = new Date(year, month - 1).toLocaleString('en-PK', { month: 'long', year: 'numeric' });

  const statusMap: Record<string, number> = { PRESENT: 1, LATE: 2, ABSENT: 3, LEAVE: 4 };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary-500 outline-none">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-PK', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary-500 outline-none">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2 ml-auto text-[10px] font-medium">
          {Object.entries(DAY_LABELS).map(([k, v]) => (
            <span key={k} className={cn('px-2 py-1 rounded-md', DAY_COLORS[Number(k)])}>{v}</span>
          ))}
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900">{monthLabel}</h3>

      {loading ? (
        <Card><div className="p-8"><div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div></div></Card>
      ) : !report?.records?.length ? (
        <Card><EmptyState title="No records" description="No staff attendance data for this month." /></Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase sticky left-0 bg-gray-50/80 z-10 min-w-[140px]">Staff</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i} className="text-center py-3 px-1 text-[9px] font-bold text-gray-400 w-7">{i + 1}</th>
                ))}
                <th className="text-center py-3 px-2 text-[10px] font-bold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.records.map((r) => {
                const totalDays = Object.values(r.days).reduce((a, b) => a + b, 0);
                return (
                  <tr key={r.staff.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10">
                      <p className="font-semibold text-gray-900">{r.staff.name}</p>
                      <p className="text-[9px] text-gray-400">{r.staff.role}</p>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      let val = 0;
                      if (r.days.PRESENT && day <= r.days.PRESENT + (r.days.LATE || 0) + (r.days.ABSENT || 0) + (r.days.LEAVE || 0)) {
                        const dayStatuses: string[] = [];
                        for (const [st, count] of Object.entries(r.days)) { for (let j = 0; j < (count as number); j++) dayStatuses.push(st); }
                        val = statusMap[dayStatuses[i]] ?? 0;
                      }
                      const dayNum = new Date(year, month - 1, day).getDay();
                      const isWeekend = dayNum === 0;
                      return (
                        <td key={i} className="text-center py-2.5 px-1">
                          <span className={cn('inline-flex w-6 h-6 items-center justify-center rounded-md text-[9px] font-bold',
                            val ? DAY_COLORS[val] : isWeekend ? 'bg-gray-50 text-gray-300' : 'text-gray-300')}>
                            {val ? DAY_LABELS[val] : isWeekend ? '—' : ''}
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-center py-2.5 px-2 font-bold text-gray-700">{totalDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
