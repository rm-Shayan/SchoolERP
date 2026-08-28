import { Suspense } from 'react';
import AdminNotificationsTabbedPage from '@/features/superadmin/components/parts/AdminNotificationsTabbedPage';
import PageLoader from '@/components/PageLoader';

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminNotificationsTabbedPage />
    </Suspense>
  );
}
