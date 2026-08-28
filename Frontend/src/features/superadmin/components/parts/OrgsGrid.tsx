'use client';

import Link from 'next/link';
import type { OrganizationOverviewItem } from '@/types';
import { EmptyState } from '@/features/shared/components';
import OrgCard from './OrgCard';

interface OrgsGridProps {
  orgs: OrganizationOverviewItem[];
  search: string;
  blocking: boolean;
  onBlock: (org: OrganizationOverviewItem) => void;
  onUnblock: (org: OrganizationOverviewItem) => void;
}

function OrgsGrid({ orgs, search, blocking, onBlock, onUnblock }: OrgsGridProps) {
  if (orgs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm">
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title={search ? 'No matching organizations' : 'No organizations yet'}
          description={
            search
              ? `Nothing matches "${search}". Try a different search term.`
              : 'Create your first organization to start managing branches and staff.'
          }
          action={
            !search ? (
              <Link href="/admin/organizations/new" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                Create Organization
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 sa-stagger">
      {orgs.map((org) => (
        <OrgCard key={org.id} org={org} blocking={blocking} onBlock={onBlock} onUnblock={onUnblock} />
      ))}
    </div>
  );
}

export default OrgsGrid;
