import { Suspense } from 'react';
import GatePageWrapper from './GatePageWrapper';
import PageLoader from '@/components/PageLoader';

export default function OrgGatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GatePageWrapper />
    </Suspense>
  );
}
