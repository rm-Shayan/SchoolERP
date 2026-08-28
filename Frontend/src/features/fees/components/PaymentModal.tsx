'use client';
import { useState } from 'react';
import { useForm, required, formatCurrency } from '@/lib/utils';
import { feeService } from '@/lib/api';
import type { FeeRecord, PaymentMethod } from '@/types';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import PaymentMonthsSelector, { MonthOption } from './parts/PaymentMonthsSelector';
import PaymentAllocationEditor from './parts/PaymentAllocationEditor';

interface Props { record: FeeRecord; onClose: () => void; onPaid: () => void; records?: FeeRecord[]; }
const labelOf = (d: string) => new Date(d).toLocaleString('en-PK', { month: 'long', year: 'numeric' });
const balanceOf = (r: FeeRecord) => Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0));

export default function PaymentModal({ record, onClose, onPaid, records }: Props) {
  const openRecords = (records?.length ? records : [record]).filter((r) => r.status !== 'PAID')
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  const options: MonthOption[] = openRecords.map((r) => ({
    id: r.id, year: new Date(r.dueDate).getUTCFullYear(), month: new Date(r.dueDate).getUTCMonth() + 1,
    label: labelOf(r.dueDate), amount: balanceOf(r), status: r.status,
  }));
  const [selected, setSelected] = useState<Set<string>>(new Set([record.id]));
  const [amounts, setAmounts] = useState<Record<string, string>>({ [record.id]: String(balanceOf(record)) });
  const selectedMonths = options.filter((m) => selected.has(m.id));
  const total = Number(selectedMonths.reduce((sum, m) => sum + (Number(amounts[m.id]) || 0), 0).toFixed(2));
  const remaining = selectedMonths.reduce((sum, m) => sum + Math.max(0, m.amount - (Number(amounts[m.id]) || 0)), 0);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { method: 'CASH', reference: '' },
    validators: { method: required('Select a payment method') },
    onSubmit: async (v) => {
      const allocations = selectedMonths.map((m) => ({ recordId: m.id, amount: Number(amounts[m.id]) || 0 })).filter((a) => a.amount > 0);
      if (!allocations.length) { toast.error('Enter an amount for at least one month'); return; }
      if (selectedMonths.some((m) => (Number(amounts[m.id]) || 0) > m.amount)) { toast.error('A month amount cannot exceed its balance'); return; }
      try {
        await feeService.recordPayment(record.id, { amount: total, allocations, method: v.method as PaymentMethod, reference: String(v.reference).trim() || undefined });
        toast.success('Payment recorded with month-wise allocation'); onPaid();
      } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to record payment'); }
    },
  });

  const toggle = (id: string) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next);
    if (next.has(id) && !amounts[id]) setAmounts((prev) => ({ ...prev, [id]: String(options.find((m) => m.id === id)?.amount ?? '') }));
  };
  const changeAmount = (id: string, value: string) => setAmounts((prev) => ({ ...prev, [id]: value }));

  return (
    <Modal open onClose={onClose} title="Collect Fee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-sm font-bold text-white">{record.student?.firstName?.[0]}{record.student?.lastName?.[0]}</div>
          <div className="min-w-0"><p className="truncate font-bold text-slate-900">{record.student?.firstName} {record.student?.lastName}</p><p className="text-xs text-slate-500">{record.student?.section?.class?.name} {record.student?.section?.name} {record.student?.rollNumber ? `· Roll #${record.student.rollNumber}` : ''}</p></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <PaymentMonthsSelector periods={options} selected={selected} onToggle={toggle} />
          <PaymentAllocationEditor months={selectedMonths} amounts={amounts} onChange={changeAmount} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900 p-4 text-white">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receiving now</p><p className="text-xl font-extrabold">{formatCurrency(total)}</p></div>
          <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected balance left</p><p className="text-xl font-extrabold text-amber-300">{formatCurrency(remaining)}</p></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Payment Method" name="method" value={values.method as string} onChange={handleChange} onBlur={() => handleBlur('method')} error={errors.method} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank Transfer' }, { value: 'ONLINE', label: 'Online' }, { value: 'OTHER', label: 'Other' }]} />
          <Input label="Reference (optional)" name="reference" placeholder="Transaction ID or cheque number" value={values.reference as string} onChange={handleChange} />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting || total <= 0} className="!border-0 bg-emerald-600 !text-white hover:bg-emerald-700">Collect {formatCurrency(total)}</Button>
        </div>
      </form>
    </Modal>
  );
}

