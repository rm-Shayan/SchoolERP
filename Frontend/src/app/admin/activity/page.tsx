import { Suspense } from 'react';
import ActivityPage from '@/features/superadmin/components/ActivityPage';
import PageLoader from '@/components/PageLoader';

export default function ActivityPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ActivityPage />
    </Suspense>
  );
}
