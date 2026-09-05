'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SidebarColors } from '@/lib/theme';
import type { PortalChildBrief } from './portalChildGroup';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

interface Props {
  children: PortalChildBrief[];
  activeChildId: string;
  onChange: (id: string) => void;
  colors: SidebarColors;
  brand: string;
  onMobileClose?: () => void;
}

function ChildAvatar({ child, size }: { child: PortalChildBrief; size: number }) {
  if (child.imageUrl) {
    return <img src={child.imageUrl} alt={`${child.firstName} ${child.lastName}`} className="rounded-lg object-cover" style={{ width: size, height: size }} />;
  }
  return <AvatarPlaceholder className="rounded-lg" style={{ width: size, height: size }} />;
}

export default function ChildSelector({ children: items, activeChildId, onChange, colors, brand, onMobileClose }: Props) {
  const [open, setOpen] = useState(false);
  const active = items.find((c) => c.id === activeChildId);
  if (!active) return null;

  return (
    <div className="relative mx-3 mb-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 hover:bg-white/10 border"
        style={{ borderColor: colors.border, color: colors.textMuted }}
      >
        <ChildAvatar child={active} size={32} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-white text-[13px]">{active.firstName} {active.lastName}</p>
          <p className="truncate text-[10px]" style={{ color: colors.groupText }}>{active.className} · {active.sectionName}</p>
        </div>
        <svg className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.activeAccent }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border py-1 shadow-xl" style={{ backgroundColor: colors.bgHover, borderColor: colors.border }}>
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => { onChange(c.id); setOpen(false); onMobileClose?.(); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-[13px] transition-colors hover:bg-white/10"
              style={{ color: c.id === activeChildId ? colors.activeText : colors.textMuted, backgroundColor: c.id === activeChildId ? colors.activeBg : undefined }}
            >
              <ChildAvatar child={c} size={28} />
              <div className="min-w-0 text-left">
                <p className="truncate font-medium">{c.firstName} {c.lastName}</p>
                <p className="truncate text-[10px]" style={{ color: colors.groupText }}>{c.className} · {c.sectionName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
