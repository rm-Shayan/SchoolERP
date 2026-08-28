import { Suspense } from 'react';
import ExamResultsPage from '@/features/exams/components/ExamResultsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchExamResultsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamResultsPage />
    </Suspense>
  );
}
