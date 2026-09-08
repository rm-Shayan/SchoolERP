import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/features/shared/components';
import type { FeeSummary } from '@/types';

interface Props {
  summary: FeeSummary | null;
  dueDay: number;
  themeColor?: string | null;
  schoolName?: string;
  onGenerate: () => void;
  onBulk: () => void;
  onDueDay: () => void;
  readOnly?: boolean;
}

export default function FeeRecordsHero({ summary, dueDay, schoolName, onGenerate, onBulk, onDueDay, readOnly }: Props) {
  const pending = (summary?.counts.UNPAID || 0) + (summary?.counts.PARTIAL || 0) + (summary?.counts.OVERDUE || 0);
  return (
    <>
      <PageHeader
        title="Fee Records"
        description="Track and manage student fee collections across this branch."
        actions={
          !readOnly ? (
            <>
              <button onClick={onDueDay} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Due {dueDay}th
              </button>
              <button onClick={onBulk} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Bulk
              </button>
              <button onClick={onGenerate} className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700">
                Generate Monthly
              </button>
            </>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outstanding</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{formatCurrency(summary?.outstanding || 0)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Collected</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatCurrency(summary?.collected || 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Open</p>
          <p className="mt-1 text-xl font-extrabold text-slate-700">{pending}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Overdue</p>
          <p className="mt-1 text-xl font-extrabold text-rose-600">{summary?.counts.OVERDUE || 0}</p>
        </div>
      </div>
    </>
  );
}
