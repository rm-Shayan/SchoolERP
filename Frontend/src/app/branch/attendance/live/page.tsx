import { Suspense } from 'react';
import LiveAttendancePage from '@/features/attendance/components/LiveAttendancePage';
import PageLoader from '@/components/PageLoader';

export default function BranchLiveAttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LiveAttendancePage />
    </Suspense>
  );
}
