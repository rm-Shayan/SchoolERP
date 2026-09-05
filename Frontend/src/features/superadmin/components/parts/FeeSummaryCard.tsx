'use client';

import { memo } from 'react';
import { Card } from '@/features/shared/components';

interface FeeSummaryCardProps {
  fees: { totalDue: number; totalPaid: number; totalPending: number };
}

const fmt = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const FeeSummaryCard = memo(function FeeSummaryCard({ fees }: FeeSummaryCardProps) {
  const paidPercent = fees.totalDue > 0 ? Math.round((fees.totalPaid / fees.totalDue) * 100) : 0;

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Fee Collection</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(fees.totalDue)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Due</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{fmt(fees.totalPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Collected</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{fmt(fees.totalPending)}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Collection rate</span>
          <span className="font-semibold text-gray-700">{paidPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(paidPercent, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
});

export default FeeSummaryCard;
