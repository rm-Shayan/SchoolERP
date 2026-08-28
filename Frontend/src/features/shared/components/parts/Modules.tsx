const modules = [
  { title: 'School dashboard', desc: 'Full visibility for principals', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { title: 'Teacher tracking', desc: 'Attendance and lesson plans', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { title: 'Fee collection', desc: 'Online payments and reminders', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { title: 'Student & parent portals', desc: 'Role-based access for all', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { title: 'Transport & gate', desc: 'Bus tracking and gate attendance', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { title: 'Exams & analytics', desc: 'Reports, results, and insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export default function Modules() {
  return (
    <section id="modules" className="relative overflow-hidden py-24 text-white">
      <div className="sa-brand-gradient absolute inset-0" />
      <div className="pointer-events-none absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-white/8 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-300">Platform modules</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              A complete school management experience from intake to graduation.
            </h2>
            <p className="mt-5 max-w-xl text-slate-300 leading-relaxed">
              Whether you run a single campus or multiple branches, SchoolERP helps each team move faster with a shared source of truth.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((item) => (
              <div key={item.title} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-primary-300/40 hover:bg-white/[0.08]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-primary-300 transition-colors group-hover:bg-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d={item.icon} />
                  </svg>
                </div>
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
