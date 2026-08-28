import { Suspense } from 'react';
import LeaveHub from '@/features/leave/components/LeaveHub';
import PageLoader from '@/components/PageLoader';

export default function BranchLeavePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LeaveHub />
    </Suspense>
  );
}
