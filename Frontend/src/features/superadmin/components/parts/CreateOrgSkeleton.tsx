import { Sk } from '@/features/shared/components/Skeleton';

export default function CreateOrgSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6" aria-busy="true" aria-label="Loading form">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Sk className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Sk className="h-6 w-48" />
          <Sk className="h-4 w-64" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Sk key={i} className="flex-1 h-1.5 rounded-full" />
        ))}
      </div>

      {/* Card skeletons */}
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sk className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5">
                  <Sk className="h-2.5 w-12" />
                  <Sk className="h-3.5 w-32" />
                </div>
              </div>
              <Sk className="h-5 w-5 rounded" />
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Sk className="h-3.5 w-20" />
                <Sk className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Sk className="h-3.5 w-16" />
                <Sk className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Sk className="h-3.5 w-24" />
              <Sk className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}

      {/* Collapsed sections */}
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sk className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Sk className="h-2.5 w-12" />
                <Sk className="h-3.5 w-28" />
              </div>
            </div>
            <Sk className="h-5 w-5 rounded" />
          </div>
        </div>
      ))}

      {/* Submit button skeleton */}
      <div className="flex justify-end gap-3">
        <Sk className="h-10 w-24 rounded-lg" />
        <Sk className="h-10 w-40 rounded-lg" />
      </div>
    </div>
  );
}
