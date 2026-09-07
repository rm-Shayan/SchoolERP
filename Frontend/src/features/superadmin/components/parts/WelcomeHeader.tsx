'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/features/shared/components';

interface WelcomeHeaderProps {
  firstName?: string;
}

export default function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  // SSR-safe: date only after mount — server UTC and client PKT times differ,
  // otherwise the greeting/date text causes a hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const hour = now?.getHours() ?? -1;
  const greeting = hour < 0 ? '' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = firstName ?? 'Super Admin';
  const date = now
    ? now.toLocaleDateString('en-PK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '\u00A0';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-700 bg-primary-700 p-5 text-white shadow-sm sm:p-7 sa-fade-in">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 sa-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse sa-pulse-ring" />
            <span className="text-xs font-semibold text-white/90">Platform Online</span>
          </div>
          <p className="text-sm font-medium text-white/65">{date}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting},{' '}
            <span className="text-white">{name}</span>{' '}
            👋
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            Live overview of every organization, branch, student and staff account on the platform.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <Link href="/admin/import" className="block sm:inline-block">
            <Button
              size="sm"
              className="w-full border border-primary-300 bg-white text-primary-700 shadow-sm hover:bg-primary-50 sm:w-auto"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Excel
            </Button>
          </Link>
          <Link href="/admin/organizations/new" className="block sm:inline-block">
            <Button size="sm" className="w-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Organization
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
