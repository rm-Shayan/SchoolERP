import Link from 'next/link';

const activities = ['Attendance sync', 'Fee reminder sent', 'Teacher homework', 'Parent dashboard update'];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[600px] w-[600px] rounded-full bg-primary-100/60 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-secondary-100/40 blur-[100px]" />

      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #4c1d95 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-700 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
            Built for modern schools
          </span>

          <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Run your school
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"> smarter </span>
            with one digital campus.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
            Admissions, attendance, fees, teacher workflow, parent communication, and reporting — all in one secure SaaS experience.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-primary-600/20 transition-all duration-200 hover:shadow-2xl hover:shadow-primary-600/25 hover:brightness-110">
              Get started
            </Link>
            <a href="#features" className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-7 py-3.5 text-base font-bold text-gray-700 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/50">
              Explore features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {['Multi-branch ready', 'Parent + staff portal', 'Secure cloud'].map((tag) => (
              <span key={tag} className="rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-500 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right — dashboard preview */}
        <div className="relative">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-primary-200/70 blur-3xl" />
          <div className="absolute -right-8 bottom-10 h-42 w-42 rounded-full bg-secondary-200/60 blur-3xl" />

          <div className="relative overflow-hidden rounded-[28px] border border-primary-200/60 bg-white p-5 shadow-[0_30px_80px_rgba(76,29,149,0.12)] sa-float">
            <div className="sa-card-gradient absolute inset-0 rounded-[28px]" />
            <div className="relative flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">School overview</p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">Green Valley Academy</h2>
              </div>
              <div className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold text-secondary-600 ring-1 ring-secondary-200">Live</div>
            </div>

            <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Enrollment</p>
                <p className="mt-2 text-3xl font-black text-gray-900">1,248</p>
                <p className="mt-2 text-xs font-semibold text-secondary-600">+14% this term</p>
              </div>
              <div className="rounded-2xl bg-primary-50 p-4">
                <p className="text-sm text-gray-500">Fee collection</p>
                <p className="mt-2 text-3xl font-black text-gray-900">92%</p>
                <p className="mt-2 text-xs font-semibold text-primary-600">On-time rate</p>
              </div>
            </div>

            <div className="sa-brand-gradient relative mt-5 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Today&apos;s activities</p>
                <span className="text-xs text-primary-300">2 mins ago</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {activities.map((item, i) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-primary-300">0{i + 1}</span>
                      <span className="text-sm text-gray-100">{item}</span>
                    </div>
                    <span className="text-xs font-semibold text-secondary-400">Done</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
