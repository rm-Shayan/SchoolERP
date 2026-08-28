import { Suspense } from 'react';
import ImportOrganizationsPage from '@/features/superadmin/components/ImportOrganizationsPage';
import PageLoader from '@/components/PageLoader';

export default function ImportPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ImportOrganizationsPage />
    </Suspense>
  );
}
