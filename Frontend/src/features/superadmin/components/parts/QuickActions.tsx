'use client';

import { memo } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/features/shared/components';

const links = [
  {
    to: '/admin/organizations/new',
    title: 'New Organization',
    desc: 'Create a tenant + super admin',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    to: '/admin/import',
    title: 'Import from Excel',
    desc: 'Bulk-create organizations',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    to: '/admin/branches',
    title: 'Browse Branches',
    desc: 'All campuses across tenants',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/admin/activity',
    title: 'Activity Log',
    desc: 'Every privileged action across the platform',
    iconBg: 'sa-icon-amber',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const QuickActions = memo(function QuickActions() {
  return (
    <div className="sa-fade-in">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <SectionHeader
          title="Quick Actions"
          subtitle="Jump to common tasks"
          className="mb-4"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sa-stagger">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className="group relative flex min-w-0 items-start gap-3 rounded-xl border border-slate-200/80 p-3 transition-all hover:border-primary-200/60 hover:bg-primary-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sa-fade-in sa-ripple"
            >
              <div className={`p-2.5 rounded-2xl ${link.iconBg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md shrink-0`}>
                {link.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{link.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <svg
                className="ml-auto w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200 mt-1 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});

export default QuickActions;
