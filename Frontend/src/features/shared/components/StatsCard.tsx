'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
  tint?: string;
  index?: number;
}

const StatsCard = memo(function StatsCard({ title, value, icon, subtitle, className, tint, index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative bg-white rounded-2xl border border-gray-200/60 p-5 sm:p-6',
        'shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.03)]',
        'hover:shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05)]',
        'hover:-translate-y-1 hover:border-primary-200/60',
        'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'overflow-hidden',
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/30 group-hover:to-primary-100/10 transition-all duration-500 rounded-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-400 truncate uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5 tracking-tight tabular-nums truncate sa-count-up">
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
          'shadow-sm group-hover:shadow-md group-hover:scale-110',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          tint || 'sa-tint-1'
        )}>
          <span className="w-6 h-6">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
});

export default StatsCard;
