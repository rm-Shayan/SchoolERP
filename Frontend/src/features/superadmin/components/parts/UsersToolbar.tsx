'use client';

import { useEffect, useState } from 'react';
import { Input, Select } from '@/features/shared/components';
import { getRoleLabel } from '@/lib/utils';
import { ROLES } from './helpers';

interface UsersToolbarProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  reasonFilter: string;
  count: number;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReasonChange: (value: string) => void;
}

export default function UsersToolbar({
  search,
  roleFilter,
  statusFilter,
  reasonFilter,
  count,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReasonChange,
}: UsersToolbarProps) {
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(inputValue), 200);
    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start sm:items-end gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search name, email, username, org or branch…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {inputValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setInputValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            placeholder="All roles"
            options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            placeholder="All statuses"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Block reason"
            value={reasonFilter}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="All"
            options={[
              { value: 'WITH_REASON', label: 'Has reason' },
              { value: 'NO_REASON', label: 'No reason' },
            ]}
          />
        </div>
        <p className="text-sm text-gray-500 pb-2 shrink-0 tabular-nums">
          <span className="font-semibold text-gray-700">{count}</span> user(s)
        </p>
      </div>
    </div>
  );
}
