import { Suspense } from 'react';
import StaffLeavePage from '@/features/staff/components/StaffLeavePage';
import PageLoader from '@/components/PageLoader';

export default function BranchStaffLeavePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StaffLeavePage />
    </Suspense>
  );
}
