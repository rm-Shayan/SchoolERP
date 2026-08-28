'use client';
import Link from 'next/link';
import type { OrgPublicData } from '@/lib/api/orgService';

interface OrgAdmissionCtaProps {
  org: OrgPublicData;
  gradient: string;
}

export default function OrgAdmissionCta({ org, gradient }: OrgAdmissionCtaProps) {
  return (
    <section id="admission" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] px-6 py-16 text-center text-white shadow-2xl sm:px-16 sm:py-20"
        style={{ background: gradient }}
      >
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/[0.08] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-white/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[80px]" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Open Now
          </span>
          <h2 className="mt-8 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Ready to join <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">{org.name}</span>?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            Admissions are open for the 2026–27 session. Fill in a quick inquiry form and our
            office will get in touch with you shortly.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/o/${org.slug}/admission`}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-sm font-bold shadow-2xl shadow-black/15 transition-all duration-300 hover:scale-[1.03]"
              style={{ color: org.themeColor || '#2563eb' }}
            >
              Apply for Admission
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
            <a
              href="#login"
              className="inline-flex items-center rounded-full border border-white/30 px-10 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
