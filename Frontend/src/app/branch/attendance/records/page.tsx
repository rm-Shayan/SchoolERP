import { Suspense } from 'react';
import AttendanceRecordsPage from '@/features/attendance/components/AttendanceRecordsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchAttendanceRecordsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendanceRecordsPage />
    </Suspense>
  );
}
