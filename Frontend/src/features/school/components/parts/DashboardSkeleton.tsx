const Bar = ({ w }: { w: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-5 bg-slate-200 rounded-t" style={{ height: w }} />
    <div className="h-2 w-8 bg-slate-100 rounded" />
  </div>
);

const ListRow = () => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100">
    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-2.5 w-28 bg-slate-200 rounded" />
      <div className="h-2 w-36 bg-slate-100 rounded" />
    </div>
    <div className="h-5 w-14 bg-slate-100 rounded-full shrink-0" />
  </div>
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      {/* Hero banner */}
      <div className="h-32 md:h-40 bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/60 rounded-2xl border border-slate-100" />
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="h-9 w-9 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-6 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      {/* Chart row: bar + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 min-h-[260px] sm:min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-44 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
          <div className="flex-1 flex items-end gap-3 mt-8 px-4">
            {['40%', '65%', '50%', '80%', '35%', '70%', '55%'].map((h, i) => (
              <Bar key={i} w={h} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 min-h-[260px] sm:min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center justify-center mt-6">
            <div className="w-40 h-40 rounded-full border-[14px] border-slate-100 border-t-slate-200 border-r-slate-200" />
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-12 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom row: funnel + scans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 min-h-[260px] sm:min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                  <div className="h-2.5 w-12 bg-slate-200 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div className="h-full bg-slate-200 rounded-full" style={{ width: `${40 + i * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 min-h-[260px] sm:min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <ListRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
