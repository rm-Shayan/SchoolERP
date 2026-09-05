import { Suspense } from 'react';
import AttendanceHub from '@/features/attendance/components/AttendanceHub';
import PageLoader from '@/components/PageLoader';

export default function BranchAttendanceRecordsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendanceHub />
    </Suspense>
  );
}
