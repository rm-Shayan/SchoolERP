'use client';

import PortalGuard from '@/lib/auth/PortalGuard';
import DashboardLayout from '@/layouts/DashboardLayout';
import { teacherLinks } from '@/config/navLinks';

export default function OrgTeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="teacher">
      <DashboardLayout links={teacherLinks} title="Teacher Portal">
        {children}
      </DashboardLayout>
    </PortalGuard>
  );
}
