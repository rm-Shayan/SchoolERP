import { Sk } from '@/features/shared/components/Skeleton';

export default function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      {/* Welcome header skeleton */}
      <div className="h-32 sm:h-36 rounded-3xl border border-violet-200/20 bg-gradient-to-br from-violet-100/40 to-purple-100/30 overflow-hidden relative">
        <Sk className="absolute inset-0 rounded-none" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-gray-200/70 bg-white p-4 flex items-center gap-3">
            <Sk className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-3 w-20" />
              <Sk className="h-5 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* Status stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-gray-200/70 bg-white p-4 space-y-2">
            <Sk className="h-3 w-16" />
            <Sk className="h-4 w-10" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-72 rounded-2xl border border-gray-200/70 bg-white p-5">
          <Sk className="h-4 w-40 mb-4" />
          <Sk className="h-[220px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2 h-72 rounded-2xl border border-gray-200/70 bg-white p-5">
          <Sk className="h-4 w-32 mb-4" />
          <Sk className="h-[220px] w-full rounded-xl" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-52 rounded-2xl border border-gray-200/70 bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-3.5 w-32" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-2/3" />
            <div className="flex gap-2 pt-1">
              <Sk className="h-6 w-16 rounded-full" />
              <Sk className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
