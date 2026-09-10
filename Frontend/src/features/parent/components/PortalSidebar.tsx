'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { sidebarColors } from '@/lib/theme';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { PORTAL_TABS, PORTAL_GROUPS, type PortalTab } from './parts/portalTabs';
import ChildSelector from './parts/ChildSelector';
import type { PortalChildBrief } from './parts/portalChildGroup';

interface SidebarProps {
  active: PortalTab;
  onChange: (tab: PortalTab) => void;
  orgName: string;
  orgLogoUrl?: string | null;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  children?: PortalChildBrief[];
  activeChildId?: string;
  onChildChange?: (id: string) => void;
  themeColor?: string | null;
}

export default function PortalSidebar({
  active, onChange, orgName, orgLogoUrl, onLogout,
  mobileOpen, onMobileClose, children: childList, activeChildId, onChildChange, themeColor,
}: SidebarProps) {
  const theme = themeColor || getOrgThemeColor();
  console.log('[ThemeTrace] PortalSidebar — themeColor prop:', themeColor, 'getOrgThemeColor():', getOrgThemeColor(), 'final theme:', theme);
  const colors = sidebarColors(theme);
  const brand = theme || '#6366f1';
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [logoFailed, setLogoFailed] = useState(false);

  const nav = (
    <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {PORTAL_GROUPS.map((group, gi) => {
        const activeInGroup = group.tabs.includes(active);
        const open = openGroups.has(gi) || activeInGroup;
        return (
          <div key={gi} className="mt-3 first:mt-1">
            <button
              onClick={() => setOpenGroups((prev) => { const n = new Set(prev); if (n.has(gi)) n.delete(gi); else n.add(gi); return n; })}
              className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:bg-white/10 hover:text-white"
              style={{ color: activeInGroup ? colors.text : colors.groupText }}
            >
              <span>{group.label || 'General'}</span>
              <svg className={cn('h-3 w-3 shrink-0 transition-transform duration-300 ease-out', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.activeAccent }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={cn('space-y-0.5 mt-1 overflow-hidden transition-all duration-300 ease-out', open ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0')}>
              {group.tabs.map((key) => {
                const t = PORTAL_TABS.find((x) => x.key === key)!;
                const isActive = active === key;
                return (
                  <button key={key} onClick={() => { onChange(key); onMobileClose?.(); }}
                    className="group relative flex w-full items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 pl-6 pr-3 py-2 hover:bg-white/10"
                    style={{ backgroundColor: isActive ? colors.activeBg : undefined, color: isActive ? colors.activeText : colors.textMuted }}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full shadow-[0_0_8px]" style={{ backgroundColor: colors.activeAccent, opacity: 0.9 }} />}
                    <svg className="shrink-0 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: isActive ? colors.activeText : undefined }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                    </svg>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const content = (
    <>
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: colors.activeAccent }} />
      {/* Org branding — portal logo + school details (parent info is now in the header) */}
      <div className="flex items-center gap-3 border-b px-5 py-5" style={{ borderColor: colors.border }}>
        {orgLogoUrl && !logoFailed ? (
          <img src={orgLogoUrl} alt={orgName} onError={() => setLogoFailed(true)}
            className="h-10 w-10 shrink-0 rounded-xl bg-white/10 object-contain p-1 ring-1 ring-white/15" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[13px] font-semibold text-white truncate leading-tight">{orgName || 'School Portal'}</h1>
          <p className="text-[11px] text-white/50 truncate mt-0.5">Parent & Student Portal</p>
        </div>
      </div>
      {childList && childList.length > 1 && activeChildId && (
        <ChildSelector children={childList} activeChildId={activeChildId} onChange={onChildChange!} colors={colors} brand={brand} onMobileClose={onMobileClose} />
      )}
      {nav}
      <div className="mx-3 mb-3 mt-auto flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <img src="/screen.png" alt="SchoolERP" className="h-7 w-7 shrink-0 rounded-full object-contain" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white/80">Powered by SchoolERP</p>
          <p className="mt-0.5 truncate text-[10px]" style={{ color: colors.groupText }}>Digital campus suite</p>
        </div>
      </div>
      <div className="border-t p-3" style={{ borderColor: colors.border }}>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-white/10 hover:text-red-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );

  const gradient = `linear-gradient(180deg, ${colors.bg} 0%, ${colors.bgHover} 50%, ${colors.bg} 100%)`;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />}
      <aside className="fixed left-0 top-0 h-full flex flex-col z-50 hidden w-64 lg:flex border-r" style={{ background: gradient, borderColor: colors.border }}>
        {content}
      </aside>
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden transition-transform duration-300 ease-in-out lg:hidden border-r', mobileOpen ? 'translate-x-0 shadow-2xl shadow-black/40' : '-translate-x-full')} style={{ background: gradient, borderColor: colors.border }}>
        {content}
      </aside>
    </>
  );
}
