'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isNavGroup, type SidebarNavItem, type NavGroup } from '@/config/navLinks';
import type { SidebarColors } from '@/lib/theme';

interface SidebarNavProps {
  links: SidebarNavItem[];
  collapsed?: boolean;
  isActive: (path: string) => boolean;
  isExpanded: (title: string) => boolean;
  onToggleGroup: (title: string) => void;
  onMobileClose?: () => void;
  colors: SidebarColors;
}

function SingleLink({ link, collapsed, active, onMobileClose, colors }: {
  link: { label: string; path: string; icon: React.ReactNode }; collapsed?: boolean; active: boolean; onMobileClose?: () => void; colors: SidebarColors;
}) {
  return (
    <Link
      href={link.path}
      onClick={onMobileClose}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5',
        active ? '' : 'hover:bg-white/10'
      )}
      style={{
        backgroundColor: active ? colors.activeBg : undefined,
        color: active ? colors.activeText : colors.text,
      }}
      title={collapsed ? link.label : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full shadow-[0_0_8px]" style={{ backgroundColor: colors.activeAccent, opacity: 0.9 }} />
      )}
      <span className="shrink-0 transition-colors" style={{ color: active ? colors.activeText : undefined }}>
        {link.icon}
      </span>
      {!collapsed && <span className="truncate">{link.label}</span>}
    </Link>
  );
}

function CollapsedGroupLink({ group, isActive, onMobileClose, colors }: {
  group: NavGroup; isActive: (path: string) => boolean; onMobileClose?: () => void; colors: SidebarColors;
}) {
  const first = group.links.find((l) => isActive(l.path)) ?? group.links[0];
  const anyActive = group.links.some((l) => isActive(l.path));
  return (
    <Link
      href={first.path}
      onClick={onMobileClose}
      className="flex items-center justify-center py-2.5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: anyActive ? colors.activeBg : undefined,
        color: anyActive ? colors.activeText : colors.text,
      }}
      title={group.title}
    >
      <span className="w-5 h-5">{group.icon ?? first.icon}</span>
    </Link>
  );
}

function ExpandedGroup({ group, collapsed, isActive, isExpanded, onToggleGroup, onMobileClose, colors }: {
  group: NavGroup; collapsed?: boolean; isActive: (p: string) => boolean;
  isExpanded: (t: string) => boolean; onToggleGroup: (t: string) => void; onMobileClose?: () => void; colors: SidebarColors;
}) {
  const anyActive = group.links.some((l) => isActive(l.path));
  const open = isExpanded(group.title);

  if (collapsed) return <CollapsedGroupLink group={group} isActive={isActive} onMobileClose={onMobileClose} colors={colors} />;

  return (
    <div className="mt-3 first:mt-1">
      <button
        onClick={() => onToggleGroup(group.title)}
        className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:bg-white/10 hover:text-white"
        style={{ color: anyActive ? colors.text : colors.groupText }}
      >
        <span className="flex items-center gap-2">
          {group.icon && <span className="w-4 h-4 opacity-70 shrink-0">{group.icon}</span>}
          {group.title}
        </span>
        <svg
          className={cn('h-3 w-3 shrink-0 transition-all duration-300 ease-out', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: colors.activeAccent }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={cn(
        'space-y-0.5 mt-1 overflow-hidden transition-all duration-300 ease-out',
        open ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0'
      )}>
        {group.links.map((link) => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              href={link.path}
              onClick={onMobileClose}
              className="group relative flex items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 pl-6 pr-3 py-2 hover:bg-white/10"
              style={{
                backgroundColor: active ? colors.activeBg : undefined,
                color: active ? colors.activeText : colors.textMuted,
              }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full shadow-[0_0_8px]" style={{ backgroundColor: colors.activeAccent, opacity: 0.9 }} />
              )}
              <span className="shrink-0 w-4 h-4 transition-colors" style={{ color: active ? colors.activeText : undefined }}>
                {link.icon}
              </span>
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SidebarNav({ links, collapsed, isActive, isExpanded, onToggleGroup, onMobileClose, colors }: SidebarNavProps) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {links.map((item) => {
        if (!isNavGroup(item)) {
          return <SingleLink key={item.path} link={item} collapsed={collapsed} active={isActive(item.path)} onMobileClose={onMobileClose} colors={colors} />;
        }
        return (
          <ExpandedGroup
            key={item.title}
            group={item}
            collapsed={collapsed}
            isActive={isActive}
            isExpanded={isExpanded}
            onToggleGroup={onToggleGroup}
            onMobileClose={onMobileClose}
            colors={colors}
          />
        );
      })}
    </nav>
  );
}
