'use client';

import { useEffect, useState } from 'react';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ParentError({ error, reset }: ErrorProps) {
  useEffect(() => { console.error('Parent portal error:', error); }, [error]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('organization');
      if (stored) {
        const org = JSON.parse(stored);
        if (org?.themeColor) applyPortalThemeToRoot(org.themeColor);
      }
    } catch { /* ignore */ }
    return () => clearPortalThemeFromRoot();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-gray-900">Portal error</h1>
      <p className="mt-3 max-w-md text-base leading-7 text-gray-500">
        The parent/student portal encountered an error. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg border border-red-200 bg-red-50 p-4 text-left text-xs text-red-700">
          {error.message}
        </pre>
      )}
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
          Try again
        </button>
        <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
          Go to Login
        </a>
      </div>
    </div>
  );
}
