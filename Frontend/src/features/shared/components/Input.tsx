'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block h-11 w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 text-sm text-gray-900',
            'shadow-sm transition-all duration-200',
            'placeholder:text-gray-400',
            'hover:border-gray-300 hover:bg-white hover:shadow',
            'focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100/60 focus:shadow-md',
            icon && 'pl-11',
            rightIcon && 'pr-12',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-100 hover:border-red-400',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{rightIcon}</div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
export default Input;
