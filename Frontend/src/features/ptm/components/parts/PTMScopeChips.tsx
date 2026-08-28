import type { PTMScope } from '@/lib/api/ptmService';
import { SCOPE_OPTIONS } from './ptmFormTypes';
import { cn } from '@/lib/utils';

interface PTMScopeChipsProps {
  value: PTMScope;
  onChange: (s: PTMScope) => void;
}

export default function PTMScopeChips({ value, onChange }: PTMScopeChipsProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2">Meeting scope</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'relative min-h-[72px] rounded-xl border px-3 py-2.5 text-left transition-all',
              value === opt.key
                ? 'border-primary-500 bg-white ring-2 ring-primary-100 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
            )}
          >
            <span className={cn('block text-[13px] font-semibold leading-tight', value === opt.key ? 'text-primary-700' : 'text-gray-800')}>
              {opt.label}
            </span>
            <span className="mt-1 block text-[10px] leading-tight text-gray-500">{opt.hint}</span>
            {value === opt.key && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}
