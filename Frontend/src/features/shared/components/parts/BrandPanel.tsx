'use client';

import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { darkenHex, themes, type AuthVariant } from '../authLayoutTheme';

const CheckIcon = ({ branded }: { branded: boolean }) => (
  <svg className={cn('h-3 w-3 shrink-0', branded ? 'text-white/80' : 'text-primary-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

interface Props {
  variant: AuthVariant;
  branded: boolean;
  themeColor?: string;
  compact: boolean;
  brandIcon: ReactNode;
  brandLabel: string;
  brandSub: string;
  badge: string;
  heading: string;
  description: string;
  features: string[];
}

export default function BrandPanel({
  variant, branded, themeColor, compact,
  brandIcon, brandLabel, brandSub, badge,
  heading, description, features,
}: Props) {
  const t = themes[variant];
  const hasDarkBg = Boolean(themeColor);

  return (
    <div
      className={cn(
        'relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-6 xl:p-8',
        compact ? 'lg:min-h-[480px]' : 'lg:min-h-[580px]',
        !hasDarkBg && 'bg-gradient-to-b from-gray-50/70 via-white to-primary-50/40',
      )}
      style={themeColor ? { background: `linear-gradient(135deg, ${themeColor}, ${darkenHex(themeColor) ?? themeColor})` } : undefined}
    >
      {!hasDarkBg && <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" />}
      <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10">
        <motion.div variants={item} className="mb-4 sm:mb-6">
          {branded ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/10">
                {brandIcon}
              </div>
              <div className="min-w-0">
                {brandLabel && (
                  <p className={cn('truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.24em]', t.brandSubText)}>{brandLabel}</p>
                )}
                <p className="mt-0.5 truncate text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">{brandSub}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center [&_img]:w-24 sm:[&_img]:w-28 [&_img]:h-auto [&_img]:object-contain [&_img]:bg-transparent">{brandIcon}</div>
          )}
        </motion.div>

        <motion.span variants={item} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]', hasDarkBg ? t.badge : 'border-primary-200/60 bg-primary-50/80 text-primary-700')}>
          {badge}
        </motion.span>
        <motion.h1 variants={item} className={cn('mt-3 sm:mt-5 max-w-md text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-snug tracking-tight', hasDarkBg ? 'text-white' : 'text-gray-900')}>{heading}</motion.h1>
        <motion.p variants={item} className={cn('mt-2 sm:mt-3 max-w-md text-[14px] sm:text-[15px] leading-relaxed', hasDarkBg ? t.descriptionText : 'text-gray-500')}>{description}</motion.p>

        <motion.div variants={item} className="mt-5 sm:mt-8 flex flex-wrap gap-2">
          {features.map((feature) => (
            <span key={feature} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-[12px] sm:text-[13px] font-medium backdrop-blur-sm', hasDarkBg ? t.featureChip : 'border-gray-200 bg-white/80 text-gray-600')}>
              <CheckIcon branded={hasDarkBg} />{feature}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
