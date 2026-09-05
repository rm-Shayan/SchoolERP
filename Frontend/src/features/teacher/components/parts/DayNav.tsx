'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];
// Count-based badge removed per UX request — chip shows day name only.

interface Props {
  targetDow: number;
  label: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: (dow: number) => void;
  onBackToToday: () => void;
}

const DayNav = memo(function DayNav({ targetDow, label, isToday, onPrev, onNext, onJump, onBackToToday }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{label}</h3>
          {isToday ? <span className="text-[10px] font-bold text-primary-500">TODAY</span> : (
            <button onClick={onBackToToday} className="text-[10px] text-primary-600 hover:text-primary-700 font-medium">← Back to today</button>
          )}
        </div>
        <button onClick={onNext} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="flex gap-1 mb-3">
        {DAY_COLS.map((d) => {
          const active = d === targetDow;
          return (
            <button key={d} onClick={() => onJump(d)}
              className={cn('px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all', active ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
              <span className="hidden sm:inline">{DAY_NAMES[d].slice(0, 3)}</span>
              <span className="sm:hidden">{DAY_ABBR[d]}</span>

            </button>
          );
        })}
      </div>
    </>
  );
});

export default DayNav;
