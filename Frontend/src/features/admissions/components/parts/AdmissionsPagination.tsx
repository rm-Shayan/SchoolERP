import { Button } from '@/features/shared/components';

interface AdmissionsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AdmissionsPagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }: AdmissionsPaginationProps) {
  if (total === 0 || pageSize === 5) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const goTo = (p: number) => {
    onPageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs sm:text-sm text-gray-500 tabular-nums">
        Showing <span className="font-medium text-gray-900">{from}</span>–<span className="font-medium text-gray-900">{to}</span> of <span className="font-medium text-gray-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {pageSize > 5 && <button type="button" className="group inline-flex items-center gap-1 px-1 py-1 text-xs font-bold text-primary-700 hover:text-primary-800" onClick={() => { onPageSizeChange(5); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Collapse list<svg className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l7 7-7-7" /></svg></button>}
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => goTo(page - 1)}>
          Previous
        </Button>
        <span className="text-xs text-gray-500 tabular-nums">Page {page} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
