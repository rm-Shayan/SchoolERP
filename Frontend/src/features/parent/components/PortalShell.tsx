'use client';

import { useEffect, useState } from 'react';
import { usePortalTheme } from '@/hooks/usePortalTheme';
import { orgThemeStyle } from '@/lib/theme';
import PortalSidebar from './PortalSidebar';
import PortalTopBar from './PortalTopBar';
import MobileBottomNav from './parts/MobileBottomNav';
import type { PortalTab } from './parts/portalTabs';
import type { PortalChildBrief } from './parts/portalChildGroup';

interface ShellProps {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  orgName: string;
  orgLogoUrl?: string | null;
  canEditPhoto?: boolean;
  active: PortalTab;
  onChange: (tab: PortalTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
  childList?: PortalChildBrief[];
  activeChildId?: string;
  onChildChange?: (id: string) => void;
  themeColor?: string | null;
}

export default function PortalShell({ title, subtitle, avatarUrl, orgName, orgLogoUrl, canEditPhoto, active, onChange, onLogout, children, childList, activeChildId, onChildChange, themeColor }: ShellProps) {
  const { pageBg, setOrgTheme } = usePortalTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (themeColor) setOrgTheme(themeColor);
  }, [themeColor, setOrgTheme]);

  const themeStyle = orgThemeStyle(themeColor);

  return (
    <div className="min-h-screen bg-gray-50" style={{ ...pageBg, ...themeStyle }}>
      <PortalSidebar
        active={active}
        onChange={onChange}
        orgName={orgName}
        orgLogoUrl={orgLogoUrl}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        children={childList}
        activeChildId={activeChildId}
        onChildChange={onChildChange}
        themeColor={themeColor}
      />
      <div className="lg:pl-64">
        <PortalTopBar title={title} subtitle={subtitle} avatarUrl={avatarUrl} canEditPhoto={canEditPhoto} onMenuClick={() => setMobileOpen(true)} onLogout={onLogout} />
        <main className="px-4 py-6 pb-20 lg:pb-6 lg:pl-6">{children}</main>
      </div>
      <MobileBottomNav active={active} onChange={onChange} onOpenMore={() => setMobileOpen(true)} />
    </div>
  );
}
