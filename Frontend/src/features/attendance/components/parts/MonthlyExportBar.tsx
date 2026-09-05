'use client';

interface Props {
  disabled: boolean;
  onExport: () => void;
}

/** Monthly view ka CSV export bar — poora school matrix (har section × student × din). */
export default function MonthlyExportBar({ disabled, onExport }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
      <p className="text-xs font-medium text-gray-500">Monthly CSV: har section ka har student — har din ki status (P/L/A/LV/HD) ke saath</p>
      <button onClick={onExport} disabled={disabled}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-40">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
