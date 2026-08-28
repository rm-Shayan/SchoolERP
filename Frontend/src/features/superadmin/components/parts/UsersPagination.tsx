import { Button } from '@/features/shared/components';
import { PAGE_SIZE } from './helpers';

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(totalPages: number, current: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const raw = [...new Set([1, current - 1, current, current + 1, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  raw.forEach((n, i) => {
    if (i > 0 && n - raw[i - 1] > 1) out.push('ellipsis');
    out.push(n);
  });
  return out;
}

export default function UsersPagination({ page, totalPages, totalCount, onPageChange }: UsersPaginationProps) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);
  const pages = getPageNumbers(totalPages, page);
  const goTo = (n: number) => {
    onPageChange(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100/80">
      <p className="text-xs text-gray-500 tabular-nums">
        Showing <span className="font-semibold text-gray-700">{start}</span>–<span className="font-semibold text-gray-700">{end}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalCount.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className="rounded-xl"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((n, i) =>
            n === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1.5 text-gray-300 text-sm">…</span>
            ) : (
              <button
                key={n}
                onClick={() => goTo(n)}
                className={`sa-page-btn ${n === page ? 'sa-page-active' : 'text-gray-500'}`}
                aria-label={`Go to page ${n}`}
              >
                {n}
              </button>
            )
          )}
        </div>

        <span className="sm:hidden text-xs text-gray-400 font-medium tabular-nums px-2">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className="rounded-xl"
        >
          Next
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
