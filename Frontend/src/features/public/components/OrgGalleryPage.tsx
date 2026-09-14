'use client';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgSectionHeading from './parts/OrgSectionHeading';

const events = [
  { title: 'Annual Sports Day', tag: 'Sports', text: 'Inter-class athletics, fun races and a day full of energy on the field.' },
  { title: 'Science Exhibition', tag: 'Science', text: 'Students present working models, experiments and creative projects.' },
  { title: 'Arts & Crafts', tag: 'Creativity', text: 'Artwork, calligraphy and craft displays from every grade.' },
  { title: 'Independence Day', tag: 'National', text: 'Flag hoisting, speeches and cultural performances across the school.' },
  { title: 'Quran Recitation', tag: 'Religious', text: 'Tilawat competition encouraging excellence in Holy Quran recitation.' },
  { title: 'Parents Day', tag: 'Community', text: 'A class-by-class celebration where parents see their children shine.' },
  { title: 'Book Fair', tag: 'Reading', text: 'A week of reading challenges, storytelling and new books for every class.' },
  { title: 'Prize Distribution', tag: 'Achievement', text: 'Recognising academic excellence, attendance and outstanding conduct.' },
];

export default function OrgGalleryPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="School Life"
            title="Moments that make school feel like home"
            description="Sports, science, arts and celebrations â€” a glimpse into the vibrant day-to-day life on our campuses."
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <OrgSectionHeading
              eyebrow="Gallery"
              title="Life at "
              highlight={org.name}
              description="Events and milestones captured throughout the academic year â€” check back regularly for fresh updates."
              theme={theme}
            />

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((ev, i) => (
                <div
                  key={ev.title}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200/80 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/10"
                  style={{ background: `linear-gradient(150deg, ${theme}, ${theme}${i % 2 ? '99' : 'bb'})` }}
                >
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-[60px]" />
                  <div className="relative flex min-h-[180px] flex-col items-start justify-between">
                    <div>
                      <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                        {ev.tag}
                      </span>
                      <h3 className="mt-4 text-lg font-black text-white">{ev.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/85">{ev.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-center gap-4 rounded-[32px] border border-gray-100 bg-gray-50 p-10 text-center sm:p-14">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <Logo src={org.logoUrl} name={org.name} size="md" />
                </div>
                <p className="text-lg font-bold text-gray-900">{org.name}</p>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                Want to see the campus live? Book a visit and experience our classrooms, labs
                and playgrounds for yourself.
              </p>
              <Link
                href={`/o/${org.slug}/admission`}
                className="mt-2 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: theme }}
              >
                Book a campus visit
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}