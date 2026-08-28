'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = memo(function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6', className)}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1.5 hidden h-8 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary-500 to-primary-700 sm:block" aria-hidden />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {description && <p className="text-gray-500 mt-1 text-sm leading-relaxed max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end shrink-0 [&>button]:max-sm:flex-1 [&>a]:max-sm:flex-1">{actions}</div>}
    </motion.div>
  );
});

export default PageHeader;
