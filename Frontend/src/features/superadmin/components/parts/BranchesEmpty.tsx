import { EmptyState } from '@/features/shared/components';

interface BranchesEmptyProps {
  search: string;
}

export default function BranchesEmpty({ search }: BranchesEmptyProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm">
      <EmptyState
        icon={
          <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
        title={search ? 'No branches found' : 'No Branches Yet'}
        description={
          search
            ? `Nothing matches "${search}".`
            : 'Branches appear here once they are created under an organization.'
        }
      />
    </div>
  );
}
