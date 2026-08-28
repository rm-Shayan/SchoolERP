'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { getRoleHomePath } from '@/lib/utils';
import { portals } from '@/lib/portals';

const NON_ORG_SUBDOMAINS = ['www', 'app', 'portal'];

function detectOrgSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || !host.includes('.')) return null;
  const sub = host.split('.')[0];
  return sub && !NON_ORG_SUBDOMAINS.includes(sub) ? sub : null;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user, organization } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated && user) {
      router.replace(getRoleHomePath(user.role, user.organizationId, organization?.slug));
      return;
    }
    const orgSlug = detectOrgSlug();
    if (orgSlug) router.replace(`/o/${encodeURIComponent(orgSlug)}`);
  }, [isAuthenticated, user, organization, mounted, router]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-primary-200/40 blur-[120px] portal-orb-drift" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-secondary-200/40 blur-[120px] portal-orb-drift-2" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/25 blur-[140px] portal-orb-drift" style={{ animationDelay: '5s' }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12">
        {/* Logo + brand */}
        <Link href="/" className="mb-10 flex items-center gap-4 pu-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl shadow-primary-500/20 border border-primary-100/60 bg-white p-1.5">
              <img
                src="/screen.png"
                alt="SchoolERP Logo"
                width={64}
                height={64}
                className="h-full w-full rounded-xl object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <span className="absolute -inset-1 rounded-[18px] animate-ping bg-primary-400 opacity-[0.08]" />
          </div>
          <div className="text-left">
            <p className="text-xl font-black tracking-tight text-slate-900">SchoolERP</p>
            <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-slate-400">School Management System</p>
          </div>
        </Link>

        {/* Heading */}
        <div className="mb-14 text-center pu-fade-up" style={{ animationDelay: '0.2s' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-semibold text-primary-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            Sign in to your workspace
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Choose your{' '}
            <span className="bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">portal</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-500">
            Portals are provisioned by your platform administrator. Pick the one that matches your role to continue.
          </p>
        </div>

        {/* Portal cards */}
        <div className="grid w-full gap-5 md:grid-cols-3">
          {portals.map((portal, i) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl portal-card-shimmer pu-fade-up"
              style={{ animationDelay: `${0.35 + i * 0.1}s` }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `0 0 40px ${portal.glowColor}, 0 0 80px ${portal.glowColor}` }} />
              <div className="relative flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${portal.iconBg}`}>
                  {portal.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors group-hover:bg-slate-200">
                  {portal.badge}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900 transition-colors group-hover:text-primary-700">{portal.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{portal.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors group-hover:text-primary-600">
                Continue
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500 pu-fade-up" style={{ animationDelay: '0.8s' }}>
          Not sure which portal to use?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Start with the school login
          </Link>
        </p>
      </div>
    </div>
  );
}
