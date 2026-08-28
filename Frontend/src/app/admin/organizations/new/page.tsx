import { Suspense } from 'react';
import CreateOrganizationPage from '@/features/superadmin/components/CreateOrganizationPage';
import PageLoader from '@/components/PageLoader';

export default function NewOrganizationPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CreateOrganizationPage />
    </Suspense>
  );
}
