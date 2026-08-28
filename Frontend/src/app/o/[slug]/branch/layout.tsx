'use client';

import PortalGuard from '@/lib/auth/PortalGuard';
import DashboardLayout from '@/layouts/DashboardLayout';
import { schoolAdminLinks } from '@/config/navLinks';

export default function OrgBranchLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="branch">
      <DashboardLayout links={schoolAdminLinks} title="Branch Admin">
        {children}
      </DashboardLayout>
    </PortalGuard>
  );
}
