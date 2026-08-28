import { Sk } from '@/features/shared/components/Skeleton';

export default function BranchesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="space-y-2">
        <Sk className="h-8 w-40" />
        <Sk className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-gray-200/70 bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-3.5 w-28" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-1/2" />
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
