'use client';

import { type ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error card (e.g. "Timetable", "Fees"). */
  section?: string;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
}

/**
 * Pre-styled error boundary for portal (parent/student/branch/teacher) pages.
 * Catches render errors in the wrapped section and shows a branded fallback
 * instead of crashing the entire portal.
 */
export default function PortalErrorBoundary({ children, section, onRetry }: Props) {
  const theme = getOrgThemeColor();

  return (
    <ErrorBoundary
      onError={(err) => console.error(`[Portal${section ? `:${section}` : ''}] Error:`, err)}
      fallback={
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: theme ? `${theme}12` : '#fef2f2' }}
          >
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke={theme || '#ef4444'}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {section ? `${section} failed to load` : 'Something went wrong'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            This section couldn&apos;t be loaded. The rest of the portal is still working.
          </p>
          <button
            onClick={onRetry}
            className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: theme || '#111827' }}
          >
            Try again
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
