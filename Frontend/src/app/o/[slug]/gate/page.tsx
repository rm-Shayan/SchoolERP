import { Suspense } from 'react';
import GateScanPage from '@/features/attendance/components/GateScanPage';
import PageLoader from '@/components/PageLoader';

export default function OrgGatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GateScanPage />
    </Suspense>
  );
}
