'use client';

import Link from 'next/link';
import type { ProgressState } from './types';

interface ImportStatusProps {
  progress: ProgressState;
}

export default function ImportStatus({ progress }: ImportStatusProps) {
  if (progress.phase === 'processing') {
    return (
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Importing organizations…</span>
          <span className="tabular-nums text-slate-500">
            {progress.current ?? 0} / {progress.total ?? '…'} ({progress.percent ?? 0}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress.percent ?? 0}%` }}
          />
        </div>
        {progress.stalled && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            The job is still running in the background but the live feed is unavailable. Check the{' '}
            <Link href="/admin/organizations" className="font-bold underline">
              Organizations page
            </Link>{' '}
            in a few minutes to confirm the import.
          </p>
        )}
      </div>
    );
  }

  if (progress.phase === 'completed') {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="text-sm text-emerald-900">
          <p className="font-bold">Import completed successfully</p>
          <p className="mt-0.5 text-emerald-800">
            Organizations are ready. New Super Admin credentials (if any) were emailed.
          </p>
          <Link
            href="/admin/organizations"
            className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
          >
            View organizations →
          </Link>
        </div>
      </div>
    );
  }

  if (progress.phase === 'failed') {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm text-rose-900">
          <p className="font-bold">Import failed</p>
          <p className="mt-0.5 text-rose-800">
            {progress.error || 'Something went wrong. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}