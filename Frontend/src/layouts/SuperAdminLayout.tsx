'use client';

import { useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import { useSocket } from '@/hooks/useSocket';
import type { ReactNode } from 'react';

interface SuperAdminLayoutProps {
  links: { label: string; path: string; icon: React.ReactNode }[];
  title: string;
  children?: ReactNode;
}

export default function SuperAdminLayout({ links, title, children }: SuperAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useSocket();

  return (
    <div className="superadmin-theme min-h-screen bg-slate-50 text-slate-900">
      <SuperAdminSidebar
        links={links}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen overflow-x-hidden transition-[margin] duration-300 ease-out ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[252px]'}`}>
        <SuperAdminNavbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="sa-canvas mx-auto min-h-[calc(100vh-72px)] max-w-[1440px] p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
