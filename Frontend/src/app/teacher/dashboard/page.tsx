import { Suspense } from 'react';
import SectionAttendancePage from '@/features/teacher/components/SectionAttendancePage';
import PageLoader from '@/components/PageLoader';

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SectionAttendancePage />
    </Suspense>
  );
}
