'use client';

import { Input, Select } from '@/features/shared/components';
import StatusFilterChips from './StatusFilterChips';

interface BranchesFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  statusCounts: { active: number; blocked: number };
  orgFilter: string;
  onOrgFilterChange: (v: string) => void;
  orgOptions: { value: string; label: string }[];
}

export default function BranchesFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  orgFilter,
  onOrgFilterChange,
  orgOptions,
}: BranchesFilterBarProps) {
  return (
    <>
      <StatusFilterChips
        value={statusFilter}
        onChange={onStatusFilterChange}
        options={[
          { value: 'ACTIVE', label: 'Active', count: statusCounts.active },
          { value: 'BLOCKED', label: 'Blocked', count: statusCounts.blocked },
        ]}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name, code or org…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search branches"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            label="Organization"
            value={orgFilter}
            onChange={(e) => onOrgFilterChange(e.target.value)}
            placeholder="All organizations"
            options={orgOptions}
          />
        </div>
      </div>
    </>
  );
}
