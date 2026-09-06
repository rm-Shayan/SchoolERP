'use client';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import OrgFooterContact from './OrgFooterContact';
import type { OrgPublicData } from '@/lib/api/orgService';
import { buildOrgLoginHref } from './orgLoginHref';

interface OrgFooterProps {
  org: OrgPublicData;
  theme: string;
}

const exploreLinks = [
  { label: 'About', href: '#about' },
  { label: 'Programs', href: '#programs' },
  { label: 'Campuses', href: '#campuses' },
  { label: 'Admission', href: '#admission' },
];

const socialIcons: Record<string, { path: string; label: string }> = {
  facebookUrl: {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  instagramUrl: {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  twitterUrl: {
    label: 'Twitter',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  youtubeUrl: {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
};

export default function OrgFooter({ org, theme }: OrgFooterProps) {
  const count = org.branches.length;
  const hasSocial = org.facebookUrl || org.instagramUrl || org.twitterUrl || org.youtubeUrl;

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                <Logo src={org.logoUrl} name={org.name} size="md" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{org.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">{org.code}</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-500">
              Delivering quality education and a complete digital experience for students,
              parents and staff across {count} campus{count === 1 ? '' : 'es'}.
            </p>

            <OrgFooterContact org={org} />

            {/* Social links */}
            {hasSocial && (
              <div className="mt-5 flex items-center gap-3">
                {Object.entries(socialIcons).map(([key, { path, label }]) => {
                  const url = org[key as keyof OrgPublicData] as string | null;
                  if (!url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-all hover:border-gray-300 hover:text-gray-700 hover:shadow-md"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d={path} />
                      </svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Explore</h3>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sm text-gray-500 transition-colors hover:text-gray-900">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Portals</h3>
            <ul className="mt-5 space-y-3">
              <li><Link href={`/o/${org.slug}/admission`} className="text-sm text-gray-500 transition-colors hover:text-gray-900">Apply for Admission</Link></li>
              <li><Link href={buildOrgLoginHref(org)} className="text-sm text-gray-500 transition-colors hover:text-gray-900">Login</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Admissions</h3>
            <p className="mt-5 text-sm leading-relaxed text-gray-500">
              Admissions open for the 2026–27 session. Contact the school office to book a
              visit or start your application.
            </p>
            <Link
              href={`/o/${org.slug}/admission`}
              className="mt-5 inline-flex items-center rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
              style={{ backgroundColor: theme, boxShadow: `0 4px 16px ${theme}25` }}
            >
              Start Application
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-gray-200 pt-8 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {org.name}. All rights reserved.</p>
          <p>
            Powered by{' '}
            <Link href="/" className="font-semibold text-gray-600 transition-colors hover:text-gray-900">
              SchoolERP
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
