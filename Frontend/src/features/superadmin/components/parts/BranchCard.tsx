'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import type { School } from '@/types';
import { SchoolStatusBadge } from './StatusBadge';

interface BranchCardProps {
  school: School;
  deleting: boolean;
  onDelete: (school: School) => void;
  onEdit: (school: School) => void;
  onBlock: (school: School) => void;
  onUnblock: (school: School) => void;
}

function BranchCardBase({ school, deleting, onDelete, onEdit, onBlock, onUnblock }: BranchCardProps) {
  const blocked = school.status === 'BLOCKED';
  return (
    <Link href={`/admin/organizations/${school.organizationId}/schools/${school.id}`} className="group/card">
      <div className="relative h-full cursor-pointer overflow-hidden rounded-2xl border border-primary-700 bg-primary-700 p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-600 hover:shadow-md">

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="group-hover/card:scale-105 transition-transform duration-300">
                <Logo
                  src={school.logoUrl || school.organization?.logoUrl}
                  name={school.organization?.name ?? school.name}
                  size="sm"
                  className="shrink-0"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-bold text-white">{school.name}</h3>
                  <SchoolStatusBadge status={school.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-white/65">
                  {school.organization?.name ?? 'Unknown org'} · {school.code}
                </p>
                {blocked && school.blockedReason && (
                  <p className="text-[11px] text-red-600 mt-0.5 truncate" title={school.blockedReason}>
                    Reason: {school.blockedReason}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(school);
                }}
                className="rounded-xl p-1.5 text-white/55 transition-all hover:bg-white/10 hover:text-white"
                title="Edit Branch"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(school);
                }}
                disabled={deleting}
                className="rounded-xl p-1.5 text-white/55 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                title="Delete Branch"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { value: school._count?.students ?? 0, label: 'Students', bg: 'bg-white/10' },
              { value: school._count?.users ?? 0, label: 'Staff', bg: 'bg-white/10' },
              { value: school._count?.classes ?? 0, label: 'Classes', bg: 'bg-white/10' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl ${stat.bg} py-2.5 transition-all duration-300 group-hover/card:scale-[1.02]`}>
                <p className="text-base font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/15 pt-3">
            <Badge variant="info">{school.code}</Badge>
            <Button
              size="sm"
              variant={blocked ? 'secondary' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (blocked) onUnblock(school);
                else onBlock(school);
              }}
            >
              {blocked ? 'Unblock' : 'Block'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

const BranchCard = memo(BranchCardBase);
export default BranchCard;
