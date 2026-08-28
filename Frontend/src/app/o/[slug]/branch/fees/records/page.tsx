import { Suspense } from 'react';
import FeeRecordsPage from '@/features/fees/components/FeeRecordsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchFeeRecordsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FeeRecordsPage />
    </Suspense>
  );
}
