'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalAttendanceYearSummary } from '@/types/portal';

interface Props {
  childId?: string;
}

const statusCols: { key: keyof Pick<PortalAttendanceYearSummary, 'daysPresent' | 'daysLate' | 'daysAbsent' | 'daysLeave' | 'daysManual'>; label: string; cls: string }[] = [
  { key: 'daysPresent', label: 'Present', cls: 'text-emerald-600' },
  { key: 'daysLate', label: 'Late', cls: 'text-amber-600' },
  { key: 'daysAbsent', label: 'Absent', cls: 'text-rose-600' },
  { key: 'daysLeave', label: 'Leave', cls: 'text-sky-600' },
  { key: 'daysManual', label: 'Manual', cls: 'text-primary-600' },
];

export default function AttendanceYearSummary({ childId }: Props) {
  const [items, setItems] = useState<PortalAttendanceYearSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Parent portal child switcher ke saath localStorage activeChildId change
  // hota hai — fetch wahi re-trigger kare (tarah portalDataService interceptor
  // ?studentId= bhejta hai jo backend me scoping karta hai). Student portal me
  // activeChildId nahi hota, to bas single render hi kaafi hai.
  const key = typeof window !== 'undefined' ? localStorage.getItem('activeChildId') ?? '' : childId ?? '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalDataService
      .getAttendanceYearlySummaries()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return (
    <Card>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Yearly Attendance History</h3>
          <span className="text-xs text-gray-400">Annual summaries of previous years</span>
        </div>
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">Loading yearly history...</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No yearly history yet — summaries appear once a year is archived.</p>
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
                {items.map((s) => (
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
    </Card>
  );
}