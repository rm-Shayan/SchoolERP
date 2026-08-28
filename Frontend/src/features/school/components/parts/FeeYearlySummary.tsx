'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/features/shared/components';
import { feeService } from '@/lib/api';
import type { FeeYearSummary } from '@/types';

interface Props {
  studentId: string | null;
}

const fmtRs = (n: number) =>
  `Rs. ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeeYearlySummary({ studentId }: Props) {
  const [summaries, setSummaries] = useState<FeeYearSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setSummaries([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setForbidden(false);
    feeService
      .getYearlySummaries(studentId)
      .then((data) => {
        if (!cancelled) setSummaries(data);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setSummaries([]);
        if (err?.response?.status === 403) setForbidden(true);
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
        <h3 className="text-sm font-bold text-gray-800">Yearly Fee Summary</h3>
        <span className="text-xs text-gray-400">For finance staff</span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Loading yearly fee summary...</div>
      ) : forbidden ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Only finance staff (Admin) can view the fee summary.
        </p>
      ) : summaries.length === 0 ? (
        <EmptyState
          title="No fee records yet"
          description="Once fee records are created, the yearly charged / paid summary will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-semibold">Year</th>
                <th className="py-2 pr-3 text-right font-semibold">Records</th>
                <th className="py-2 pr-3 text-right font-semibold">Total Charged</th>
                <th className="py-2 pr-3 text-right font-semibold">Paid</th>
                <th className="py-2 pr-3 text-right font-semibold">Outstanding</th>
                <th className="py-2 text-right font-semibold">Paid / Partial / Unpaid</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.yearLabel} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-3 font-bold text-gray-800">{s.yearLabel}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-600">{s.recordCount}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-gray-800">{fmtRs(s.totalCharged)}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-emerald-600">{fmtRs(s.totalPaid)}</td>
                  <td className={`py-2.5 pr-3 text-right font-bold ${s.outstanding > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                    {fmtRs(s.outstanding)}
                  </td>
                  <td className="py-2.5 text-right text-xs text-gray-500">
                    <span className="font-semibold text-emerald-600">{s.paidRecords}</span>
                    {' / '}
                    <span className="font-semibold text-amber-600">{s.partialRecords}</span>
                    {' / '}
                    <span className="font-semibold text-rose-600">{s.unpaidRecords}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
