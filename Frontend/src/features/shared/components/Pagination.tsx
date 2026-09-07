import Button from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
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

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = getPageNumbers(totalPages, page);

  // Scroll to the top of the viewport when the page changes — otherwise the
  // user may miss the new content due to their previous scroll position
  // (a common UX bug on list pages).
  const goTo = (n: number) => {
    onPageChange(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2">
      <p className="text-xs sm:text-sm text-gray-500 tabular-nums">
        Showing <span className="font-semibold text-gray-700">{from}</span>–<span className="font-semibold text-gray-700">{to}</span> of{' '}
        <span className="font-semibold text-gray-700">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
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
                aria-label={`Page ${n}`}
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
          size="sm"
          variant="outline"
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
