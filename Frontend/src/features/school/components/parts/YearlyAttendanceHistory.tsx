'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/features/shared/components';
import { attendanceService } from '@/lib/api';
import type { AttendanceYearSummary } from '@/types';

interface Props {
  studentId: string | null;
}

const statusCols: { key: keyof Pick<AttendanceYearSummary, 'daysPresent' | 'daysLate' | 'daysAbsent' | 'daysLeave' | 'daysManual'>; label: string; cls: string }[] = [
  { key: 'daysPresent', label: 'Present', cls: 'text-emerald-600' },
  { key: 'daysLate', label: 'Late', cls: 'text-amber-600' },
  { key: 'daysAbsent', label: 'Absent', cls: 'text-rose-600' },
  { key: 'daysLeave', label: 'Leave', cls: 'text-sky-600' },
  { key: 'daysManual', label: 'Manual', cls: 'text-violet-600' },
];

export default function YearlyAttendanceHistory({ studentId }: Props) {
  const [summaries, setSummaries] = useState<AttendanceYearSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setSummaries([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    attendanceService
      .getYearlySummaries(studentId)
      .then((data) => {
        if (!cancelled) setSummaries(data);
      })
      .catch(() => {
        if (!cancelled) setSummaries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Yearly Attendance History</h3>
        <span className="text-xs text-gray-400">Attendance older than 365 days is archived here</span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Loading yearly history...</div>
      ) : summaries.length === 0 ? (
        <EmptyState
          title="No yearly records yet"
          description="Once attendance is older than 365 days, the yearly summary will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-semibold">Year</th>
                <th className="py-2 pr-3 font-semibold">Range</th>
                {statusCols.map((c) => (
                  <th key={c.key} className="py-2 pr-3 text-right font-semibold">{c.label}</th>
                ))}
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-3 font-bold text-gray-800">{s.yearLabel}</td>
                  <td className="py-2.5 pr-3 text-xs text-gray-500">
                    {s.dateFrom.slice(0, 10)} → {s.dateTo.slice(0, 10)}
                  </td>
                  {statusCols.map((c) => (
                    <td key={c.key} className={`py-2.5 pr-3 text-right font-semibold ${c.cls}`}>
                      {s[c.key]}
                    </td>
                  ))}
                  <td className="py-2.5 text-right font-bold text-gray-800">{s.totalDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
