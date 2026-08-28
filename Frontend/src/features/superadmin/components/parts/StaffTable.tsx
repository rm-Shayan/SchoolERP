'use client';

import { useMemo, useState } from 'react';
import { Card, Badge, Input, Select } from '@/features/shared/components';
import { cn, formatDate, getRoleLabel } from '@/lib/utils';
import type { OrgStaffRow } from '@/types';
import { ROLES } from './helpers';
import StaffMobileCards from './StaffMobileCards';

interface StaffTableProps {
  staff: OrgStaffRow[];
}

const STAFF_ROLES = ['ALL', ...ROLES];

const roleBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ADMIN: 'warning',
  RECEPTIONIST: 'default',
  TEACHER: 'success',
  SUPER_ADMIN: 'info',
};

const avatarTint: Record<string, string> = {
  ADMIN: 'from-amber-500 to-orange-500',
  RECEPTIONIST: 'from-slate-500 to-slate-600',
  TEACHER: 'from-emerald-500 to-teal-500',
  SUPER_ADMIN: 'from-violet-500 to-purple-500',
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

export default function StaffTable({ staff }: StaffTableProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.schoolName ?? '').toLowerCase().includes(q);
      const matchRole = role === 'ALL' || s.role === role;
      const matchStatus =
        status === 'ALL' || (status === 'BLOCKED' ? s.status === 'BLOCKED' : s.status === 'ACTIVE');
      return matchSearch && matchRole && matchStatus;
    });
  }, [staff, search, role, status]);

  const VISIBLE = 5;
  const shown = expanded ? filtered : filtered.slice(0, VISIBLE);

  return (
    <Card className="overflow-hidden sa-fade-in">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3 bg-gradient-to-r from-violet-50/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-violet-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">Staff Directory</h3>
            <p className="text-xs text-gray-400">{filtered.length} of {staff.length} members</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full lg:w-auto">
          <div className="relative w-full sm:w-60">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input className="pl-9" placeholder="Search name or branch…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-full sm:w-40"><Select value={role} onChange={(e) => setRole(e.target.value)} options={STAFF_ROLES.map((r) => ({ value: r, label: r === 'ALL' ? 'All roles' : getRoleLabel(r) }))} /></div>
          <div className="w-full sm:w-40"><Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'ALL', label: 'All statuses' }, { value: 'ACTIVE', label: 'Active' }, { value: 'BLOCKED', label: 'Blocked' }]} /></div>
        </div>
      </div>
      <div className="md:hidden"><StaffMobileCards staff={shown} /></div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Member</th>
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Role</th>
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Branch</th>
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Block reason</th>
              <th className="sticky top-0 bg-gray-50/95 backdrop-blur py-3 px-4 font-semibold text-xs uppercase tracking-wider">Join date</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s, i) => (
              <tr key={s.id} className={cn('border-b border-gray-50 transition-colors hover:bg-violet-50/40', i % 2 ? 'bg-gray-50/30' : 'bg-white')}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0', avatarTint[s.role] || 'from-slate-500 to-slate-600')}>
                      {initials(s.name)}
                    </div>
                    <span className="font-semibold text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><Badge variant={roleBadge[s.role] || 'default'}>{getRoleLabel(s.role)}</Badge></td>
                <td className="py-3 px-4 text-gray-600">{s.schoolName ?? '—'}</td>
                <td className="py-3 px-4"><span className="inline-flex items-center gap-1.5"><span className={cn('w-2 h-2 rounded-full', s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} /><Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>{s.status === 'ACTIVE' ? 'Active' : 'Blocked'}</Badge></span></td>
                <td className="py-3 px-4 text-gray-500 max-w-[240px]">
                  <span className="line-clamp-2" title={s.blockedReason ?? ''}>{s.blockedReason ?? '—'}</span>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(s.joinedAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-14 text-center text-sm text-gray-400">No staff match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > VISIBLE && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 text-center bg-gradient-to-r from-primary-50/40 to-transparent">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {expanded ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                Show less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                Show all {filtered.length} members
              </>
            )}
          </button>
        </div>
      )}
    </Card>
  );
}
