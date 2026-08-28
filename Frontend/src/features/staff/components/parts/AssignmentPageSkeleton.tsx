export default function AssignmentPageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Loading teaching assignments">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
        <div className="h-11 flex-1 rounded-xl bg-gray-100" />
        <div className="h-11 flex-1 rounded-xl bg-gray-100" />
        <div className="h-11 w-full rounded-xl bg-gray-100 sm:w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
            </div>
            <div className="space-y-1 p-3">
              {Array.from({ length: 3 }).map((__, row) => (
                <div key={row} className="flex items-center justify-between rounded-xl px-2 py-3">
                  <div className="h-4 w-40 rounded bg-gray-100" />
                  <div className="h-7 w-16 rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
