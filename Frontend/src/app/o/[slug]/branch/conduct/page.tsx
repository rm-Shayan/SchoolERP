import { Suspense } from 'react';
import BranchConductRemarksPage from '@/features/school/components/BranchConductRemarksPage';
import PageLoader from '@/components/PageLoader';

export default function OrgBranchConductPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchConductRemarksPage />
    </Suspense>
  );
}