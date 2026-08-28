import { Suspense } from 'react';
import StaffIdCardPage from '@/features/staff/components/StaffIdCardPage';
import PageLoader from '@/components/PageLoader';

export default function BranchStaffIdCardsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StaffIdCardPage />
    </Suspense>
  );
}
