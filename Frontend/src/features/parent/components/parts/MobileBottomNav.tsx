'use client';

import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { PORTAL_TABS, type PortalTab } from './portalTabs';

interface Props {
  active: PortalTab;
  onChange: (tab: PortalTab) => void;
  onOpenMore: () => void;
}

const PRIMARY = ['overview', 'attendance', 'fees', 'homework'] as PortalTab[];

export default function MobileBottomNav({ active, onChange, onOpenMore }: Props) {
  const theme = getOrgThemeColor();
  const color = theme || '#6366f1';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {PRIMARY.map((key) => {
          const tab = PORTAL_TABS.find((t) => t.key === key)!;
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5"
            >
              <span
                className="flex h-9 w-12 items-center justify-center rounded-xl transition-colors"
                style={{ background: isActive ? `${color}14` : 'transparent', color: isActive ? color : '#94a3b8' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={tab.icon} />
                </svg>
              </span>
              <span className="text-[10px] font-medium" style={{ color: isActive ? color : '#94a3b8' }}>{tab.label}</span>
            </button>
          );
        })}

        <button onClick={onOpenMore} className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5">
          <span className="flex h-9 w-12 items-center justify-center rounded-xl text-slate-400" style={{ color: '#94a3b8' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </span>
          <span className="text-[10px] font-medium text-slate-400">More</span>
        </button>
      </div>
    </nav>
  );
}
