import { Suspense } from 'react';
import TeacherDashboard from '@/features/teacher/components/TeacherDashboard';
import PageLoader from '@/components/PageLoader';

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeacherDashboard />
    </Suspense>
  );
}
