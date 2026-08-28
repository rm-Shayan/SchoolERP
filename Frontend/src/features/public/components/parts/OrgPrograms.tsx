import OrgSectionHeading from './OrgSectionHeading';

interface OrgProgramsProps {
  theme: string;
}

const programs = [
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    title: 'Online Admissions',
    description: 'Parents apply from home in minutes — no long queues, no paperwork.',
  },
  {
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    title: 'Smart Attendance',
    description: 'Daily attendance captured in real time and shared instantly with parents.',
  },
  {
    icon: 'M3 10h18M7 15h3m-6-9h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z',
    title: 'Fee Management',
    description: 'Transparent fee records, timely reminders and easy online payment tracking.',
  },
  {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    title: 'Homework & Tasks',
    description: 'Teachers assign homework online so students and parents stay informed.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Exams & Results',
    description: 'Conduct remarks and progress reports delivered right through the portal.',
  },
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    title: 'Parent Communication',
    description: 'Circulars, announcements and updates reach every parent instantly.',
  },
];

export default function OrgPrograms({ theme }: OrgProgramsProps) {
  return (
    <section id="programs" className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <OrgSectionHeading
          eyebrow="What We Offer"
          title="Everything your child needs "
          highlight="in one school"
          description="From the moment a parent applies to the last day of the session, our campuses keep every part of school life simple and connected."
          theme={theme}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl hover:shadow-gray-900/8"
            >
              <div
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"
                style={{ backgroundColor: `${theme}20` }}
              />
              <div className="relative">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${theme}10`, color: theme }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </span>
                <h3 className="mt-6 text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
