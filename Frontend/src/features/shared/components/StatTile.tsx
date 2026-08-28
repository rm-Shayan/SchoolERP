'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: ReactNode;
  iconBg?: string;
  themeColor?: string;
  tint?: string;
  className?: string;
}

export default function StatTile({ label, value, sub, icon, iconBg, themeColor, tint, className }: StatTileProps) {
  const themed = !iconBg && themeColor;
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl border p-4 sm:p-5 sa-fade-in transition-all duration-300',
      tint
        ? cn(tint, 'border-transparent hover:-translate-y-1 shadow-sm hover:shadow-md')
        : cn('bg-white border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:border-primary-200/60 hover:shadow-md'),
      className,
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/40 group-hover:to-white/10 transition-all duration-500 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">{label}</p>
          <p className="mt-2 truncate text-xl font-extrabold tabular-nums text-slate-950 sm:text-2xl sa-count-up">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500/80 truncate">{sub}</p>}
        </div>
        <div
          className={cn('p-2.5 rounded-2xl shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300', !themed && (iconBg || 'sa-icon-violet'))}
          style={themed ? { background: `${themeColor}1a`, color: themeColor } : undefined}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
