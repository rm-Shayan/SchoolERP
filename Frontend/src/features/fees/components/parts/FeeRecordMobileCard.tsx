import { useState } from 'react';
import { Button } from '@/features/shared/components';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { feeService } from '@/lib/api';
import type { FeeRecord } from '@/types';
import toast from 'react-hot-toast';
import VoucherViewModal from './VoucherViewModal';

interface Props {
  record: FeeRecord;
  onCollect: (r: FeeRecord) => void;
  onExtend: (r: FeeRecord) => void;
  onRemind: (r: FeeRecord) => void;
}

export default function FeeRecordMobileCard({ record: r, onCollect, onExtend, onRemind }: Props) {
  const paid = Number(r.totalAmount) > 0 ? Math.round((Number(r.paidAmount) / Number(r.totalAmount)) * 100) : 0;
  const balance = Math.max(0, Number(r.totalAmount) - Number(r.paidAmount));
  const [view, setView] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {r.student ? `${r.student.firstName.charAt(0)}${r.student.lastName.charAt(0)}` : '?'}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{r.student ? `${r.student.firstName} ${r.student.lastName}` : '—'}</p>
            <p className="text-[11px] text-gray-400 font-medium">{r.student?.section ? `${r.student.section.class?.name ?? ''} ${r.student.section.name}`.trim() : ''}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(r.status)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'PAID' ? 'bg-emerald-500' : r.status === 'PARTIAL' ? 'bg-amber-500' : r.status === 'OVERDUE' ? 'bg-red-500' : 'bg-blue-500'}`} />
          {r.status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-extrabold text-gray-900 tabular-nums">{formatCurrency(balance)}</p>
          {Number(r.paidAmount) > 0 && <p className="text-[10px] text-emerald-600 font-bold">Paid {formatCurrency(Number(r.paidAmount))} of {formatCurrency(Number(r.totalAmount))}</p>}
        </div>
        <p className="text-xs text-gray-400 font-medium">{formatDate(r.dueDate)}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${
            r.status === 'PAID' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
            r.status === 'PARTIAL' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
            r.status === 'OVERDUE' ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gray-300'
          }`} style={{ width: `${Math.max(paid, 2)}%` }} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 tabular-nums w-8 text-right">{paid}%</span>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
        {r.status !== 'PAID' && <Button size="sm" onClick={() => onCollect(r)} className="flex-1">{r.status === 'PARTIAL' ? 'Pay More' : 'Collect'}</Button>}
        <Button size="sm" variant="outline" onClick={() => feeService.getVoucherPdf(r.id).catch(() => toast.error('Voucher load failed'))}>Merge Voucher</Button>
        <Button size="sm" variant="ghost" onClick={() => setView(true)}>View</Button>
        <Button size="sm" variant="ghost" onClick={() => feeService.getVoucherA5Pdf(r.id).catch(() => toast.error('Voucher load failed'))}>A5</Button>
        <Button size="sm" variant="ghost" onClick={() => onExtend(r)}>Extend</Button>
        <Button size="sm" variant="ghost" onClick={() => onRemind(r)}>Remind</Button>
      </div>
      <VoucherViewModal open={view} feeRecordId={r.id} onClose={() => setView(false)} />
    </div>
  );
}
