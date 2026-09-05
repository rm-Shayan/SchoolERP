import { Suspense } from 'react';
import StaffConductRemarksPage from '@/features/staff/components/StaffConductRemarksPage';
import PageLoader from '@/components/PageLoader';

export default function BranchConductPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StaffConductRemarksPage />
    </Suspense>
  );
}