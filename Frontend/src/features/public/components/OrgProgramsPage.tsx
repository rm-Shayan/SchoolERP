'use client';
import Link from 'next/link';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgSectionHeading from './parts/OrgSectionHeading';

const levels = [
  { name: 'Early Years', age: 'Ages 3â€“5', text: 'Play-based learning that builds confidence, curiosity and the joy of discovery.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5-1.253' },
  { name: 'Primary School', age: 'Grades 1â€“5', text: 'Strong foundations in literacy, numeracy and science with hands-on learning.', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
  { name: 'Middle School', age: 'Grades 6â€“8', text: 'Deeper subject mastery, critical thinking and character-building activities.', icon: 'M4 5a2 2 0 012-2 2 2 0 00-2 2 2 2 0 010 4 2 2 0 002 2 2 2 0 002-2 2 2 0 012-2 2 2 0 00-2-2 2 2 0 010-4m6 16a2 2 0 002-2 2 2 0 00-2 2 2 2 0 01-2 2' },
  { name: 'Secondary School', age: 'Grades 9â€“10', text: 'Exam-focused preparation with extra classes, tests and progress tracking.', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
];

const features = [
  { title: 'Smart Attendance', text: 'QR scanning at the gate keeps parents updated on arrivals instantly.' },
  { title: 'Online Homework', text: 'Assignments published online â€” students and parents always know what is due.' },
  { title: 'Transparent Fees', text: 'Clear fee records with reminders and easy online payment tracking.' },
  { title: 'Parent Portal', text: 'Attendance, results, circulars and conduct updates in one dashboard.' },
  { title: 'Exam Reports', text: 'Digitised results and progress reports shared securely to parents.' },
  { title: 'Live Circulars', text: 'Holidays, events and announcements reach every family in real time.' },
];

export default function OrgProgramsPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="Academics"
            title="Academic programs designed for every stage"
            description="From early years to secondary school, each stage is crafted to build knowledge, habits and confidence â€” all supported by a modern digital campus."
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <OrgSectionHeading
              eyebrow="Grade Levels"
              title="A clear path "
              highlight="of growth"
              description="Every grade level is supported by qualified teachers, structured assessments and real-time progress reports."
              theme={theme}
            />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {levels.map((lvl) => (
                <div key={lvl.name} className="group rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl hover:shadow-gray-900/8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                      <path fillRule="evenodd" d={lvl.icon} clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme }}>{lvl.age}</p>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{lvl.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{lvl.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <OrgSectionHeading
                eyebrow="Campus Experience"
                title="What makes learning "
                highlight="feel effortless"
                description="A technology-first campus keeps teachers, students and parents connected throughout the school day."
                theme={theme}
              />
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-5 rounded-3xl border border-gray-200/80 bg-white p-7">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: theme }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4 rounded-[32px] border border-gray-100 bg-white p-10 text-center shadow-xl shadow-gray-900/5 sm:p-14">
                <h3 className="text-2xl font-black text-gray-900 sm:text-3xl">Ready to join {org.name}?</h3>
                <p className="max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                  Admissions are open for the current session. Apply online in minutes â€” the office will reach out to guide you through the process.
                </p>
                <Link
                  href={`/o/${org.slug}/admission`}
                  className="mt-2 inline-flex rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                  style={{ backgroundColor: theme }}
                >
                  Start your application
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}