'use client';

import { Sk } from '@/features/shared/components/Skeleton';

/** Portal layout-shaped skeleton — refresh/navigation par section-level
 *  instant fallback (application-level logo splash ki jagah). */
export default function PortalSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-r border-slate-200/70 bg-white p-5">
        <Sk className="h-9 w-9 rounded-xl" />
        <div className="mt-4 space-y-2.5">
          {[64, 80, 56, 72, 60, 76, 52, 68].map((w, i) => (
            <Sk key={i} className="h-3 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white px-6">
          <Sk className="h-4 w-40 rounded-full" />
          <Sk className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <Sk className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Sk key={i} className="h-24 rounded-2xl border border-slate-200/70" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Sk className="h-72 rounded-2xl border border-slate-200/70 lg:col-span-7" />
            <Sk className="h-72 rounded-2xl border border-slate-200/70 lg:col-span-5" />
          </div>
        </main>
      </div>
    </div>
  );
}
