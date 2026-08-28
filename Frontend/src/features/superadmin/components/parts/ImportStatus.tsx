'use client';

import Link from 'next/link';
import type { ProgressState } from './types';

interface ImportStatusProps {
  progress: ProgressState;
}

export default function ImportStatus({ progress }: ImportStatusProps) {
  return (
    <>
      {progress.phase === 'processing' && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Importing organizations…</span>
            <span className="text-gray-500">
              {progress.current ?? 0} / {progress.total ?? '…'} ({progress.percent ?? 0}%)
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent ?? 0}%` }}
            />
          </div>
          {progress.stalled && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              The job is still running in the background but the live feed is unavailable.
              Check the{' '}
              <Link href="/admin/organizations" className="font-medium underline">
                Organizations page
              </Link>{' '}
              in a few minutes to confirm the import.
            </p>
          )}
        </div>
      )}

      {progress.phase === 'completed' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-sm text-green-800">
            <p className="font-semibold">Import completed successfully</p>
            <p className="mt-0.5">
              Organizations are ready. New Super Admin credentials (if any) were emailed.
            </p>
            <Link
              href="/admin/organizations"
              className="inline-flex items-center gap-1 mt-2 font-medium text-green-700 hover:text-green-900"
            >
              View organizations →
            </Link>
          </div>
        </div>
      )}

      {progress.phase === 'failed' && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-800">
            <p className="font-semibold">Import failed</p>
            <p className="mt-0.5">{progress.error || 'Something went wrong. Please try again.'}</p>
          </div>
        </div>
      )}
    </>
  );
}
