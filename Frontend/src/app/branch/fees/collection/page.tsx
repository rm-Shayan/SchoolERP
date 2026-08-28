import { Suspense } from 'react';
import FeeCollectionPage from '@/features/fees/components/FeeCollectionPage';
import PageLoader from '@/components/PageLoader';

export default function BranchFeeCollectionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FeeCollectionPage />
    </Suspense>
  );
}
