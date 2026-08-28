'use client';

import { Suspense } from 'react';
import UnauthorizedPage from '@/features/auth/components/UnauthorizedPage';
import PageLoader from '@/components/PageLoader';

export default function UnauthorizedPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <UnauthorizedPage />
    </Suspense>
  );
}
