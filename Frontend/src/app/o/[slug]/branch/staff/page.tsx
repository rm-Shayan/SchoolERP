import { Suspense } from 'react';
import StaffListPage from '@/features/staff/components/StaffListPage';
import StaffListSkeleton from '@/features/staff/components/parts/StaffListSkeleton';

export default function BranchStaffPage() {
  return (
    <Suspense fallback={<StaffListSkeleton />}>
      <StaffListPage />
    </Suspense>
  );
}
