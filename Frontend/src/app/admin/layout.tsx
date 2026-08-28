'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import PortalGuard from '@/lib/auth/PortalGuard';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { superAdminLinks } from '@/config/navLinks';
import PageLoader from '@/components/PageLoader';

const PUBLIC_PATHS = ['/admin/login'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <PortalGuard portal="admin" publicPaths={PUBLIC_PATHS}>{children}</PortalGuard>;
  }

  return (
    <PortalGuard portal="admin" publicPaths={PUBLIC_PATHS}>
      <Suspense fallback={<PageLoader />}>
        <SuperAdminLayout links={superAdminLinks} title="Admin Console">
          {children}
        </SuperAdminLayout>
      </Suspense>
    </PortalGuard>
  );
}
