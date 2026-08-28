import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';
import OrgSectionHeading from './OrgSectionHeading';

interface OrgAboutProps {
  org: OrgPublicData;
  theme: string;
}

const highlights = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Streamlined online admission process for parents' },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', text: 'Real-time attendance and fee tracking for staff' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', text: 'Dedicated parent portal with student updates' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Secure cloud platform managed by SchoolERP' },
];

export default function OrgAbout({ org, theme }: OrgAboutProps) {
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <OrgSectionHeading
            center={false}
            eyebrow="About Us"
            title="A modern learning campus, "
            highlight="built for your child's future"
            description={`${org.name} is committed to quality education through experienced teachers and a caring environment. Our campuses combine strong traditional values with modern technology to give every student the best possible start in life.`}
            theme={theme}
          />
          <ul className="mt-8 space-y-5">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-4">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
                  style={{ backgroundColor: theme, boxShadow: `0 8px 24px ${theme}33` }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </span>
                <span className="pt-1 text-sm leading-relaxed text-gray-700 sm:text-base">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-8 h-64 w-64 rounded-full blur-[80px]" style={{ backgroundColor: `${theme}25` }} />
          <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full blur-[60px]" style={{ backgroundColor: `${theme}15` }} />
          <div className="relative rounded-[32px] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-900/10 sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl" style={{ backgroundColor: theme }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <blockquote className="mt-8 text-xl font-bold leading-relaxed text-gray-900 sm:text-2xl">
              &ldquo;Our mission is to nurture curious minds, build strong character and
              prepare every student to succeed in a rapidly changing world.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-4 border-t border-gray-100 pt-7">
              <div className="rounded-2xl bg-gray-100 p-2">
                <Logo src={org.logoUrl} name={org.name} size="md" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{org.name}</p>
                <p className="text-xs text-gray-400">Our Mission &amp; Vision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
