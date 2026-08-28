import { Card } from '@/features/shared/components';

export function AdmissionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse hidden sm:block" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}
