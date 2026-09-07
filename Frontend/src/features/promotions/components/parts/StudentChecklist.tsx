'use client';

import { memo } from 'react';
import { VirtualizedList } from '@/features/shared/components/VirtualizedList';
import type { Student } from '@/types';

interface StudentChecklistProps {
  students: Student[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

const ROW_HEIGHT = 44;
const initials = (s: Student) => `${s.firstName.charAt(0)}${s.lastName.charAt(0)}`.toUpperCase();

// Virtualized — even with 1000+ students, only visible rows are in the DOM (smooth scroll
// + checkbox toggles). Previously all rows were rendered, which caused UI slowness.
function StudentChecklistInner({ students, selected, onToggle }: StudentChecklistProps) {
  return (
    <VirtualizedList
      items={students}
      rowHeight={ROW_HEIGHT}
      getKey={(s) => s.id}
      height={384}
      renderRow={(s) => (
        <label className="flex h-11 cursor-pointer items-center gap-3 border-b border-gray-50 px-5 transition-colors hover:bg-primary-50/60">
          <input
            type="checkbox"
            checked={selected.has(s.id)}
            onChange={() => onToggle(s.id)}
            className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
            {initials(s)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
            {s.firstName} {s.lastName}
          </span>
          <span className="shrink-0 text-xs text-gray-500">{s.rollNumber ? `Roll ${s.rollNumber}` : ''}</span>
        </label>
      )}
    />
  );
}

export const StudentChecklist = memo(StudentChecklistInner);
