'use client';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';
import OrgSectionHeading from './OrgSectionHeading';

interface OrgCampusesProps {
  org: OrgPublicData;
  theme: string;
}

export default function OrgCampuses({ org, theme }: OrgCampusesProps) {
  const count = org.branches.length;

  return (
    <section id="campuses" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <OrgSectionHeading
          eyebrow="Our Campuses"
          title={`${count} campus${count === 1 ? '' : 'es'} of `}
          highlight={org.name}
          description="Find the campus closest to you and begin the admission journey today."
          theme={theme}
        />

        {count === 0 ? (
          <p className="mt-14 text-center text-sm text-gray-400">
            Campus details are being updated. Please check back soon.
          </p>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {org.branches.map((b) => (
              <div
                key={b.id}
                className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl hover:shadow-gray-900/8"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundColor: `${theme}15` }} />
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-gray-100 p-2.5 transition-transform duration-300 group-hover:scale-110">
                      <Logo src={b.logoUrl || org.logoUrl} name={b.name} size="md" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-gray-900">{b.name}</h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">{b.code}</p>
                    </div>
                  </div>

                  {b.address && (
                    <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-gray-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{b.address}</span>
                    </p>
                  )}
                  {b.phone && (
                    <p className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {b.phone}
                    </p>
                  )}

                  <Link
                    href={`/o/${org.slug}/admission`}
                    className="mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    style={{ backgroundColor: theme, boxShadow: `0 4px 16px ${theme}25` }}
                  >
                    Apply at this campus
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
