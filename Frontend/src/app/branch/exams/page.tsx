import { Suspense } from 'react';
import ExamSchedulePage from '@/features/exams/components/ExamSchedulePage';
import PageLoader from '@/components/PageLoader';

export default function BranchExamSchedulePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamSchedulePage />
    </Suspense>
  );
}
