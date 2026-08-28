'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = memo(function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-gray-200/60',
        'shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.03)]',
        'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'sa-card-glow',
        onClick && 'cursor-pointer hover:shadow-[0_8px_32px_rgba(124,58,237,0.12),0_2px_8px_rgba(124,58,237,0.06)] hover:border-primary-300/50 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
});

function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-4 sm:px-6 py-4 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/60 via-gray-50/40 to-transparent', className)}>
      {children}
    </div>
  );
}

function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-4 sm:px-6 py-4 sm:py-5', className)}>{children}</div>;
}

export { Card, CardHeader, CardContent };
