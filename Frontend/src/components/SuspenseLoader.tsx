import { Suspense, type ReactNode } from 'react';

/** Full-page spinner with SchoolERP logo. */
function LogoSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 rounded-[20px] border-2 border-primary-100" />
        <span
          className="absolute inset-0 rounded-[20px] border-2 border-transparent border-t-primary-600 border-r-primary-400 animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <img src="/screen.png" alt="" className="absolute inset-2 rounded-[14px] object-contain p-1" />
      </div>
      <p className="text-xs font-medium text-slate-400 animate-pulse">Loading…</p>
    </div>
  );
}

/** Skeleton rows — used for table/card list loading states. */
function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

/**
 * Wraps children in Suspense with either a logo spinner or skeleton rows.
 * <SuspenseLoader>{children}</SuspenseLoader>
 * <SuspenseLoader variant="skeleton" count={6}>{children}</SuspenseLoader>
 */
export default function SuspenseLoader({
  children,
  variant = 'spinner',
  count,
}: {
  children: ReactNode;
  variant?: 'spinner' | 'skeleton';
  count?: number;
}) {
  const fallback = variant === 'skeleton' ? <SkeletonRows count={count} /> : <LogoSpinner />;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
