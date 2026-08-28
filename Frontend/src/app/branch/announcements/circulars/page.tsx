import { Suspense } from 'react';
import CircularsPage from '@/features/announcements/components/CircularsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchCircularsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CircularsPage />
    </Suspense>
  );
}
