import { Suspense } from 'react';
import TeacherAnnouncementsPage from '@/features/announcements/components/TeacherAnnouncementsPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherAnnouncementsPageWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeacherAnnouncementsPage />
    </Suspense>
  );
}
