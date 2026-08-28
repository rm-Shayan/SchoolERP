import { useState } from 'react';
import { Button, EmptyState } from '@/features/shared/components';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { feeService } from '@/lib/api';
import type { FeeRecord } from '@/types';
import toast from 'react-hot-toast';
import FeeRecordMobileCard from './FeeRecordMobileCard';
import VoucherViewModal from './VoucherViewModal';

interface FeeRecordsTableProps {
  records: FeeRecord[];
  loading: boolean;
  onCollect: (record: FeeRecord) => void;
  onExtend: (record: FeeRecord) => void;
  onRemind: (record: FeeRecord) => void;
}

function StatusBadge({ status }: { status: string }) {
  const dot = status === 'PAID' ? 'bg-emerald-500' : status === 'PARTIAL' ? 'bg-amber-500' : status === 'OVERDUE' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(status)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gray-200" /><div className="space-y-1.5"><div className="h-3.5 w-28 bg-gray-200 rounded-lg" /><div className="h-2.5 w-16 bg-gray-100 rounded-lg" /></div></div></td>
      <td className="py-3 px-4"><div className="h-3.5 w-20 bg-gray-200 rounded-lg" /></td>
      <td className="py-3 px-4"><div className="space-y-1.5"><div className="h-3.5 w-24 bg-gray-200 rounded-lg" /><div className="h-2 w-20 bg-gray-100 rounded-full" /></div></td>
      <td className="py-3 px-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
      <td className="py-3 px-4"><div className="flex justify-end gap-1.5"><div className="h-7 w-16 bg-gray-200 rounded-lg" /><div className="h-7 w-16 bg-gray-100 rounded-lg" /></div></td>
    </tr>
  );
}

function MobileSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-gray-200" /><div className="space-y-1.5"><div className="h-3.5 w-28 bg-gray-200 rounded-lg" /><div className="h-2.5 w-16 bg-gray-100 rounded-lg" /></div></div>
      <div className="h-2 w-full bg-gray-100 rounded-full" />
      <div className="flex gap-2"><div className="h-7 w-16 bg-gray-200 rounded-lg" /><div className="h-7 w-16 bg-gray-100 rounded-lg" /></div>
    </div>
  );
}

export default function FeeRecordsTable({ records, loading, onCollect, onExtend, onRemind }: FeeRecordsTableProps) {
  const [viewId, setViewId] = useState<string | null>(null);
  if (loading) {
    return (
      <>
        <div className="sm:hidden space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <MobileSkeleton key={i} />)}</div>
        <div className="hidden sm:block overflow-x-auto"><table className="w-full text-sm"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody></table></div>
      </>
    );
  }
  if (records.length === 0) {
    return <div className="py-12"><EmptyState title="No fee records" description="Generate monthly vouchers for this period or adjust your filters." /></div>;
  }

  return (
    <>
      <div className="sm:hidden space-y-3 p-4">
        {records.map((r) => <FeeRecordMobileCard key={r.id} record={r} onCollect={onCollect} onExtend={onExtend} onRemind={onRemind} />)}
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 text-left text-[11px] uppercase tracking-wider text-gray-400">
              <th className="py-3 px-4 font-bold">Student</th>
              <th className="py-3 px-4 font-bold">Due Date</th>
              <th className="py-3 px-4 font-bold">Fee Breakdown</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((r) => {
              const paid = Number(r.totalAmount) > 0 ? Math.round((Number(r.paidAmount) / Number(r.totalAmount)) * 100) : 0;
              const balance = Math.max(0, Number(r.totalAmount) - Number(r.paidAmount));
              return (
                <tr key={r.id} className="group hover:bg-gray-50/60 transition-all duration-150">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                        {r.student ? `${r.student.firstName.charAt(0)}${r.student.lastName.charAt(0)}` : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.student ? `${r.student.firstName} ${r.student.lastName}` : '—'}</p>
                        <p className="text-[11px] text-gray-400">{r.student?.section ? `${r.student.section.class?.name ?? ''} ${r.student.section.name}`.trim() : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap text-[13px]">{formatDate(r.dueDate)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-900 text-[13px]">{formatCurrency(balance)}</span>
                        {Number(r.paidAmount) > 0 && <span className="text-[10px] text-emerald-600 font-semibold">of {formatCurrency(Number(r.totalAmount))}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                            r.status === 'PAID' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            r.status === 'PARTIAL' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                            r.status === 'OVERDUE' ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gray-300'
                          }`} style={{ width: `${Math.max(paid, 2)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 tabular-nums">{paid}%</span>
                      </div>
                      {Number(r.paidAmount) > 0 && <p className="text-[10px] text-gray-400">Paid {formatCurrency(Number(r.paidAmount))} / {formatCurrency(Number(r.totalAmount))}</p>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {r.status !== 'PAID' && <Button size="sm" onClick={() => onCollect(r)}>{r.status === 'PARTIAL' ? 'Pay More' : 'Collect'}</Button>}
                      <div className="relative group/v">
                        <Button size="sm" variant="outline" onClick={() => feeService.getVoucherPdf(r.id).catch(() => toast.error('Voucher load failed'))}>Merge Voucher</Button>
                        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover/v:block">
                          <button onClick={() => feeService.getVoucherA5Pdf(r.id).catch(() => toast.error('Voucher load failed'))}
                            className="whitespace-nowrap bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-lg hover:bg-gray-50">
                            A5 Print
                          </button>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setViewId(r.id)}>View</Button>
                      <Button size="sm" variant="ghost" onClick={() => onExtend(r)}>Extend</Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemind(r)}>Remind</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <VoucherViewModal open={!!viewId} feeRecordId={viewId} onClose={() => setViewId(null)} />
    </>
  );
}
