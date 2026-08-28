'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { getRoleHomePath } from '@/lib/utils';
import { useEffect, useState } from 'react';

const NON_ORG_SUBDOMAINS = ['www', 'app', 'portal'];

function detectOrgSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || !host.includes('.')) return null;
  const sub = host.split('.')[0];
  return sub && !NON_ORG_SUBDOMAINS.includes(sub) ? sub : null;
}

const portals = [
  {
    href: '/login',
    title: 'School / Branch Portal',
    description: 'Admins, teachers & receptionists — sign in with your School Code.',
    badge: 'Staff & teachers',
    iconBox: 'bg-secondary-100 text-secondary-700 group-hover:bg-secondary-600 group-hover:text-white',
    border: 'hover:border-secondary-300',
    arrow: 'group-hover:text-secondary-600',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/parent/login',
    title: 'Parent Portal',
    description: 'Parents sign in with School Code + school password to track attendance, fees, homework & notices.',
    badge: 'School Password',
    iconBox: 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white',
    border: 'hover:border-amber-300',
    arrow: 'group-hover:text-amber-600',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    href: '/admin/login',
    title: 'Platform Admin Console',
    description: 'Super Admins provisioning and managing every school & organization.',
    badge: 'Super admin only',
    iconBox: 'bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
    border: 'hover:border-primary-300',
    arrow: 'group-hover:text-primary-600',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function EntryRouter() {
  const router = useRouter();
  const { isAuthenticated, user, organization } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated && user) {
      router.replace(getRoleHomePath(user.role, user.organizationId, organization?.slug));
      return;
    }
    const orgSlug = detectOrgSlug();
    if (orgSlug) {
      router.replace(`/o/${encodeURIComponent(orgSlug)}`);
    }
  }, [isAuthenticated, user, organization, mounted, router]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.10),_transparent_34%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-secondary-200/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <img src="/screen.png" alt="SchoolERP" className="h-12 w-12 rounded-2xl object-contain shadow-lg shadow-primary-500/20 border border-primary-100/60 bg-white p-1" />
          <div className="text-left">
            <p className="text-lg font-bold tracking-tight text-slate-900">SchoolERP</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">School Management</p>
          </div>
        </Link>

        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-sm font-medium text-primary-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            Sign in to your workspace
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Choose your portal</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Portals are provisioned by your platform administrator. Pick the one that matches your role to continue.
          </p>
        </div>

        <div className="grid w-full gap-5 md:grid-cols-3">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className={`group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${portal.border}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${portal.iconBox}`}>
                  {portal.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {portal.badge}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{portal.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{portal.description}</p>
              <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors ${portal.arrow}`}>
                Continue
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Not sure which portal to use?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Start with the school login
          </Link>
        </p>
      </div>
    </div>
  );
}
