import { Suspense } from 'react';
import BranchStudentsPage from '@/features/superadmin/components/BranchStudentsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchStudentsPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchStudentsPage />
    </Suspense>
  );
}
