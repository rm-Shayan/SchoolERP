import type { Student, FeeRecord } from '@/types';
import { Card } from '@/features/shared/components';
import { formatCurrency, getStatusColor } from '@/lib/utils';

interface Props {
  student: Student;
  records: FeeRecord[];
  isSelected: boolean;
  onSelect: () => void;
  onPay: (r: FeeRecord) => void;
}

export default function StudentFeeCard({ student: s, records: recs, isSelected, onSelect, onPay }: Props) {
  const unpaid = recs.filter((r) => r.status !== 'PAID');
  const partial = recs.filter((r) => r.status === 'PARTIAL');
  const totalDue = unpaid.reduce((sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0);
  const totalPaid = recs.reduce((sum, r) => sum + Number(r.paidAmount), 0);
  const totalCharged = recs.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const overallPct = totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0;

  return (
    <Card
      onClick={onSelect}
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
        isSelected
          ? 'ring-2 ring-primary-500 border-primary-300 shadow-xl shadow-primary-100/50 -translate-y-1'
          : 'hover:shadow-lg hover:-translate-y-0.5 border border-gray-200/60'
      }`}
    >
      {/* Top gradient accent */}
      <div className={`h-1 w-full ${isSelected ? 'bg-gradient-to-r from-primary-400 to-primary-600' : 'bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300'}`} />

      <div className="p-5 space-y-3">
        {/* Student header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary-200/50 group-hover:scale-105 transition-transform duration-200">
              {s.firstName.charAt(0)}{s.lastName.charAt(0)}
            </div>
            {totalDue > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate">{s.firstName} {s.lastName}</p>
            <p className="text-[11px] text-gray-400 font-medium">Roll #{s.rollNumber}</p>
          </div>
          {totalDue > 0 && (
            <div className="text-right">
              <p className="text-lg font-extrabold text-amber-600 tabular-nums">{formatCurrency(totalDue)}</p>
              <p className="text-[10px] text-gray-400">due</p>
            </div>
          )}
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {unpaid.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {unpaid.length} unpaid
            </span>
          )}
          {partial.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold border border-orange-100">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {partial.length} partial
            </span>
          )}
          {recs.length > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">{recs.length} voucher{recs.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Overall progress */}
        {recs.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${overallPct === 100 ? 'bg-emerald-400' : 'bg-primary-400'}`} style={{ width: `${Math.max(overallPct, 2)}%` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 tabular-nums">{overallPct}%</span>
          </div>
        )}

        {/* Expanded voucher list */}
        {isSelected && (
          <div className="mt-1 pt-3 border-t border-gray-100 space-y-2">
            {recs.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No vouchers found.</p>}
            {recs.map((r) => {
              const bal = Number(r.totalAmount) - Number(r.paidAmount);
              const pct = Number(r.totalAmount) > 0 ? Math.round((Number(r.paidAmount) / Number(r.totalAmount)) * 100) : 0;
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50/80 border border-gray-100/60 hover:bg-gray-50 transition-colors group/item">
                  <div className="space-y-1.5">
                    <p className="text-gray-700 font-semibold text-xs">{fmtDate(r.dueDate)}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(r.status)}`}>
                      <span className={`w-1 h-1 rounded-full ${r.status === 'PAID' ? 'bg-emerald-500' : r.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-xs">{formatCurrency(bal)}</p>
                      {Number(r.paidAmount) > 0 && <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(Number(r.paidAmount))} paid</p>}
                    </div>
                    {r.status !== 'PAID' && (
                      <button onClick={(ev) => { ev.stopPropagation(); onPay(r); }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 hover:border-primary-300 transition-all duration-150 opacity-80 group-hover/item:opacity-100">
                        {r.status === 'PARTIAL' ? 'Pay More' : 'Collect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}
