import { Suspense } from 'react';
import PromotionsPage from '@/features/promotions/components/PromotionsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchPromotionsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PromotionsPage />
    </Suspense>
  );
}
