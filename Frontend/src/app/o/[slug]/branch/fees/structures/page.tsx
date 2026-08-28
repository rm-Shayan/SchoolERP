import { Suspense } from 'react';
import FeeStructuresPage from '@/features/fees/components/FeeStructuresPage';
import PageLoader from '@/components/PageLoader';

export default function BranchFeeStructuresPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FeeStructuresPage />
    </Suspense>
  );
}
