'use client';

import { cn } from '@/lib/utils';
import type { PortalChildBrief } from './portalChildGroup';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

interface ChildSwitcherProps {
  children: PortalChildBrief[];
  activeChildId: string;
  onChange: (id: string) => void;
}

export default function ChildSwitcher({ children: items, activeChildId, onChange }: ChildSwitcherProps) {
  if (items.length <= 1) return null;

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-500 mb-2">Select Child</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {items.map((c) => {
          const isActive = c.id === activeChildId;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={cn(
                'shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all',
                isActive
                  ? 'border-primary-300 bg-primary-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.firstName} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <AvatarPlaceholder className={cn('h-8 w-8 shrink-0 rounded-lg', isActive && 'ring-2 ring-primary-400')} />
              )}
              <div className="min-w-0">
                <p className={cn('text-sm font-medium truncate max-w-[100px]', isActive ? 'text-primary-700' : 'text-gray-700')}>
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{c.className} · {c.sectionName}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
