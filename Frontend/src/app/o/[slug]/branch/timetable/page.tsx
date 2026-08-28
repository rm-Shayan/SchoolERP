import { Suspense } from 'react';
import BranchTimetablePage from '@/features/school/components/BranchTimetablePage';
import PageLoader from '@/components/PageLoader';

export default function OrgBranchTimetablePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchTimetablePage />
    </Suspense>
  );
}
