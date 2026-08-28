import { cn } from '@/lib/utils';
import { Sk } from './Skeleton';

/* ── Table Skeleton (attendance, timetable, staff list) ── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Sk key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Sk key={c} className="h-10 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Card Grid Skeleton (homework, exams) ── */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Sk className="h-4 w-3/4" />
              <Sk className="h-3 w-1/2" />
            </div>
            <Sk className="h-3 w-16 shrink-0" />
          </div>
          <Sk className="h-3 w-full" />
          <Sk className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/* ── List Skeleton (assignments, staff items) ── */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <Sk className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Sk className="h-3 w-32" />
              <Sk className="h-2.5 w-48" />
            </div>
          </div>
          <Sk className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ── Grid Cards Skeleton (teaching assignments, branches) ── */
export function GridCardsSkeleton({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  const gridClass = cols === 3
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 lg:grid-cols-2';
  return (
    <div className={cn('grid gap-4', gridClass)} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-5 space-y-3">
          <Sk className="h-4 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex gap-1.5">
                  <Sk className="h-5 w-14 rounded-full" />
                  <Sk className="h-5 w-18 rounded-full" />
                </div>
                <Sk className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page Section Skeleton (generic fallback) ── */
export function SectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-center gap-3">
        <Sk className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-2">
          <Sk className="h-5 w-48" />
          <Sk className="h-3 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-gray-200/70 bg-white p-4 flex items-center gap-3">
            <Sk className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-3 w-16" />
              <Sk className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-48 rounded-xl border border-gray-200/70 bg-white p-5 space-y-3">
        <Sk className="h-4 w-40" />
        <Sk className="h-3 w-full" />
        <Sk className="h-3 w-2/3" />
      </div>
    </div>
  );
}

