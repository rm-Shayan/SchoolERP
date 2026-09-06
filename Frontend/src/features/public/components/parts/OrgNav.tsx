'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';
import { buildOrgLoginHref } from './orgLoginHref';

const sectionLinks = [
  { label: 'About', href: '#about' },
  { label: 'Programs', href: '#programs' },
  { label: 'Campuses', href: '#campuses' },
  { label: 'Admission', href: '#admission' },
];

interface OrgNavProps {
  org: OrgPublicData;
}

export default function OrgNav({ org }: OrgNavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const admissionHref = `/o/${org.slug}/admission`;
  const theme = org.themeColor || '#2563eb';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-gray-100/80'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href={`/o/${org.slug}`} onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
          <Logo src={org.logoUrl} name={org.name} size="sm" />
          <span className="truncate text-sm font-bold text-gray-900 sm:text-base">
            {org.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {sectionLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 transition-colors duration-200"
              style={{ color: theme }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme}0a`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={buildOrgLoginHref(org)}
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:inline-flex"
            style={{ color: theme }}
          >
            Sign In
          </Link>
          <Link
            href={admissionHref}
            className="hidden rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl sm:inline-flex"
            style={{
              backgroundColor: theme,
              boxShadow: `0 4px 14px ${theme}30`,
            }}
          >
            Apply Now
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 transition hover:bg-gray-50"
                style={{ color: theme }}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={buildOrgLoginHref(org)}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-3 font-bold transition hover:bg-gray-50"
              style={{ color: theme }}
            >
              Sign In
            </Link>
            <Link
              href={admissionHref}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-3 font-bold text-white transition"
              style={{ backgroundColor: theme }}
            >
              Apply for Admission
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
