const shimmer = 'animate-pulse rounded-lg bg-slate-200/70';

/** Login hub page-shaped skeleton — server HTML me spinner ki jagah. */
export default function LoginHubSkeleton() {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 animate-pulse">
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
        <div className="relative h-28 w-28">
          <span className="absolute inset-0 rounded-[30px] border-2 border-primary-100" />
          <span
            className="absolute inset-0 rounded-[30px] border-[2.5px] border-transparent border-t-primary-600 border-r-primary-400 border-b-primary-300 animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <img src="/screen.png" alt="Loading" className="absolute inset-2.5 rounded-[22px] object-contain p-1.5" />
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-center gap-6 bg-slate-50 p-12">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 ${shimmer}`} />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-full bg-slate-200/70" />
            <div className="h-3 w-24 rounded-full bg-slate-200/50" />
          </div>
        </div>
        <div className="h-8 w-3/4 rounded-lg bg-slate-200/70" />
        <div className="h-4 w-2/3 rounded-full bg-slate-200/50" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-16 ${shimmer}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-5">
          <div className="mx-auto h-10 w-56 rounded-lg bg-slate-200/70" />
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-white shadow-sm" />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 space-y-4">
            <div className={`h-10 w-full ${shimmer}`} />
            <div className="h-10 w-full bg-slate-200/50 rounded-lg" />
            <div className="h-11 w-full rounded-xl bg-primary-200/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
