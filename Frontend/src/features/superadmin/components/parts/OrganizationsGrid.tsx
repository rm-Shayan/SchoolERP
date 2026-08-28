'use client';

import { memo } from 'react';
import Link from 'next/link';
import { EmptyState, SectionHeader } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';
import type { OrganizationOverviewItem } from '@/types';
import PublicPageButton from './PublicPageButton';
import { prefetchOrganizationDetail } from './orgPrefetch';

const OrgCard = memo(function OrgCard({ org }: { org: OrganizationOverviewItem }) {
  return (
    <Link
      href={`/admin/organizations/${org.id}`}
      onMouseEnter={() => prefetchOrganizationDetail(org.id)}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 group/card sa-card-enter"
    >
      <div className="p-6 bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12),0_4px_12px_rgba(124,58,237,0.06)] hover:-translate-y-1 hover:border-primary-300/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer h-full relative overflow-hidden">
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover/card:from-primary-50/30 group-hover/card:to-primary-100/10 transition-all duration-500 pointer-events-none rounded-2xl" />

        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="group-hover/card:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-lg font-bold text-primary-600 shadow-sm group-hover/card:shadow-md transition-shadow duration-300">
                {org.name.charAt(0)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate group-hover/card:text-primary-700 transition-colors">{org.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">Code: {org.code}</p>
              <PublicPageButton slug={org.slug} label={`/o/${org.slug}`} className="mt-1" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100/80 grid grid-cols-3 gap-2 text-center">
            {[
              { value: org.schoolCount, label: 'Branches', bg: 'bg-violet-50/80', hoverBg: 'group-hover/card:bg-violet-100/60' },
              { value: org.studentCount, label: 'Students', bg: 'bg-emerald-50/80', hoverBg: 'group-hover/card:bg-emerald-100/60' },
              { value: org.userCount, label: 'Staff', bg: 'bg-sky-50/80', hoverBg: 'group-hover/card:bg-sky-100/60' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl ${stat.bg} ${stat.hoverBg} py-2 transition-all duration-300 group-hover/card:scale-[1.02]`}>
                <p className="text-base font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100/80 flex items-center justify-between text-xs text-gray-400">
            <span>Created {formatDate(org.createdAt)}</span>
            <span className="inline-flex items-center gap-1 text-primary-600 font-semibold group-hover/card:gap-1.5 transition-all">
              Open
              <svg className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

const emptyIcon = (
  <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

interface OrganizationsGridProps {
  organizations: OrganizationOverviewItem[];
}

export default function OrganizationsGrid({ organizations }: OrganizationsGridProps) {
  return (
    <>
      <SectionHeader
        title="Organizations"
        subtitle={`${organizations.length} tenant${organizations.length === 1 ? '' : 's'} on the platform`}
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        action={
          <Link href="/admin/organizations" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Manage all →
          </Link>
        }
      />
      {organizations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center shadow-sm">
          <EmptyState
            icon={emptyIcon}
            title="No Organizations Yet"
            description="Create your first organization to get started."
            action={
              <Link href="/admin/organizations/new" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                Create Organization
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </>
  );
}
