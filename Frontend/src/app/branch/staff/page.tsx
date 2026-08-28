import { Suspense } from 'react';
import StaffListPage from '@/features/staff/components/StaffListPage';
import PageLoader from '@/components/PageLoader';

export default function BranchStaffPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StaffListPage />
    </Suspense>
  );
}
