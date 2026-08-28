import { Suspense } from 'react';
import BranchNotificationsTabbedPage from '@/features/school/components/parts/BranchNotificationsTabbedPage';
import PageLoader from '@/components/PageLoader';

export default function BranchNotificationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BranchNotificationsTabbedPage />
    </Suspense>
  );
}
