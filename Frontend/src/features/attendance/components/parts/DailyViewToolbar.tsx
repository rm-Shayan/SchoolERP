'use client';

import { Select } from '@/features/shared/components';

interface Props {
  date: string;
  classFilter: string;
  classOptions: { value: string; label: string }[];
  onDate: (d: string) => void;
  onClass: (c: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onExport: () => void;
}

const ICON_PREV = 'M15 19l-7-7 7-7';
const ICON_NEXT = 'M9 5l7 7-7 7';

export default function DailyViewToolbar({ date, classFilter, classOptions, onDate, onClass, onPrev, onNext, onToday, onExport }: Props) {
  const navBtn = 'flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <button onClick={onPrev} className={navBtn}>
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PREV} /></svg>
      </button>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500">Date</label>
        <input type="date" value={date} onChange={(e) => onDate(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
      </div>
      <button onClick={onNext} className={navBtn}>
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_NEXT} /></svg>
      </button>
      <button onClick={onToday} className="h-9 rounded-lg bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100">Today</button>
      <div className="w-44">
        <Select label="Class" placeholder="All Classes" options={classOptions} value={classFilter} onChange={(e) => onClass(e.target.value)} className="!h-9 !text-xs" />
      </div>
      <button onClick={onExport}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
