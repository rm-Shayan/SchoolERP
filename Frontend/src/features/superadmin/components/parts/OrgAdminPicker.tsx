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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    staffService
      .getAllPlatform({ role: 'ADMIN', status: 'ACTIVE', organizationId, pageSize: 100 })
      .then((r) => mounted && setAdmins(r.items))
      .catch(() => {
        if (mounted) {
          setAdmins([]);
          setError(true);
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [organizationId]);

  if (loading) {
    return <p className="text-xs text-gray-400 py-1">Loading organization admins…</p>;
  }
  if (error) {
    return <p className="text-xs text-red-500 py-1">Admins load nahi ho sakay — email khud type karein.</p>;
  }
  if (admins.length === 0) {
    return <p className="text-xs text-gray-400 py-1">Is organization me koi Active Admin nahi mila.</p>;
  }

  const sorted = [...admins].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500">Ya inme se kisi admin par click karein — email khud bhar jayega:</p>
      <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
        {sorted.map((u) => {
          const selected = value.toLowerCase() === u.email.toLowerCase();
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelect(u.email)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                selected ? 'bg-primary-50' : 'hover:bg-gray-50'
              )}
            >
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
  );
}