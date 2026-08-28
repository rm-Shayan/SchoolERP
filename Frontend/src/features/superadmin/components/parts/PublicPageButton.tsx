'use client';

import { memo } from 'react';

const publicPageUrl = (slug: string) => `${window.location.origin}/o/${slug}`;

interface PublicPageButtonProps {
  slug: string;
  label?: string;
  variant?: 'text' | 'solid';
  themeColor?: string;
  className?: string;
}

function PublicPageButtonBase({ slug, label = 'View Public Page', variant = 'text', themeColor, className = '' }: PublicPageButtonProps) {
  const themed = variant === 'solid' && themeColor;
  const styles =
    themed
      ? 'inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 hover:shadow-lg transition-all duration-200'
      : variant === 'solid'
      ? 'inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-200/60 rounded-xl hover:bg-primary-100 hover:border-primary-300 hover:shadow-sm transition-all duration-200'
      : 'inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200';

  return (
    <button
      type="button"
      title={`Open public page ${publicPageUrl(slug)}`}
      aria-label={`Open public page ${publicPageUrl(slug)}`}
      style={themed ? { background: themeColor, boxShadow: `0 4px 14px ${themeColor}40` } : undefined}
      className={`${styles} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(publicPageUrl(slug), '_blank', 'noreferrer');
      }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {label}
    </button>
  );
}

const PublicPageButton = memo(PublicPageButtonBase);
export default PublicPageButton;
