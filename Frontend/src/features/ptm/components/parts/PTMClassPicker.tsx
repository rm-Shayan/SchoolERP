import type { Class } from '@/lib/api/academicService';
import { cn } from '@/lib/utils';

interface PTMClassPickerProps {
  label: string;
  classes: Class[];
  value: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}

export default function PTMClassPicker({ label, classes, value, disabled, onChange }: PTMClassPickerProps) {
  return (
    <div className={cn(disabled && 'opacity-50')}>
      <p className="mb-2 text-xs font-semibold text-gray-600">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" role="group" aria-label={label}>
        {classes.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(item.id)}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                selected
                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:text-primary-700',
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
