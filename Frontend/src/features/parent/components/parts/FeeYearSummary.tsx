'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalFeeYearSummary } from '@/types/portal';

interface Props {
  childId?: string;
}

const fmtRs = (n: string | number) =>
  `Rs. ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FeeYearSummary({ childId }: Props) {
  const [items, setItems] = useState<PortalFeeYearSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Parent portal child switcher ke saath localStorage activeChildId change
  // hota hai — fetch wahi re-trigger kare (portalDataService interceptor
  // ?studentId= bhejta hai jo backend me scoping karta hai). Student portal me
  // activeChildId nahi hota, to bas single render hi kaafi hai.
  const key = typeof window !== 'undefined' ? localStorage.getItem('activeChildId') ?? '' : childId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalDataService
      .getFeeYearlySummaries()
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
          <h3 className="font-semibold text-gray-900 text-sm">Yearly Fee Summary</h3>
          <span className="text-xs text-gray-400">Archived paid records by year</span>
        </div>
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">Loading yearly fee summary...</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No yearly fee history yet — paid fee records appear here once a year is archived.</p>
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
                {items.map((s) => {
                  const outstanding = Number(s.totalCharged) - Number(s.totalPaid);
                  return (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-3 font-bold text-gray-800">{s.yearLabel}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-600">{s.recordCount}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-gray-800">{fmtRs(s.totalCharged)}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-emerald-600">{fmtRs(s.totalPaid)}</td>
                      <td className={`py-2.5 pr-3 text-right font-bold ${outstanding > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                        {fmtRs(outstanding)}
                      </td>
                      <td className="py-2.5 text-right text-xs text-gray-500">
                        <span className="font-semibold text-emerald-600">{s.paidRecords}</span>
                        {' / '}
                        <span className="font-semibold text-amber-600">{s.partialRecords}</span>
                        {' / '}
                        <span className="font-semibold text-rose-600">{s.unpaidRecords}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}