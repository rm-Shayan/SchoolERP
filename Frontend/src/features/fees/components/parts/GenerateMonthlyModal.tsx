import { Button, Input, Modal } from '@/features/shared/components';
import { useForm, composeValidators, required, isNumber, positiveNumber } from '@/lib/utils';

interface GenerateMonthlyModalProps {
  open: boolean;
  month: string;
  year: string;
  dueDay: number;
  onClose: () => void;
  onGenerate: (month: string, year: string, dueDay: number) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function GenerateMonthlyModal({ open, month, year, dueDay, onClose, onGenerate }: GenerateMonthlyModalProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { month, year, dueDay: String(dueDay || 10) },
    validators: {
      month: composeValidators(required('Month is required'), isNumber(), positiveNumber()),
      year: composeValidators(required('Year is required'), isNumber(), positiveNumber()),
      dueDay: composeValidators(required('Due day is required'), isNumber(), positiveNumber()),
    },
    onSubmit: (v) => onGenerate(String(v.month), String(v.year), Number(v.dueDay)),
  });

  const m = Number(values.month);
  const y = Number(values.year);
  const d = Number(values.dueDay);
  const monthLabel = m >= 1 && m <= 12 ? MONTHS[m - 1] : '—';
  const dueDateStr = m >= 1 && m <= 12 && y >= 2000 && d >= 1 && d <= 28 ? `${MONTHS[m - 1]} ${d}, ${y}` : '';

  return (
    <Modal open={open} onClose={onClose} title="Generate Monthly Vouchers" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Calendar preview */}
        {dueDateStr && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-xl shadow-primary-200/30">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5 blur-lg" />
            <div className="relative">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Generating For</p>
              <p className="text-2xl font-extrabold mt-1">{monthLabel} {y}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-white/70">Due Date</p>
                  <p className="text-sm font-bold">{dueDateStr}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Month" type="number" min={1} max={12} name="month"
            value={String(values.month)} onChange={handleChange}
            onBlur={() => handleBlur('month')} error={errors.month} />
          <Input label="Year" type="number" name="year"
            value={String(values.year)} onChange={handleChange}
            onBlur={() => handleBlur('year')} error={errors.year} />
          <Input label="Due Day" type="number" min={1} max={28} name="dueDay"
            value={String(values.dueDay)} onChange={handleChange}
            onBlur={() => handleBlur('dueDay')} error={errors.dueDay} />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs text-amber-700 space-y-1">
            <p>Creates <strong>UNPAID</strong> vouchers for all active students using their class fee structure.</p>
            <p>Existing records for this month are <strong>skipped</strong>. Partial payments supported — parents can pay in installments.</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-200/50 !border-0">
            Generate Vouchers
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
