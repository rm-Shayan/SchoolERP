'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  themeColor?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
}

export default function SectionHeader({ title, subtitle, action, themeColor, icon, iconBg, className }: SectionHeaderProps) {
  const themed = !iconBg && themeColor;
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 flex items-center gap-3">
        {icon && (
          <span
            className={cn('p-2.5 rounded-xl shrink-0 shadow-sm', !themed && (iconBg || 'sa-icon-violet'))}
            style={themed ? { background: `${themeColor}1a`, color: themeColor } : undefined}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {themeColor && !icon && <span className="w-1.5 h-5 rounded-full shrink-0" style={{ background: themeColor }} />}
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
          </div>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
