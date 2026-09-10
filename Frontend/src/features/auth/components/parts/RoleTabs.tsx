import { cn } from '@/lib/utils';
import type { RoleKey } from './roles';

const STAFF_KEYS: RoleKey[] = ['staff', 'teacher'];

const SHORT_LABELS: Record<RoleKey, string> = {
  staff: 'Staff',
  teacher: 'Teacher',
  admin: 'Admin',
  parent: 'Parent',
  student: 'Student',
};

interface RoleTabsProps {
  active: RoleKey;
  themeColor?: string;
  onChange: (key: RoleKey) => void;
}

export default function RoleTabs({ active, themeColor, onChange }: RoleTabsProps) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
      {STAFF_KEYS.map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isActive}
            className={cn(
              'rounded-lg px-2 py-3 text-xs font-semibold transition-all duration-200 sm:py-2 sm:text-sm',
              isActive
                ? 'text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
            )}
            style={isActive ? { backgroundColor: themeColor || '#6366f1', boxShadow: `0 4px 14px ${themeColor || '#6366f1'}40` } : undefined}
          >
            {SHORT_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
