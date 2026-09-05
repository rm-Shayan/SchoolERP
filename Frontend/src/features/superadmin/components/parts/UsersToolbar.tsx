'use client';

import { useEffect, useState } from 'react';
import { Input, Select } from '@/features/shared/components';
import { useDebouncedValue } from '@/lib/utils';
import { getRoleLabel } from '@/lib/utils';
import { ROLES } from './helpers';
import OrgBranchFilter from './OrgBranchFilter';

interface UsersToolbarProps {
  search: string;
  typeFilter: string;
  roleFilter: string;
  statusFilter: string;
  orgFilter: string;
  branchFilter: string;
  count: number;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onOrgChange: (value: string) => void;
  onBranchChange: (value: string) => void;
}

export default function UsersToolbar({
  search, typeFilter, roleFilter, statusFilter,
  orgFilter, branchFilter, count,
  onSearchChange, onTypeChange, onRoleChange, onStatusChange,
  onOrgChange, onBranchChange,
}: UsersToolbarProps) {
  const [inputValue, setInputValue] = useState(search);
  const debouncedSearch = useDebouncedValue(inputValue, 200);

  useEffect(() => { onSearchChange(debouncedSearch); }, [debouncedSearch, onSearchChange]);

  useEffect(() => { setInputValue(search); }, [search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start sm:items-end gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search name, email, roll #…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          {inputValue && (
            <button type="button" aria-label="Clear" onClick={() => setInputValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="w-full sm:w-36">
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            placeholder="All"
            options={[
              { value: 'all', label: 'All' },
              { value: 'staff', label: 'Staff' },
              { value: 'student', label: 'Students' },
            ]}
          />
        </div>
        <OrgBranchFilter organizationId={orgFilter} schoolId={branchFilter} onOrgChange={onOrgChange} onBranchChange={onBranchChange} />
        {typeFilter !== 'student' && (
          <div className="w-full sm:w-44">
            <Select label="Role" value={roleFilter} onChange={(e) => onRoleChange(e.target.value)}
              placeholder="All roles" options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))} />
          </div>
        )}
        <div className="w-full sm:w-40">
          <Select label="Status" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}
            placeholder="All statuses" options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BLOCKED', label: 'Blocked' },
            ]} />
        </div>
        <p className="text-sm text-gray-500 pb-2 shrink-0 tabular-nums">
          <span className="font-semibold text-gray-700">{count}</span> total
        </p>
      </div>
    </div>
  );
}
