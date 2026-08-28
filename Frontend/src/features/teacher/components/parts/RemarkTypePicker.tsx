import { cn } from '@/lib/utils';
import type { RemarkType } from '@/types';

interface Props {
  value: string;
  error?: string;
  onChange: (type: RemarkType) => void;
}

const TYPES: { value: RemarkType; label: string; classes: string }[] = [
  { value: 'POSITIVE', label: 'Positive', classes: 'bg-green-600 text-white' },
  { value: 'NEUTRAL', label: 'Neutral', classes: 'bg-gray-500 text-white' },
  { value: 'NEGATIVE', label: 'Negative', classes: 'bg-red-600 text-white' },
];

export default function RemarkTypePicker({ value, error, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', value === t.value ? t.classes : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
