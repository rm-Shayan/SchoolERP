'use client';

import Link from 'next/link';
import type { SchoolBranding } from '@/types';

interface ForgotPasswordLinkProps {
  branding?: SchoolBranding | null;
  schoolCode?: string;
  className?: string;
}

function buildHref(branding: SchoolBranding | null | undefined, schoolCode?: string): string {
  const params = new URLSearchParams();
  if (branding?.slug) params.set('org', branding.slug);
  const code = schoolCode?.trim();
  if (code) params.set('school', code);
  const qs = params.toString();
  return qs ? `/forgot-password?${qs}` : '/forgot-password';
}

export default function ForgotPasswordLink({ branding, schoolCode, className }: ForgotPasswordLinkProps) {
  const themeColor = branding?.themeColor;
  return (
    <Link
      href={buildHref(branding, schoolCode)}
      className={`text-xs font-semibold shrink-0 transition hover:opacity-80 ${className ?? ''}`.trim()}
      style={themeColor ? { color: themeColor } : undefined}
    >
      Forgot password?
    </Link>
  );
}