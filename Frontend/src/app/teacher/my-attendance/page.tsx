import { Suspense } from 'react';
import MyStaffAttendancePage from '@/features/teacher/components/MyStaffAttendancePage';
import PageLoader from '@/components/PageLoader';

export default function TeacherMyAttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MyStaffAttendancePage />
    </Suspense>
  );
}
