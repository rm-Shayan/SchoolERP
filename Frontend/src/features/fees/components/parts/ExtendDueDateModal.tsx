import { Button, Input, Modal } from '@/features/shared/components';
import { useForm, composeValidators, required } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/utils';
import { feeService } from '@/lib/api';
import type { FeeRecord } from '@/types';
import toast from 'react-hot-toast';

interface ExtendDueDateModalProps {
  record: FeeRecord;
  onClose: () => void;
  onExtended: () => void;
}

function toDateInputValue(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

const PRESETS = [
  { label: '+3 days', days: 3 },
  { label: '+5 days', days: 5 },
  { label: '+1 week', days: 7 },
  { label: '+2 weeks', days: 14 },
];

export default function ExtendDueDateModal({ record, onClose, onExtended }: ExtendDueDateModalProps) {
  const { values, errors, isSubmitting, setValue, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { dueDate: toDateInputValue(record.dueDate) },
    validators: { dueDate: composeValidators(required('Due date is required')) },
    onSubmit: async (v) => {
      try {
        await feeService.updateRecordDueDate(record.id, new Date(v.dueDate as string).toISOString());
        toast.success('Due date extended for this student');
        onExtended();
      } catch (err) { toast.error(getApiErrorMessage(err, 'Failed to extend due date')); }
    },
  });

  const studentName = record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Student';
  const currentDue = toDateInputValue(record.dueDate);

  return (
    <Modal open onClose={onClose} title={`Extend Due Date`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {record.student?.firstName?.charAt(0)}{record.student?.lastName?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{studentName}</p>
            <p className="text-[11px] text-gray-400">Current due: {new Date(record.dueDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Extend</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button key={p.days} type="button"
                onClick={() => setValue('dueDate', addDays(currentDue, p.days))}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                  values.dueDate === addDays(currentDue, p.days)
                    ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50/50'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Input label="New Due Date" type="date" name="dueDate"
          value={String(values.dueDate)} onChange={handleChange}
          onBlur={() => handleBlur('dueDate')} error={errors.dueDate} />

        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-primary-700">Only this student's due date changes — others are unaffected.</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isSubmitting}>Save</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
