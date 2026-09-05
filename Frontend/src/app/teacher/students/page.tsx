import { Suspense } from 'react';
import MyStudentsPage from '@/features/teacher/components/MyStudentsPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MyStudentsPage />
    </Suspense>
  );
}
