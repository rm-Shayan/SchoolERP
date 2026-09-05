'use client';

import { Suspense } from 'react';
import ParentPortalPage from '@/features/parent/components/ParentPortalPage';
import PageLoader from '@/components/PageLoader';

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ParentPortalPage />
    </Suspense>
  );
}
