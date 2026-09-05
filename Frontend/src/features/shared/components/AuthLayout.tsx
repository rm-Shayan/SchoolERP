'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type AuthVariant } from './authLayoutTheme';
import BrandPanel from './parts/BrandPanel';

export type { AuthVariant };

interface AuthLayoutProps {
  variant?: AuthVariant;
  themeColor?: string;
  compact?: boolean;
  fullWidth?: boolean;
  brandIcon: ReactNode;
  brandLabel: string;
  brandSub: string;
  badge: string;
  heading: string;
  description: string;
  features: string[];
  children: ReactNode;
  footerNote?: ReactNode;
}

const cardMotion = {
  initial: { opacity: 0, y: 28, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function AuthLayout({
  variant = 'primary', themeColor, compact = false, fullWidth = false,
  brandIcon, brandLabel, brandSub, badge, heading, description, features, children, footerNote,
}: AuthLayoutProps) {
  const branded = Boolean(themeColor);

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-gray-50 via-slate-50 to-violet-50/30 px-4 sm:px-6 lg:px-8', compact ? 'py-4' : 'py-6 sm:py-10')}>
      {!fullWidth && (
        <>
          <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary-200/40 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-secondary-100/50 blur-[130px]" />
        </>
      )}

      <div className={cn('relative mx-auto flex w-full max-w-6xl flex-col justify-center', compact ? 'min-h-[calc(100vh-2rem)]' : 'min-h-[calc(100vh-4rem)]')}>
        <motion.div {...cardMotion} initial={false} className={cn(
          'grid w-full items-stretch',
          !fullWidth && 'overflow-hidden rounded-[24px] border border-gray-200/60 bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)]',
          fullWidth ? 'gap-0' : 'lg:grid-cols-[1.05fr_0.95fr]',
        )}>
          {!fullWidth && (
            <BrandPanel
              variant={variant} branded={branded} themeColor={themeColor} compact={compact}
              brandIcon={brandIcon} brandLabel={brandLabel} brandSub={brandSub}
              badge={badge} heading={heading} description={description} features={features}
            />
          )}

          <motion.div initial={false}
            className={cn(
              'flex flex-col justify-start p-6 sm:p-8 lg:p-10 lg:pt-12',
              fullWidth ? 'bg-white lg:col-span-2' : 'bg-white lg:border-l lg:border-gray-100',
            )}
          >
            <div className={cn('w-full', fullWidth ? 'max-w-2xl' : 'max-w-md')}>
              <MobileHeader branded={branded} compact={compact} brandIcon={brandIcon} brandSub={brandSub} brandLabel={brandLabel} themeColor={themeColor} />
              {children}
              {footerNote && <div className="mt-8 text-center text-sm">{footerNote}</div>}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function MobileHeader({ branded, compact, brandIcon, brandSub, brandLabel, themeColor }: {
  branded: boolean; compact: boolean;
  brandIcon: ReactNode; brandSub: string; brandLabel: string;
  themeColor?: string;
}) {
  return (
    <motion.div initial={false} className={cn('text-center lg:hidden', compact ? 'mb-4' : 'mb-6')}>
      {branded ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-gray-200">{brandIcon}</div>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-gray-900">{brandSub}</h2>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{brandLabel}</p>
          {themeColor && <div className="mx-auto mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: themeColor }} />}
        </>
      ) : (
        <div className="mx-auto flex justify-center [&_img]:h-20 [&_img]:w-auto [&_img]:object-contain [&_img]:bg-transparent">{brandIcon}</div>
      )}
    </motion.div>
  );
}
