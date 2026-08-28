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
      <div className="h-full bg-white rounded-2xl border border-gray-200/60 p-5 overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12),0_4px_12px_rgba(124,58,237,0.06)] hover:-translate-y-1 hover:border-primary-300/50">
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover/card:from-primary-50/30 group-hover/card:to-primary-100/10 transition-all duration-500 pointer-events-none rounded-2xl" />

        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="group-hover/card:scale-105 transition-transform duration-300">
              <Logo src={org.logoUrl} name={org.name} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 truncate font-bold text-gray-900 group-hover/card:text-primary-700 transition-colors">{org.name}</h3>
                <OrgStatusBadge status={org.status} />
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                Code: {org.code} · <span className="font-mono text-primary-600">/o/{org.slug}</span>
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { value: fmt(org.schoolCount), label: 'Branches', bg: 'bg-primary-50/80', text: 'text-primary-700' },
              { value: fmt(org.userCount), label: 'Staff', bg: 'bg-sky-50/80', text: 'text-sky-700' },
              { value: fmt(org.studentCount), label: 'Students', bg: 'bg-emerald-50/80', text: 'text-emerald-700' },
              { value: rev(org.revenue), label: 'Revenue', bg: 'bg-primary-50', text: 'text-primary-700' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl ${stat.bg} p-2.5 text-center transition-all duration-300 group-hover/card:scale-[1.02]`}>
                <p className={`text-base font-bold ${stat.text} tabular-nums`}>{stat.value}</p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100/80 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <p className="text-xs text-gray-400">Created {formatDate(org.createdAt)}</p>
              <PublicPageButton slug={org.slug} label="View Public Page" />
              <button
                type="button"
                title="Copy login link"
                aria-label="Copy login link"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard
                    .writeText(orgLoginUrl(org))
                    .then(() => toast.success('Login link copied'))
                    .catch(() => toast.error('Failed to copy link'));
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy link
              </button>
            </div>
            {blocked ? (
              <Button size="sm" variant="secondary" loading={blocking} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnblock(org); }}>
                Unblock
              </Button>
            ) : (
              <Button size="sm" variant="outline" loading={blocking} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBlock(org); }}>
                Block
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const OrgCard = memo(OrgCardBase);
export default OrgCard;
