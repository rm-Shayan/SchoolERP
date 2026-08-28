import { Suspense } from 'react';
import OrganizationDetail from '@/features/superadmin/components/OrganizationDetail';
import PageLoader from '@/components/PageLoader';

export default function OrganizationDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrganizationDetail />
    </Suspense>
  );
}
