const roles = [
  {
    title: 'For School Admins',
    body: 'Manage branches, staff, fees, and reporting from one secure command center.',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    accent: 'sa-tint-1',
  },
  {
    title: 'For Teachers',
    body: 'Track attendance, homework, conduct remarks, and schedule in minutes.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    accent: 'sa-tint-2',
  },
  {
    title: 'For Parents',
    body: 'Stay informed about performance, fees, attendance, and school notices.',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    accent: 'sa-tint-3',
  },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.06),_transparent_50%)]" />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">Why schools choose us</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          One platform, every stakeholder aligned
        </h2>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role.title} className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5">
            <div className={`mb-5 inline-flex rounded-2xl p-2.5 ${role.accent}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d={role.icon} />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-gray-500">{role.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
