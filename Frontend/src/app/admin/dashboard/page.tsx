import { Suspense } from 'react';
import SuperAdminDashboard from '@/features/superadmin/components/SuperAdminDashboard';
import PageLoader from '@/components/PageLoader';

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdminDashboard />
    </Suspense>
  );
}
