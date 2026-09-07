'use client';

import PortalGuard from '@/lib/auth/PortalGuard';
import DashboardLayout from '@/layouts/DashboardLayout';
import { schoolAdminLinks, receptionistLinks } from '@/config/navLinks';
import { useAppSelector } from '@/store/hooks';

export default function BranchRouteLayout({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  const links = role === 'RECEPTIONIST' ? receptionistLinks : schoolAdminLinks;

  return (
    <PortalGuard portal="branch">
      <DashboardLayout links={links} title={role === 'RECEPTIONIST' ? 'Reception' : 'Branch Admin'}>
        {children}
      </DashboardLayout>
    </PortalGuard>
  );
}
