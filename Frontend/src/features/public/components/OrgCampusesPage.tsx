'use client';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgSectionHeading from './parts/OrgSectionHeading';

export default function OrgCampusesPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="Our Campuses"
            title="Find the campus closest to you"
            description={`${org.name} operates ${org.branches.length} campus${org.branches.length === 1 ? '' : 'es'}. Each one brings the same quality education, caring teachers and digital-first experience.`}
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            {org.branches.length === 0 ? (
              <OrgSectionHeading
                eyebrow="Campuses"
                title="Coming soon"
                description="Campus details are being updated. Please check back soon."
                theme={theme}
              />
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {org.branches.map((b) => (
                  <div
                    key={b.id}
                    className="group relative overflow-hidden rounded-[32px] border border-gray-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/10 sm:p-10"
                  >
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundColor: `${theme}18` }} />
                    <div className="relative">
                      <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gray-100 p-2.5">
                          <Logo src={b.logoUrl || org.logoUrl} name={b.name} size="lg" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black text-gray-900">{b.name}</h3>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{b.code}</p>
                        </div>
                      </div>

                      <div className="mt-8 space-y-4">
                        {b.address && (
                          <p className="flex items-start gap-3 text-sm leading-relaxed text-gray-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{b.address}</span>
                          </p>
                        )}
                        {b.phone && (
                          <p className="flex items-center gap-3 text-sm text-gray-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {b.phone}
                          </p>
                        )}
                        {!b.address && !b.phone && (
                          <p className="text-sm text-gray-400">Campus contact details are being updated.</p>
                        )}
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/o/${org.slug}/admission`}
                          className="inline-flex rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
                          style={{ backgroundColor: theme }}
                        >
                          Apply at this campus
                        </Link>
                        <Link
                          href={`/o/${org.slug}/contact`}
                          className="inline-flex rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Contact us
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-16 flex items-center justify-between gap-6 rounded-3xl border border-gray-100 bg-gray-50 p-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Not sure which campus to choose?</h3>
                <p className="mt-1 text-sm text-gray-500">Our office team will guide you based on your area and your child&apos;s age.</p>
              </div>
              <Link
                href={`/o/${org.slug}/contact`}
                className="shrink-0 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Talk to us
              </Link>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}