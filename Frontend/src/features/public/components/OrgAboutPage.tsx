'use client';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgSectionHeading from './parts/OrgSectionHeading';

const values = [
  { title: 'Excellence', text: 'We hold every student to high standards and give them the support to achieve.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { title: 'Integrity', text: 'Honesty, respect and responsibility shape everything we do on campus.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { title: 'Innovation', text: 'Modern classrooms, smart tools and forward-thinking teaching methods.', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { title: 'Care', text: 'Every child is known, valued and guided by caring, qualified teachers.', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

export default function OrgAboutPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="About Us"
            title={`Learning that shapes character and ambition at ${org.name}`}
            description="We blend strong academic foundations with modern technology, so every child grows with confidence, curiosity and care."
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <OrgSectionHeading
                  center={false}
                  eyebrow="Our Story"
                  title="A campus built around "
                  highlight="the whole child"
                  description="Since our founding, we have focused on one mission: prepare young minds for a fast-changing world while keeping strong values at the heart of school life."
                  theme={theme}
                />
                <p className="mt-6 text-base leading-relaxed text-gray-600">
                  {org.name} runs {org.branches.length} campus
                  {org.branches.length === 1 ? '' : 'es'} that combine disciplined academics,
                  co-curricular growth and a caring community. Parents stay informed in real
                  time through our digital portal â€” attendance, fees, homework and exam results.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/o/${org.slug}/admission`}
                    className="rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
                    style={{ backgroundColor: theme }}
                  >
                    Apply for Admission
                  </Link>
                  <Link
                    href={`/o/${org.slug}/contact`}
                    className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Get in touch
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full blur-[90px]" style={{ backgroundColor: `${theme}22` }} />
                <div className="relative rounded-[32px] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-900/10 sm:p-10">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-gray-100 p-2.5">
                      <Logo src={org.logoUrl} name={org.name} size="lg" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900">{org.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{org.code}</p>
                    </div>
                  </div>
                  <p className="mt-8 text-xl font-bold leading-relaxed text-gray-800 sm:text-2xl">
                    &ldquo;Education is not the filling of a pail, but the lighting of a fire â€”
                    and at {org.name}, we keep that flame alive every single day.&rdquo;
                  </p>
                  <div className="mt-8 border-t border-gray-100 pt-6 text-sm text-gray-500">
                    â€” The Principal&apos;s Message
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <OrgSectionHeading
                eyebrow="Our Values"
                title="The principles that "
                highlight="guide us"
                description="Four commitments shape every classroom, every conversation and every decision on our campuses."
                theme={theme}
              />
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {values.map((v) => (
                  <div key={v.title} className="rounded-3xl border border-gray-200/80 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/8">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                      </svg>
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-gray-900">{v.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}