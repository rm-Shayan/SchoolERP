'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import type { Organization, School } from '@/types';
import { SchoolStatusBadge } from './StatusBadge';

interface SchoolCardProps {
  org: Organization;
  school: School;
  onDelete: (school: School) => void;
  onBlock: (school: School) => void;
  onUnblock: (school: School) => void;
}

function SchoolCard({ org, school, onDelete, onBlock, onUnblock }: SchoolCardProps) {
  const blocked = school.status === 'BLOCKED';
  const counts = school._count;

  return (
    <div className="group/card relative overflow-hidden rounded-2xl border border-primary-700 bg-primary-700 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-20 bg-primary-700">
        <div className="absolute -bottom-6 left-5">
          <div className="rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5">
            <Logo src={school.logoUrl || org.logoUrl} name={school.name} size="sm" className="shrink-0" />
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <SchoolStatusBadge status={school.status} />
        </div>
      </div>

      <div className="pt-10 px-4 sm:px-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="truncate font-bold text-white">{school.name}</h3>
        <p className="mt-0.5 text-sm text-white/65">Code: {school.code}</p>
          </div>
          <Link href={`/admin/organizations/${org.id}/schools/${school.id}`} className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-primary-700 hover:bg-primary-50">Open</Link>
        </div>
        {(school.address || school.phone) && (
          <p className="mt-1 truncate text-xs text-white/55">{school.address || school.phone}</p>
        )}
        {blocked && school.blockedReason && (
          <p className="text-xs text-red-600 mt-1 truncate">Reason: {school.blockedReason}</p>
        )}

        {counts && (
          <div className="flex flex-wrap gap-2 mt-4">
            {counts.students != null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-primary-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                {counts.students} Students
              </span>
            )}
            {counts.users != null && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-primary-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {counts.users} Staff
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 border-t border-white/15 pt-4">
          <Link
            href={`/admin/organizations/${org.id}/schools/${school.id}`}
            className="rounded-xl p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
            title="Manage Branch"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Button
            size="sm"
            variant={blocked ? 'secondary' : 'danger'}
            className="ml-auto"
            onClick={() => (blocked ? onUnblock(school) : onBlock(school))}
          >
            {blocked ? 'Unblock' : 'Block'}
          </Button>
          <button
            onClick={() => onDelete(school)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
            title="Delete Branch"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SchoolCard);
