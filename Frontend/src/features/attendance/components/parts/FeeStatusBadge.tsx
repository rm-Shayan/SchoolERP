'use client';

import { useMemo } from 'react';
import type { FeeMonthStatus } from '@/lib/api/attendanceService';
import { cn } from '@/lib/utils';

interface Props {
  records: FeeMonthStatus[];
  term?: string | null;
  dark?: boolean;
}

const FEE_STATUS: Record<string, { label: string; dot: string; bg: string }> = {
  PAID:    { label: 'Paid',    dot: 'bg-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  PARTIAL: { label: 'Partial', dot: 'bg-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  UNPAID:  { label: 'Unpaid',  dot: 'bg-red-400',      bg: 'bg-red-500/10 border-red-500/20 text-red-400' },
  OVERDUE: { label: 'Overdue', dot: 'bg-rose-500',     bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
};

function formatMonth(month: string) {
  const [y, m] = month.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString('en-PK', { month: 'short' }) + ' ' + y.slice(2);
}

function formatRs(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
}

export default function FeeStatusBadge({ records, term, dark = true }: Props) {
  const sorted = useMemo(
    () => [...records].sort((a, b) => b.month.localeCompare(a.month)),
    [records],
  );

  if (!sorted.length) return null;

  const unpaid = sorted.filter((r) => r.status !== 'PAID').length;
  const totalPaid = sorted.reduce((s, r) => s + r.paidAmount, 0);
  const totalDue = sorted.reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-gray-500' : 'text-gray-400')}>
          Fee Status{term ? ` — ${term}` : ''}
        </span>
        {unpaid > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
            {unpaid} unpaid
          </span>
        )}
      </div>
      {/* Total paid / outstanding summary */}
      <div className={cn('flex items-center gap-3 mb-2 text-[11px] font-semibold', dark ? 'text-gray-400' : 'text-gray-500')}>
        <span className="text-emerald-400">Paid: {formatRs(totalPaid)}</span>
        {totalDue > 0 && <span className="text-red-400">Due: {formatRs(totalDue)}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((r) => {
          const cfg = FEE_STATUS[r.status] ?? FEE_STATUS.UNPAID;
          const balance = r.totalAmount - r.paidAmount;
          return (
            <div
              key={r.month}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium leading-none',
                cfg.bg,
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
              <span>{formatMonth(r.month)}</span>
              {r.status !== 'PAID' && balance > 0 && (
                <span className={cn('opacity-70', dark ? '' : '')}>
                  {formatRs(balance)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
