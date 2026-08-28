import { Suspense } from 'react';
import MyTimetablePage from '@/features/teacher/components/MyTimetablePage';
import PageLoader from '@/components/PageLoader';

export default function TeacherTimetablePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MyTimetablePage />
    </Suspense>
  );
}
