const shimmer = 'animate-pulse rounded-lg bg-slate-200/70';

/** Staff page-shaped skeleton — replaces the spinner during initial data load. */
export default function StaffListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-52 rounded-full bg-slate-200/70" />
          <div className="h-3 w-72 rounded-full bg-slate-200/50" />
        </div>
        <div className="hidden gap-2 sm:flex">
          <div className="h-9 w-28 rounded-lg bg-slate-200/70" />
          <div className="h-9 w-32 rounded-lg bg-primary-200/70" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className={`h-10 flex-1 ${shimmer}`} />
          <div className="h-10 w-full sm:w-44 bg-slate-200/50 rounded-lg" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
        <div className="grid grid-cols-[2fr_2fr_1.2fr_1fr] gap-4 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
          {['Name', 'Email', 'Role', 'Status'].map((h) => (
            <div key={h} className="h-3 w-16 rounded-full bg-slate-200/80" />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="grid grid-cols-[2fr_2fr_1.2fr_1fr] items-center gap-4 border-b border-slate-50 px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200/70" />
              <div className="h-3 w-24 rounded-full bg-slate-200/60" />
            </div>
            <div className="h-3 w-36 rounded-full bg-slate-200/50" />
            <div className="h-6 w-20 rounded-full bg-slate-200/40" />
            <div className="h-6 w-14 rounded-full bg-emerald-100/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
