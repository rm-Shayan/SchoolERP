'use client';

interface Props {
  date: string;
  onDate: (d: string) => void;
  onToday: () => void;
}

const ICON_PREV = 'M15 19l-7-7 7-7';
const ICON_NEXT = 'M9 5l7 7-7 7';
const navBtn = 'flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50';

/** Reusable date navigation: prev / date input / next / Today. */
export default function DateNav({ date, onDate, onToday }: Props) {
  return (
    <>
      <button type="button" onClick={() => onDate(shift(date, -1))} className={navBtn} aria-label="Previous day">
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PREV} /></svg>
      </button>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500">Date</label>
        <input type="date" value={date} onChange={(e) => onDate(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
      </div>
      <button type="button" onClick={() => onDate(shift(date, 1))} className={navBtn} aria-label="Next day">
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_NEXT} /></svg>
      </button>
      <button type="button" onClick={onToday} className="h-9 rounded-lg bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100">Today</button>
    </>
  );
}

function shift(d: string, days: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
}
