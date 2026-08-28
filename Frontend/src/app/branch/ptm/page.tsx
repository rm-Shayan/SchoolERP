import { Suspense } from 'react';
import PTMSessionsPage from '@/features/ptm/components/PTMSessionsPage';

export default function BranchPTMPage() {
  return (
    <Suspense fallback={null}>
      <PTMSessionsPage />
    </Suspense>
  );
}
