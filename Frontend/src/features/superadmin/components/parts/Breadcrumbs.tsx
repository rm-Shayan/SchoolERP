'use client';

import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

const iconCls = 'w-4 h-4 shrink-0';

function HomeIcon() {
  return (
    <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

function AcademicIcon() {
  return (
    <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zM12 14l9-5" />
    </svg>
  );
}

function resolveIcon(item: Crumb, isFirst: boolean, isLast: boolean): ReactNode {
  if (isFirst) return <HomeIcon />;
  if (isLast) return <AcademicIcon />;
  if (/organiz/i.test(item.label)) return <BuildingIcon />;
  if (/branch|school|institut/i.test(item.label)) return <AcademicIcon />;
  return <BuildingIcon />;
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm sa-fade-in" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const icon = resolveIcon(item, i === 0, last);

        const crumb = last ? (
          <span className="inline-flex items-center gap-1.5 max-w-[75vw] sm:max-w-none rounded-full bg-gradient-to-r from-primary-100 to-violet-100 px-3 py-1 font-semibold text-primary-800 ring-1 ring-inset ring-primary-200">
            {icon}
            <span className="break-words">{item.label}</span>
          </span>
        ) : item.to ? (
          <Link
            href={item.to}
            className="inline-flex items-center gap-1.5 max-w-[75vw] sm:max-w-none rounded-full px-3 py-1 font-medium text-gray-500 transition-all duration-200 hover:bg-primary-50 hover:text-primary-700"
          >
            {icon}
            <span className="break-words">{item.label}</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 max-w-[75vw] sm:max-w-none rounded-full px-3 py-1 font-medium text-gray-500">
            {icon}
            <span className="break-words">{item.label}</span>
          </span>
        );

        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && (
              <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {crumb}
          </span>
        );
      })}
    </nav>
  );
}
