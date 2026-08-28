'use client';

import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  loading?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, loading, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative group">
        {loading ? (
          <div className="relative">
            <div className="block h-11 w-full rounded-xl border border-gray-200/80 bg-gray-50 animate-pulse" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
              <span className="text-[10px] font-medium text-gray-400">Loading…</span>
            </div>
          </div>
        ) : (
          <select
            ref={ref}
            className={cn(
              'block h-11 w-full appearance-none rounded-xl border border-gray-200/80 bg-white px-3.5 pr-10 text-sm text-gray-900',
              'shadow-sm transition-all duration-200',
              'hover:border-gray-300 hover:shadow-md',
              'focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/80 focus:shadow-md',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-100 hover:border-red-400',
              className
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        {!loading && (
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
export default Select;
