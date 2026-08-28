import { Suspense } from 'react';
import GateScanPage from '@/features/attendance/components/GateScanPage';
import PageLoader from '@/components/PageLoader';

export default function BranchGateScanPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GateScanPage />
    </Suspense>
  );
}
