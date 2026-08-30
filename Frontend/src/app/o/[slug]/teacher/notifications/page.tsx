import { Suspense } from 'react';
import PortalNotificationsPage from '@/features/school/components/PortalNotificationsPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherNotificationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PortalNotificationsPage />
    </Suspense>
  );
}
