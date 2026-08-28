import { Suspense } from 'react';
import BroadcastPage from '@/features/announcements/components/BroadcastPage';
import PageLoader from '@/components/PageLoader';

export default function BranchBroadcastPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BroadcastPage />
    </Suspense>
  );
}
