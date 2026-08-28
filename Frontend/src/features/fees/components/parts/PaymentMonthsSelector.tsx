'use client';

import { formatCurrency } from '@/lib/utils';

export interface MonthOption {
  id: string;
  year: number;
  month: number;
  label: string;
  amount: number;
  status?: string;
}

interface PaymentMonthsSelectorProps {
  periods: MonthOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}

export default function PaymentMonthsSelector({ periods, selected, onToggle }: PaymentMonthsSelectorProps) {
  if (!periods.length) return null;
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay Specific Months</p>
      <div className="space-y-2">
        {periods.map((p) => {
          const key = p.id;
          const paid = p.status === 'PAID';
          const isSel = selected.has(key);
          return (
            <button type="button" key={key} disabled={paid} onClick={() => onToggle(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                paid ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : isSel ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-primary-50/50'}`}>
              <span className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${isSel ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                  {isSel && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {p.label}
              </span>
              <span className="font-semibold">{paid ? 'PAID' : formatCurrency(p.amount)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
