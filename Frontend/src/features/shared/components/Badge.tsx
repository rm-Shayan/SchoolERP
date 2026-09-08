import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200',
        {
          'bg-gray-100 text-gray-600 shadow-sm shadow-gray-200/50': variant === 'default',
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50': variant === 'success',
          'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 shadow-sm shadow-amber-100/50': variant === 'warning',
          'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50': variant === 'danger',
          'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 shadow-sm shadow-primary-100/50': variant === 'info',
        }
      )}
    >
      {children}
    </span>
  );
}
