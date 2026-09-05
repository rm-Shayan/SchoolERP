'use client';

interface WeekNavProps {
  weekLabel: string;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onBackToToday: () => void;
}

export default function WeekNav({ weekLabel, weekOffset, onPrev, onNext, onBackToToday }: WeekNavProps) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Prev
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
        {weekOffset !== 0 && (
          <button onClick={onBackToToday} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium mt-0.5">← Back to this week</button>
        )}
      </div>
      <button onClick={onNext} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
