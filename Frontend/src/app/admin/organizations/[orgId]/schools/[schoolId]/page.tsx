'use client';

import { Suspense } from 'react';
import SchoolDetailPage from '@/features/superadmin/components/SchoolDetailPage';
import PageLoader from '@/components/PageLoader';

export default function SchoolDetailPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SchoolDetailPage />
    </Suspense>
  );
}
