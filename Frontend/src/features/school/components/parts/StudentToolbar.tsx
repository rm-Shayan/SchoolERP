'use client';

import { useMemo } from 'react';
import { Card, Input, Select } from '@/features/shared/components';
import type { Class } from '@/types';
import { STATUS_OPTIONS } from './helpers';

interface StudentToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sectionFilter: string;
  onSectionChange: (value: string) => void;
  classes: Class[];
  classesLoading?: boolean;
  resultCount: number;
}

export function StudentToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sectionFilter,
  onSectionChange,
  classes,
  classesLoading,
  resultCount,
}: StudentToolbarProps) {
  const sectionOptions = useMemo(
    () =>
      classes.flatMap((c) =>
        (c.sections ?? []).map((s) => ({ value: s.id, label: `${c.name} — ${s.name}` }))
      ),
    [classes]
  );

  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search by name, roll # or QR code..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            rightIcon={
              search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : undefined
            }
          />
        </div>
        <div className="grid grid-cols-2 lg:flex gap-3">
          <Select
            className="h-11 lg:w-48"
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          />
          <Select
            className="h-11 lg:w-56"
            placeholder="All sections"
            options={sectionOptions}
            value={sectionFilter}
            onChange={(e) => onSectionChange(e.target.value)}
            loading={classesLoading}
          />
        </div>
        <p className="text-sm text-gray-500 whitespace-nowrap tabular-nums">
          <span className="font-semibold text-gray-900">{resultCount}</span> student{resultCount === 1 ? '' : 's'}
        </p>
      </div>
    </Card>
  );
}
