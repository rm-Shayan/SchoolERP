const featureCards = [
  {
    title: 'Admissions & Enrollment',
    description: 'Automate inquiries, online forms, student onboarding, and fee confirmation from a single portal.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    title: 'Attendance Tracking',
    description: 'Capture attendance with QR or manual checks and keep guardians informed in real time.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Fee Management',
    description: 'Create fee structures, collect online payments, and track outstanding dues without spreadsheets.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Classroom & Homework',
    description: 'Plan lessons, assign homework, and monitor classroom progress with smart academic workflows.',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    title: 'Parent Communication',
    description: 'Keep parents informed through digital notices, progress updates, and event communication.',
    icon: 'M8 10h8M8 14h5m6 7H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z',
  },
  {
    title: 'Reports & Insights',
    description: 'Track performance across sections, staff, admissions, and finances using live dashboards.',
    icon: 'M4 19h16M7 16V8m5 8V5m5 11v-6',
  },
];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={path} />
    </svg>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.04),_transparent_50%)]" />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">Everything in one place</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Built for the way schools actually operate
        </h2>
        <p className="mt-4 text-base text-gray-500">One platform covering every aspect of school management.</p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature, i) => (
          <div key={feature.title} className="group rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-600/10">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${`sa-tint-${(i % 4) + 1}`}`}>
              <Icon path={feature.icon} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-gray-900">{feature.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-gray-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
