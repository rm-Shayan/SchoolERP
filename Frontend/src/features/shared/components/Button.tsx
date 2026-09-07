'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  themeColor?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, themeColor, style, ...props }, ref) => {
    const hasTheme = Boolean(themeColor);
    const themeStyle = hasTheme
      ? { background: themeColor, boxShadow: `0 4px 14px ${themeColor}40`, ...style }
      : style;

    return (
      <button
        ref={ref}
        style={themeStyle}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.97]',
          variant === 'primary' && !hasTheme &&
            'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-px',
          variant === 'secondary' &&
            'bg-gray-100 text-gray-700 hover:bg-gray-200/80 hover:text-gray-900 focus:ring-gray-400 shadow-sm hover:shadow',
          variant === 'danger' &&
            'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-px',
          variant === 'ghost' &&
            'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:ring-gray-400',
          variant === 'outline' &&
            'border border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-primary-400 bg-white shadow-sm hover:shadow',
          hasTheme && 'text-white hover:opacity-90 hover:-translate-y-px hover:shadow-lg',
          size === 'sm' && 'px-3 py-1.5 text-xs gap-1.5',
          size === 'md' && 'px-4 py-2 text-sm gap-2',
          size === 'lg' && 'px-6 py-3.5 text-base gap-2.5',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
