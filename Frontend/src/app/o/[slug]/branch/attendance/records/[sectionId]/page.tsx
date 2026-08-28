import { Suspense } from 'react';
import SectionAttendanceDetailPage from '@/features/attendance/components/SectionAttendanceDetailPage';
import PageLoader from '@/components/PageLoader';

export default function SectionAttendanceDetailPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SectionAttendanceDetailPage />
    </Suspense>
  );
}
