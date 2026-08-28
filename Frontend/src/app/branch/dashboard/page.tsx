import { Suspense } from 'react';
import AdminDashboard from '@/features/school/components/AdminDashboard';
import PageLoader from '@/components/PageLoader';

export default function BranchDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboard />
    </Suspense>
  );
}
