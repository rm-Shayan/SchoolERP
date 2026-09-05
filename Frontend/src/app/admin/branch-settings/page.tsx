import { Suspense } from 'react';
import BranchSettingsPage from '@/features/superadmin/components/BranchSettingsPage';
import PageLoader from '@/components/PageLoader';

export default function AdminBranchSettingsRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchSettingsPage />
    </Suspense>
  );
}
