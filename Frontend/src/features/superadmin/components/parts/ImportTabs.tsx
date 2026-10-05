'use client';

import { cn } from '@/lib/utils';
import type { ImportTab } from './types';

const TABS: ReadonlyArray<readonly [ImportTab, string]> = [
  ['organizations', 'Organizations'],
  ['branches', 'Branches'],
];

interface ImportTabsProps {
  tab: ImportTab;
  onTabChange: (tab: ImportTab) => void;
}

export default function ImportTabs({ tab, onTabChange }: ImportTabsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:w-fit">
      {TABS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onTabChange(value)}
          aria-current={tab === value ? 'page' : undefined}
          className={cn(
            'rounded-xl px-5 py-2.5 text-sm font-bold transition-all',
            tab === value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}