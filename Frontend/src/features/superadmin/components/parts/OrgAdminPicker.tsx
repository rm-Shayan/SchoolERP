'use client';

import { useEffect, useState } from 'react';
import { staffService } from '@/lib/api/staffService';
import type { User } from '@/types';
import { cn, getInitials } from '@/lib/utils';

interface OrgAdminPickerProps {
  organizationId: string;
  value: string;
  onSelect: (email: string) => void;
}

export default function OrgAdminPicker({ organizationId, value, onSelect }: OrgAdminPickerProps) {
  const [admins, setAdmins] = useState<User[]>([]);
  const [unassigned, setUnassigned] = useState<{ id: string; name: string; email: string; organizationId: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    const promises: Promise<any>[] = [
      // Always fetch unassigned admins (no org filter — shows all)
      staffService.getUnassignedAdmins().catch(() => []),
    ];

    // Only fetch org-specific admins if we have an organizationId
    if (organizationId) {
      promises.push(
        staffService.getAllPlatform({ role: 'ADMIN', status: 'ACTIVE', organizationId, pageSize: 100 })
          .then((r) => r.items)
          .catch(() => [])
      );
    }

    Promise.all(promises).then((results) => {
      if (!mounted) return;
      setUnassigned(results[0] || []);
      setAdmins(results[1] || []);
    }).catch(() => {
      if (mounted) { setAdmins([]); setUnassigned([]); setError(true); }
    }).finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [organizationId]);

  if (loading) {
    return <p className="text-xs text-gray-400 py-1">Loading admins…</p>;
  }
  if (error) {
    return <p className="text-xs text-red-500 py-1">Could not load admins — please type the email manually.</p>;
  }

  const sorted = [...admins].sort((a, b) => a.name.localeCompare(b.name));
  const hasAny = sorted.length > 0 || unassigned.length > 0;

  if (!hasAny) {
    return <p className="text-xs text-gray-400 py-1">No admins found. Create a new admin or type the email manually.</p>;
  }

  return (
    <div className="space-y-3">
      {unassigned.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-1.5">
            Unassigned Admins — not linked to any branch; select one:
          </p>
          <div className="max-h-36 overflow-y-auto border border-amber-200 bg-amber-50 rounded-lg divide-y divide-amber-100">
            {unassigned.map((u) => {
              const selected = value.toLowerCase() === u.email.toLowerCase();
              return (
                <button key={u.id} type="button" onClick={() => onSelect(u.email)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 text-left transition-colors', selected ? 'bg-amber-100' : 'hover:bg-amber-100/60')}>
                  <span className="h-7 w-7 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
                    {getInitials(u.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">{u.name}</span>
                    <span className="block text-xs text-amber-700 truncate">{u.email}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Unassigned</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Existing admins — click to select:
          </p>
          <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
            {sorted.map((u) => {
              const selected = value.toLowerCase() === u.email.toLowerCase();
              return (
                <button key={u.id} type="button" onClick={() => onSelect(u.email)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 text-left transition-colors', selected ? 'bg-primary-50' : 'hover:bg-gray-50')}>
                  <span className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {getInitials(u.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">{u.name}</span>
                    <span className="block text-xs text-gray-400 truncate">{u.email}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 truncate max-w-[9rem]">
                    {u.school?.name || '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
