import { Input } from '@/features/shared/components';
import type { AssignedSection } from './ClassForm';

interface AssignedSectionsEditorProps {
  assigned: AssignedSection[];
  onPatch: (name: string, field: 'capacity' | 'roomNumber', value: string) => void;
}

export default function AssignedSectionsEditor({ assigned, onPatch }: AssignedSectionsEditorProps) {
  if (assigned.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Per-section capacity &amp; room (class-section combination)
      </p>
      <p className="text-xs text-gray-400">
        Set each section's capacity within this class — e.g. Class 4 + A = 50. Blank = unlimited.
      </p>
      <div className="space-y-2">
        {assigned.map((s) => (
          <div key={s.name} className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-8 px-2 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
              {s.name}
            </span>
            <Input
              name={`cap-${s.name}`}
              type="number"
              placeholder="Capacity"
              value={s.capacity}
              onChange={(e) => onPatch(s.name, 'capacity', e.target.value)}
              className="w-28"
            />
            <Input
              name={`room-${s.name}`}
              placeholder="Room (e.g. 101)"
              value={s.roomNumber}
              onChange={(e) => onPatch(s.name, 'roomNumber', e.target.value)}
              className="w-36"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
