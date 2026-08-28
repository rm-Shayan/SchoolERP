'use client';

import { getStatusColor } from '@/lib/utils';
import type { FeeRecord } from '@/types';

export function StatusDot({ status }: { status: string }) {
  const color = status === 'PAID' ? 'bg-emerald-500' : status === 'PARTIAL' ? 'bg-amber-500' : status === 'OVERDUE' ? 'bg-red-500' : 'bg-blue-500';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}

export function ProgressBar({ paid, status }: { paid: number; status: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          status === 'PAID' ? 'bg-emerald-500' : status === 'PARTIAL' ? 'bg-amber-400' : status === 'OVERDUE' ? 'bg-red-400' : 'bg-gray-300'
        }`} style={{ width: `${Math.max(paid, 2)}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400 tabular-nums">{paid}%</span>
    </div>
  );
}

export function MonthBadges({ records, max = 3 }: { records: FeeRecord[]; max?: number }) {
  const open = records.filter((r) => r.status !== 'PAID').sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  const hidden = open.length - max;
  const mLabel = (d: string) => new Date(d).toLocaleString('en-PK', { month: 'short', year: 'numeric' });
  return (
    <div className="flex flex-wrap gap-1.5">
      {open.slice(0, max).map((r) => {
        const bal = Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0));
        return (
          <span key={r.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(r.status)}`}>
            <StatusDot status={r.status} />
            <span>{mLabel(r.dueDate)}</span>
            <span className="opacity-70">{formatCurrencyLocal(bal)}</span>
          </span>
        );
      })}
      {hidden > 0 && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500">+{hidden} more</span>}
    </div>
  );
}

function formatCurrencyLocal(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);
}
