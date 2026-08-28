'use client';

import Link from 'next/link';
import type { Organization, School } from '@/types';
import { Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { formatDate } from '@/lib/utils';
import { SchoolStatusBadge } from './StatusBadge';

interface SchoolHeaderProps {
  org: Organization;
  school: School;
  deleting: boolean;
  blocking: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export default function SchoolHeader({ org, school, deleting, blocking, onEdit, onDelete, onBlock, onUnblock }: SchoolHeaderProps) {
  const blocked = school.status === 'BLOCKED';

  const Chip = ({ label, value }: { label: string; value: string }) => (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 truncate max-w-[160px]">{value}</span>
    </span>
  );

  return (
    <div className="bg-white rounded-2xl border border-primary-100 shadow-[0_18px_50px_rgba(76,29,149,0.12)] overflow-hidden sa-fade-in">
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary-950 via-primary-700 to-primary-500">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_60%)]" />
      </div>
      <div className="px-4 sm:px-7 pb-6 -mt-12 relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4 min-w-0">
            <div className="shrink-0 rounded-2xl bg-white p-2 shadow-xl ring-4 ring-white/60">
              <Logo src={school.logoUrl || org.logoUrl} name={school.name} size="lg" />
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">{school.name}</h1>
                <SchoolStatusBadge status={school.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <Chip label="Org" value={org.name} />
                <Chip label="Code" value={school.code} />
                {school.address && <Chip label="Address" value={school.address} />}
                <Chip label="Created" value={formatDate(school.createdAt)} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:pb-1">
            <Button variant="outline" size="sm" onClick={onEdit} className="rounded-xl border-primary-300 text-primary-700 hover:bg-primary-50">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Link
              href={`/admin/organizations/${org.id}`}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-primary-700 border border-primary-200 bg-primary-50/40 hover:bg-primary-100/60"
            >
              Back to {org.name}
            </Link>
            {blocked ? (
              <Button variant="secondary" size="sm" loading={blocking} onClick={onUnblock}>Unblock Branch</Button>
            ) : (
              <Button variant="danger" size="sm" loading={blocking} onClick={onBlock}>Block Branch</Button>
            )}
            <Button variant="danger" size="sm" loading={deleting} onClick={onDelete}>Delete Branch</Button>
          </div>
        </div>
        {blocked && school.blockedReason && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            Block reason: {school.blockedReason}
          </p>
        )}
      </div>
    </div>
  );
}
