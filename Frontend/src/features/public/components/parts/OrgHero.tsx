'use client';
import { useState } from 'react';
import Link from 'next/link';
import OrgHeroVisual from './OrgHeroVisual';
import type { OrgPublicData } from '@/lib/api/orgService';

interface OrgHeroProps {
  org: OrgPublicData;
  gradient: string;
}

export default function OrgHero({ org, gradient }: OrgHeroProps) {
  const theme = org.themeColor || '#2563eb';
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/o/${org.slug}`)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden text-white" style={{ background: gradient }}>
      {/* Mesh + grid texture */}
      <div className="pu-drift pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-white/[0.08] blur-[130px]" />
      <div className="pu-drift pointer-events-none absolute -bottom-48 -right-40 h-[640px] w-[640px] rounded-full bg-white/[0.06] blur-[150px] [animation-delay:4s]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '42px 42px' }}
      />

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:pt-16">
        {/* Left content */}
        <div className="pu-fade-up max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2 pr-4 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md">
            <span className="pu-pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
            Admissions Open 2026–27
          </div>

          <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            Welcome to
            <span className="block bg-gradient-to-r from-white via-white/90 to-white/55 bg-clip-text text-transparent">
              {org.name}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            A complete digital campus — online admissions, live attendance, fees and
            parent communication, all beautifully connected in one place.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href={`/o/${org.slug}/admission`}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-[1.03]"
              style={{ color: theme }}
            >
              Apply for Admission
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
            <a
              href="#login"
              className="inline-flex items-center rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10"
            >
              Sign In
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-4 text-sm font-medium text-white/85 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/15 pt-6 text-sm text-white/55">
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Cloud-secured
            </span>
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              24/7 access
            </span>
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {org.branches.length} campus{org.branches.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {/* Right — product visual */}
        <OrgHeroVisual org={org} theme={theme} />
      </div>
    </section>
  );
}
