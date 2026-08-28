'use client';

import type { ReactNode } from 'react';
import type { AuthVariant } from './AuthLayout';

interface AuthCenteredScreenProps {
  variant?: AuthVariant;
  brandIcon: ReactNode;
  brandLabel: string;
  brandSub: string;
  children: ReactNode;
}

export default function AuthCenteredScreen({
  brandIcon,
  brandLabel,
  brandSub,
  children,
}: AuthCenteredScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.10),_transparent_34%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-secondary-200/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-24 w-24 items-center justify-center drop-shadow-[0_10px_24px_rgba(15,23,42,0.22)] [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
            {brandIcon}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{brandSub}</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{brandLabel}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}
