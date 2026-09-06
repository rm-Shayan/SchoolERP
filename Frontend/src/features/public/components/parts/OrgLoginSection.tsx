'use client';

import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';
import { buildOrgLoginHref } from './orgLoginHref';

interface OrgLoginSectionProps {
  org: OrgPublicData;
  theme: string;
}

export default function OrgLoginSection({ org, theme }: OrgLoginSectionProps) {
  const href = buildOrgLoginHref(org);

  return (
    <section id="login" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex justify-center mb-4">
          <Logo src={org.logoUrl} name={org.name} size="lg" />
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ borderColor: `${theme}30`, backgroundColor: `${theme}08`, color: theme }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme }} />
          Portal Login
        </span>
        <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
          Sign in to your portal
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-500">
          Choose your role and sign in securely on {org.name}&apos;s login screen.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-[28px] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-900/5">
          <p className="text-sm font-semibold text-gray-900">Open the login screen</p>
          <p className="mt-1 text-sm text-gray-500">
            Full portal with school code, staff, parent &amp; student sign-in — theme and logo loaded for {org.name}.
          </p>
          <Link
            href={href}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-base font-bold text-white transition hover:brightness-110"
            style={{ backgroundColor: theme, boxShadow: `0 8px 32px ${theme}30` }}
          >
            Sign in to your portal
          </Link>
        </div>
      </div>
    </section>
  );
}