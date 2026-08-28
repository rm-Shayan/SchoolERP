import { Suspense } from 'react';
import OrganizationsListPage from '@/features/superadmin/components/OrganizationsListPage';
import PageLoader from '@/components/PageLoader';

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrganizationsListPage />
    </Suspense>
  );
}
