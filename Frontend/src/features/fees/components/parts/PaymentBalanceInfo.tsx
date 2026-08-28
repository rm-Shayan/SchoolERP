import { formatCurrency } from '@/lib/utils';

interface Props {
  totalAmount: number;
  paidAmount: number;
  due: number;
  enteredAmt: number;
  newPaidPct: number;
  remainingAfter: number;
}

export default function PaymentBalanceInfo({ totalAmount, paidAmount, due, enteredAmt, newPaidPct, remainingAfter }: Props) {
  const paidPct = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-100/50 p-5 space-y-4 bg-gradient-to-br from-primary-50/80 via-primary-50/50 to-primary-100/30 backdrop-blur-sm">
      {/* Decorative */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary-200/20 blur-xl" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-blue-200/15 blur-lg" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Amount Due</p>
          <p className="text-3xl font-extrabold text-primary-700 tabular-nums mt-1">{formatCurrency(due)}</p>
        </div>
        <div className="text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-white/60 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-gray-400">Total</span>
            <span className="text-xs font-bold text-gray-700">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50/60 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-emerald-500">Paid</span>
            <span className="text-xs font-bold text-emerald-700">{formatCurrency(paidAmount)}</span>
          </div>
        </div>
      </div>

      {/* Segmented progress */}
      <div className="relative space-y-2">
        <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
          <div className="h-full relative rounded-full overflow-hidden">
            {/* Paid portion */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${paidPct}%` }}
            />
            {/* Entering portion */}
            {enteredAmt > 0 && (
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500 ease-out opacity-60"
                style={{ left: `${paidPct}%`, width: `${Math.min(newPaidPct - paidPct, 100 - paidPct)}%` }}
              />
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400">
            <span className="text-emerald-500">{paidPct}%</span> paid
          </span>
          {enteredAmt > 0 && (
            <span className="text-[10px] font-bold text-primary-500">
              → {newPaidPct}% after
            </span>
          )}
        </div>
      </div>

      {enteredAmt > 0 && enteredAmt < due && (
        <div className="relative flex items-center gap-2.5 bg-amber-50/80 rounded-xl px-4 py-3 border border-amber-100/60">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-amber-700">
              <span className="font-bold">{formatCurrency(remainingAfter)}</span> will remain after payment
            </p>
            <p className="text-[10px] text-amber-500 mt-0.5">This is a partial payment — status will be PARTIAL</p>
          </div>
        </div>
      )}
    </div>
  );
}
