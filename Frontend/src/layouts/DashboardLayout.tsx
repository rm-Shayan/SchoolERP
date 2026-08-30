'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSocket } from '@/hooks/useSocket';
import { orgThemeStyle, applyOrgThemeToRoot, clearOrgThemeFromRoot } from '@/lib/theme';
import { isNavGroup, type SidebarNavItem } from '@/config/navLinks';
import type { ReactNode } from 'react';
import PortalErrorBoundary from '@/components/PortalErrorBoundary';

interface DashboardLayoutProps {
  links: SidebarNavItem[];
  title: string;
  children?: ReactNode;
}

function prefixLinks(links: SidebarNavItem[], prefix: string): SidebarNavItem[] {
  return links.map((item) => {
    if (isNavGroup(item)) {
      return { ...item, links: item.links.map((l) => ({ ...l, path: `${prefix}${l.path}` })) };
    }
    return { ...item, path: `${prefix}${item.path}` };
  });
}

export default function DashboardLayout({ links, title, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useSocket();
  const pathname = usePathname();
  const router = useRouter();
  const { organization, school } = useAppSelector((s) => s.auth);

  const themeColor = organization?.themeColor ?? school?.themeColor ?? null;
  const themeStyle = orgThemeStyle(themeColor);

  // Theme ko :root par bhi apply karo — inline style sirf wrapper tak simit
  // rehta hai; yeh guarantee deta hai ke HAR UI component (header, sidebar,
  // cards, modals) org ka color use kare. Unmount par default wapas.
  useEffect(() => {
    applyOrgThemeToRoot(themeColor);
    return () => clearOrgThemeFromRoot();
  }, [themeColor]);

  const orgStatus = useAppSelector((s) => s.portalStatus.orgStatus);
  const schoolStatus = useAppSelector((s) => s.portalStatus.schoolStatus);
  const blocked = orgStatus === 'BLOCKED' || schoolStatus === 'BLOCKED';

  // NOTE: getBranding() call removed — logo/theme/name are already included
  // in the login + loadUser Redux state (school.logoUrl, organization.themeColor, etc.).
  // Re-fetching caused a 2-render flicker on every page load.

  const slugMatch = pathname.match(/^\/o\/([^/]+)\//);
  const slugPrefix = slugMatch ? `/o/${slugMatch[1]}` : '';
  const scopedLinks = slugPrefix ? prefixLinks(links, slugPrefix) : links;

  useEffect(() => {
    if (organization?.slug && !pathname.startsWith(`/o/${organization.slug}`)) {
      const rest = pathname.startsWith('/o/')
        ? pathname.replace(/^\/o\/[^/]+/, '')
        : pathname;
      router.replace(`/o/${organization.slug}${rest}`);
    }
  }, [organization?.slug, pathname, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-primary-50/40" style={themeStyle}>
      <Sidebar
        links={scopedLinks}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'}`}>
        {blocked && (
          <div className="bg-red-600 text-white text-center text-sm font-medium px-4 py-2" role="alert">
            Admin deactivated your portal. Please contact admin of this system.
          </div>
        )}
        <Navbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6">
          <PortalErrorBoundary section="Page">
            {children}
          </PortalErrorBoundary>
        </main>
      </div>
    </div>
  );
}
