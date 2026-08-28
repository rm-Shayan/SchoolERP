import { Suspense } from 'react';
import BranchesPage from '@/features/superadmin/components/BranchesPage';
import PageLoader from '@/components/PageLoader';

export default function BranchesPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchesPage />
    </Suspense>
  );
}
