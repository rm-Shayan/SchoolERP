'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-50 via-primary-100/60 to-primary-50/40 rounded-2xl flex items-center justify-center shadow-sm shadow-primary-100/50 border border-primary-100/40 text-primary-500"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4 max-w-sm leading-relaxed">{description}</p>}
      {action}
    </motion.div>
  );
}
