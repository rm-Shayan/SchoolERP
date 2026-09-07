import { useEffect, useState } from 'react';
import { Input, Select } from '@/features/shared/components';
import { ACTION_LABELS } from './ActivityBadges';

interface ActivityToolbarProps {
  search: string;
  action: string;
  entityType: string;
  total: number | null;
  onSearchChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onEntityTypeChange: (value: string) => void;
}

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
const ENTITY_OPTIONS = [
  { value: 'ORGANIZATION', label: 'Organization' },
  { value: 'SCHOOL', label: 'Branch' },
  { value: 'USER', label: 'Staff' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'AUTH', label: 'Auth' },
];

// Server-side search — debounced to avoid an API call on every keystroke (250ms).
export default function ActivityToolbar({
  search,
  action,
  entityType,
  total,
  onSearchChange,
  onActionChange,
  onEntityTypeChange,
}: ActivityToolbarProps) {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(inputValue), 250);
    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3">
        <div className="relative w-full sm:w-64">
          <Input
            label="Search"
            placeholder="Actor or entity name…"
            aria-label="Search activity log"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={inputValue ? 'pr-10' : undefined}
          />
          {inputValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setInputValue('')}
              className="absolute right-2 bottom-3.5 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Action"
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            placeholder="All actions"
            options={ACTION_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Entity"
            value={entityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            placeholder="All entities"
            options={ENTITY_OPTIONS}
          />
        </div>
        {total !== null && <p className="text-sm text-gray-500 pb-2 tabular-nums"><span className="font-semibold text-gray-700">{total}</span> entries</p>}
      </div>
    </div>
  );
}
