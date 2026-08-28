'use client';

import { formatCurrency } from '@/lib/utils';
import type { MonthOption } from './PaymentMonthsSelector';

interface Props {
  months: MonthOption[];
  amounts: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export default function PaymentAllocationEditor({ months, amounts, onChange }: Props) {
  if (!months.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold text-slate-800">Payment breakdown</p>
        <p className="text-[11px] text-slate-500">Enter a full or partial amount for every selected month.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {months.map((month) => {
          const value = Number(amounts[month.id]) || 0;
          const partial = value > 0 && value < month.amount;
          return (
            <div key={month.id} className="grid grid-cols-[1fr_130px] items-center gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{month.label}</p>
                <p className={`text-[10px] font-semibold ${partial ? 'text-amber-600' : 'text-slate-400'}`}>
                  {partial ? `${formatCurrency(month.amount - value)} will remain` : `Due ${formatCurrency(month.amount)}`}
                </p>
              </div>
              <input type="number" min="0" max={month.amount} step="0.01" value={amounts[month.id] ?? ''}
                onChange={(e) => onChange(month.id, e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-right text-sm font-bold text-slate-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
