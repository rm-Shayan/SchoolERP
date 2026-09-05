'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState, Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { formatDate } from '@/lib/utils';
import type { OrganizationOverviewItem } from '@/types';
import { OrgStatusBadge } from './StatusBadge';
import PublicPageButton from './PublicPageButton';
import { prefetchOrganizationDetail } from './orgPrefetch';

type SortKey = 'name' | 'code' | 'schoolCount' | 'userCount' | 'studentCount' | 'revenue' | 'createdAt';

interface OrganizationsTableProps {
  orgs: OrganizationOverviewItem[];
  search: string;
  blocking: boolean;
  onBlock: (org: OrganizationOverviewItem) => void;
  onUnblock: (org: OrganizationOverviewItem) => void;
}

const COLUMNS: { key: SortKey; label: string; sortable: boolean }[] = [
  { key: 'name', label: 'Organization', sortable: true },
  { key: 'code', label: 'Code', sortable: true },
  { key: 'schoolCount', label: 'Branches', sortable: true },
  { key: 'userCount', label: 'Staff', sortable: true },
  { key: 'studentCount', label: 'Students', sortable: true },
  { key: 'revenue', label: 'Revenue', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];

export default function OrganizationsTable({ orgs, search, blocking, onBlock, onUnblock }: OrganizationsTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const rows = [...orgs];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''));
      return dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [orgs, sortKey, dir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('asc');
    }
  };

  if (orgs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm">
        <EmptyState
          title={search ? 'No matching organizations' : 'No organizations yet'}
          description={search ? 'Try a different search term.' : 'Create your first organization.'}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-500">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-primary-600"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
              <th className="py-3.5 px-4 text-[10px] font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((org) => {
              const blocked = org.status === 'BLOCKED';
              return (
                <tr
                  key={org.id}
                  className="cursor-pointer border-b border-slate-100 transition-all duration-200 hover:bg-primary-50/30 hover:shadow-sm"
                  onClick={() => router.push(`/admin/organizations/${org.id}`)}
                  onMouseEnter={() => prefetchOrganizationDetail(org.id)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Logo src={org.logoUrl} name={org.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{org.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">{org.code}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold tabular-nums">{org.schoolCount}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold tabular-nums">{org.userCount}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold tabular-nums">{org.studentCount}</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-primary-700 font-semibold text-xs">
                    {Number(org.revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-xs">{formatDate(org.createdAt)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <OrgStatusBadge status={org.status} />
                      <PublicPageButton slug={org.slug} label="Page" />
                      <Button size="sm" variant={blocked ? 'secondary' : 'outline'} loading={blocking}
                        onClick={(e) => { e.stopPropagation(); blocked ? onUnblock(org) : onBlock(org); }}>
                        {blocked ? 'Unblock' : 'Block'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
