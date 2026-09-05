'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { sidebarColors } from '@/lib/theme';
import { isNavGroup, type SidebarNavItem } from '@/config/navLinks';
import SidebarNav from './parts/SidebarNav';

interface SidebarProps {
  links: SidebarNavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ links, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { organization, school } = useAppSelector((s) => s.auth);
  const logo = school?.logoUrl || organization?.logoUrl || '/screen.png';
  const title = school ? school.name : organization?.name || 'School ERP';
  const subtitle = school ? organization?.name : undefined;

  const themeColor = organization?.themeColor || school?.themeColor || null;
  const colors = useMemo(() => sidebarColors(themeColor), [themeColor]);

  const expandedByDefault = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of links) {
      if (isNavGroup(item)) {
        map.set(item.title, item.links.some(
          (l) => pathname === l.path || pathname.startsWith(l.path + '/')
        ));
      }
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, pathname]);

  const [expanded, setExpanded] = useState<Map<string, boolean>>(expandedByDefault);
  const isExpanded = (t: string) => expanded.get(t) ?? expandedByDefault.get(t) ?? false;
  const toggleGroup = (t: string) => setExpanded((p) => new Map(p).set(t, !isExpanded(t)));
  const activePath = useMemo(() => {
    const paths = links.flatMap((item) => isNavGroup(item) ? item.links.map((link) => link.path) : [item.path]);
    return paths.filter((path) => pathname === path || pathname.startsWith(path + '/'))
      .sort((a, b) => b.length - a.length)[0];
  }, [links, pathname]);
  const isActive = (p: string) => p === activePath;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ease-in-out',
          'border-r',
          collapsed ? 'w-[72px]' : 'w-[264px]',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl shadow-black/40' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.bgHover} 50%, ${colors.bg} 100%)`,
          borderColor: colors.border,
        }}
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: colors.activeAccent }}
        />
        <div className={cn(
          'flex items-center gap-3 border-b transition-all',
          collapsed ? 'justify-center px-2 py-4' : 'px-5 py-5'
        )} style={{ borderColor: colors.border }}>
          <img src={logo} alt={title} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-contain shrink-0 bg-white/95 p-0.5" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-[13px] font-semibold text-white truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-[10px] sm:text-[11px] text-white/50 truncate mt-0.5">{subtitle}</p>}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onMobileClose}
              className="text-white/40 hover:text-white/70 lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <SidebarNav
          links={links}
          collapsed={collapsed}
          isActive={isActive}
          isExpanded={isExpanded}
          onToggleGroup={toggleGroup}
          onMobileClose={onMobileClose}
          colors={colors}
        />

        {!collapsed && (
          <div className="mx-3 mb-3 mt-auto flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <img src="/screen.png" alt="SchoolERP" className="h-7 w-7 shrink-0 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white/80">Powered by SchoolERP</p>
              <p className="mt-0.5 truncate text-[10px]" style={{ color: colors.groupText }}>Digital campus suite</p>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className={cn(
            'absolute -right-3 top-20 w-6 h-6 rounded-full',
            'border',
            'hidden lg:flex items-center justify-center',
            'text-white/50 hover:text-white/80',
            'transition-all duration-200 shadow-md shadow-black/20'
          )}
          style={{ backgroundColor: colors.bgHover, borderColor: colors.border }}
          aria-label="Toggle sidebar"
        >
          <svg className={cn('w-3 h-3 transition-transform duration-300', collapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}
