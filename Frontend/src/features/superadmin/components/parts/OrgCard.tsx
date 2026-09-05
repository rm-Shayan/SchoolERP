'use client';

import { memo } from 'react';
import Link from 'next/link';
import type { OrganizationOverviewItem } from '@/types';
import { Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { formatDate } from '@/lib/utils';
import { OrgStatusBadge } from './StatusBadge';
import PublicPageButton from './PublicPageButton';
import toast from 'react-hot-toast';

const orgLoginUrl = (org: OrganizationOverviewItem) => `${window.location.origin}/o/${org.slug}`;

interface OrgCardProps {
  org: OrganizationOverviewItem;
  blocking: boolean;
  onBlock: (org: OrganizationOverviewItem) => void;
  onUnblock: (org: OrganizationOverviewItem) => void;
}

const fmt = (n: number) => Number(n ?? 0).toLocaleString();
const rev = (n: number) => `Rs ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function OrgCardBase({ org, blocking, onBlock, onUnblock }: OrgCardProps) {
  const blocked = org.status === 'BLOCKED';

  return (
    <Link href={`/admin/organizations/${org.id}`} className="block h-full group/card">
      <div className="relative h-full rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(124,58,237,0.1)] hover:border-primary-300/50">
        {/* Gradient header */}
        <div className="relative h-20 bg-gradient-to-br from-violet-600 to-primary-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] pointer-events-none" />
          <div className="absolute top-3 right-3">
            <OrgStatusBadge status={org.status} />
          </div>
        </div>

        {/* Logo overlapping header */}
        <div className="relative -mt-8 px-5">
          <div className="inline-block rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/5">
            <Logo src={org.logoUrl} name={org.name} size="lg" />
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-3 pb-4">
          <h3 className="text-base font-bold text-gray-900 truncate group-hover/card:text-primary-700 transition-colors">{org.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {org.code} · <span className="font-mono text-primary-600">/o/{org.slug}</span>
          </p>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { value: fmt(org.schoolCount), label: 'Branches', color: 'text-violet-600 bg-violet-50' },
              { value: fmt(org.studentCount), label: 'Students', color: 'text-emerald-600 bg-emerald-50' },
              { value: fmt(org.userCount), label: 'Staff', color: 'text-sky-600 bg-sky-50' },
              { value: rev(org.revenue), label: 'Revenue', color: 'text-amber-600 bg-amber-50' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl ${s.color} px-2.5 py-2 text-center`}>
                <p className="text-sm font-bold tabular-nums">{s.value}</p>
                <p className="text-[10px] font-medium opacity-70">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3">
            <PublicPageButton slug={org.slug} label="Public" variant="text" />
            <button type="button" title="Copy login link"
              className="ml-auto rounded-lg p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                navigator.clipboard.writeText(orgLoginUrl(org))
                  .then(() => toast.success('Login link copied'))
                  .catch(() => toast.error('Failed to copy'));
              }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {blocked ? (
              <Button size="sm" variant="secondary" loading={blocking}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnblock(org); }}
                className="text-xs px-2.5 py-1">
                Unblock
              </Button>
            ) : (
              <Button size="sm" variant="outline" loading={blocking}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBlock(org); }}
                className="text-xs px-2.5 py-1">
                Block
              </Button>
            )}
          </div>

          <p className="mt-2 text-[10px] text-gray-400">Created {formatDate(org.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

const OrgCard = memo(OrgCardBase);
export default OrgCard;
