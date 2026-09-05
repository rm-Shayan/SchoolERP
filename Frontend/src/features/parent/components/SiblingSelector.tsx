import { cn } from '@/lib/utils';
import type { ParentChild } from '@/lib/api/parentService';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

interface SiblingSelectorProps {
  items: ParentChild[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SiblingSelector({ items, activeId, onChange }: SiblingSelectorProps) {
  if (items.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            onClick={() => onChange(child.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0',
              active
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
            )}
          >
            <AvatarPlaceholder className="w-6 h-6 rounded-full shrink-0" />
            <span className="truncate">{child.firstName}</span>
          </button>
        );
      })}
    </div>
  );
}
