import { useForm, composeValidators, required, isNumber, positiveNumber } from '@/lib/utils';
import { feeService } from '@/lib/api';
import type { FeeStructure } from '@/types';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface LineItemForm { title: string; amount: string; }
type BillingPlan = 'MONTHLY' | 'SIX_MONTH' | 'ANNUAL';

interface FeeStructureFormProps {
  open: boolean;
  schoolId: string;
  classes: { id: string; name: string }[];
  years: { id: string; name: string }[];
  metaLoading?: boolean;
  structure?: FeeStructure | null;
  onClose: () => void;
  onSaved: () => void;
}

function validateLineItems(value: unknown): string | undefined {
  const items = (value as LineItemForm[]) ?? [];
  if (!items.some((i) => i.title.trim() && Number(i.amount) > 0)) return 'Add at least one line item with a title and amount';
  for (const i of items) {
    if (!i.title.trim()) return 'Line item title is required';
    const amount = composeValidators(required('Amount is required'), isNumber(), positiveNumber())(i.amount, {});
    if (amount) return amount;
  }
  return undefined;
}

export default function FeeStructureForm({ open, schoolId, classes, years, metaLoading, structure, onClose, onSaved }: FeeStructureFormProps) {
  const isEdit = Boolean(structure);
  const { values, errors, isSubmitting, setValue, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: structure?.name ?? '', classId: structure?.classes?.[0]?.id ?? '',
      academicYearId: structure?.academicYearId ?? '',
      billingPlan: (structure?.name?.toUpperCase().includes('ANNUAL') ? 'ANNUAL' : structure?.name?.toUpperCase().includes('6 MONTH') ? 'SIX_MONTH' : 'MONTHLY') as BillingPlan,
      lineItems: ((structure?.lineItems?.length ? structure.lineItems : [{ title: '', amount: 0 }]) as { title: string; amount: number }[])
        .map((li) => ({ title: li.title, amount: String(li.amount) })),
    },
    validators: {
      name: required('Structure name is required'), classId: required('Select a class'),
      academicYearId: required('Select an academic year'), lineItems: validateLineItems,
    },
    onSubmit: async (v) => {
      try {
        const items = (v.lineItems as LineItemForm[]).filter((i) => i.title.trim() && Number(i.amount) > 0);
        const payload = {
          classId: v.classId as string, classIds: [v.classId as string], academicYearId: v.academicYearId as string,
          name: `${(v.name as string).trim()} · ${v.billingPlan === 'ANNUAL' ? 'Annual' : v.billingPlan === 'SIX_MONTH' ? '6 Month' : 'Monthly'}`,
          lineItems: items.map((i) => ({ title: i.title.trim(), amount: Number(i.amount) })),
        };
        if (structure) { await feeService.updateStructure(structure.id, payload); toast.success('Fee structure updated'); }
        else { await feeService.createStructure(schoolId, payload); toast.success('Fee structure created'); }
        onSaved();
      } catch (err: any) { toast.error(err?.response?.data?.message ?? `Failed to ${isEdit ? 'update' : 'create'} structure`); }
    },
  });

  const lineItems = values.lineItems as LineItemForm[];
  const total = lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0);
  const updateItem = (idx: number, patch: Partial<LineItemForm>) =>
    setValue('lineItems', lineItems.map((li, i) => (i === idx ? { ...li, ...patch } : li)));
  const removeItem = (idx: number) => setValue('lineItems', lineItems.filter((_, i) => i !== idx));
  const addItem = () => setValue('lineItems', [...lineItems, { title: '', amount: '' }]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Fee Structure' : 'Create Fee Structure'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Structure Name" name="name" placeholder="e.g. Monthly Fee 2026-2027"
          value={values.name as string} onChange={handleChange}
          onBlur={() => handleBlur('name')} error={errors.name} required />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Class" name="classId"
            options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class"
            loading={metaLoading}
            value={values.classId as string} onChange={handleChange}
            onBlur={() => handleBlur('classId')} error={errors.classId} required />
          <Select label="Academic Year" name="academicYearId"
            options={years.map((y) => ({ value: y.id, label: y.name }))} placeholder="Select year"
            loading={metaLoading}
            value={values.academicYearId as string} onChange={handleChange}
            onBlur={() => handleBlur('academicYearId')} error={errors.academicYearId} required />
        </div>

        <Select label="Billing plan" name="billingPlan"
          options={[{ value: 'MONTHLY', label: 'Monthly (each month)' }, { value: 'SIX_MONTH', label: '6 months combined' }, { value: 'ANNUAL', label: 'Annual (once per year)' }]}
          value={values.billingPlan as string} onChange={handleChange} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Fee Items</p>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">Total: {fmtTotal(total)}</span>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
                <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <Input placeholder="Title (e.g. Tuition Fee)" value={item.title}
                  onChange={(e) => updateItem(idx, { title: e.target.value })} className="flex-1 !h-10 !text-sm !bg-white" />
                <Input placeholder="Amount" type="number" value={item.amount}
                  onChange={(e) => updateItem(idx, { amount: e.target.value })} className="w-32 !h-10 !text-sm !bg-white" />
                {lineItems.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)}
                    className="shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-50 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.lineItems && <p className="text-sm text-red-600 font-medium">{errors.lineItems}</p>}

          <button type="button" onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-dashed border-primary-200 rounded-xl transition-all duration-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="submit" loading={isSubmitting}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-200/50 !border-0">
            {isEdit ? 'Save Changes' : 'Create Structure'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function fmtTotal(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);
}
