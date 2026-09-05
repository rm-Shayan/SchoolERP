'use client';

import { useState } from 'react';
import { admissionService } from '@/lib/api';
import type { AdmissionStatus } from '@/types';
import { Input, Select, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface AdmissionsToolbarProps {
  schoolId?: string;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: AdmissionStatus | '';
  onStatusChange: (v: AdmissionStatus | '') => void;
  classFilter: string;
  onClassChange: (v: string) => void;
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
  classes: { id: string; name: string }[];
  classesLoading?: boolean;
  total: number;
}

const STATUS_OPTIONS: { value: AdmissionStatus; label: string }[] = [
  { value: 'INQUIRY', label: 'Inquiry' },
  { value: 'TEST_SCHEDULED', label: 'Test Scheduled' },
  { value: 'TEST_PASSED', label: 'Test Passed' },
  { value: 'TEST_FAILED', label: 'Test Failed' },
  { value: 'FORM_SUBMITTED', label: 'Form Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'FEE_PENDING', label: 'Fee Pending' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function AdmissionsToolbar({
  schoolId,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  classFilter,
  onClassChange,
  from,
  onFromChange,
  to,
  onToChange,
  classes,
  classesLoading,
  total,
}: AdmissionsToolbarProps) {
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = statusFilter || classFilter || from || to;

  const handleExport = async () => {
    if (!schoolId) return;
    setExporting(true);
    try {
      await admissionService.exportCsv({
        schoolId,
        status: statusFilter || undefined,
        classId: classFilter || undefined,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      toast.success('CSV downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const clearAll = () => {
    onStatusChange('');
    onClassChange('');
    onFromChange('');
    onToChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search students, parents, phone…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            rightIcon={search ? (
              <button type="button" onClick={() => onSearchChange('')} className="p-1 rounded text-gray-400 hover:text-gray-600" aria-label="Clear">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : undefined}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 p-2.5 rounded-xl border transition-colors ${showFilters || hasFilters ? 'border-primary-300 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
        <Button size="sm" variant="outline" loading={exporting} onClick={handleExport}>Export</Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
          <Select placeholder="All statuses" value={statusFilter} onChange={(e) => onStatusChange((e.target.value || '') as AdmissionStatus | '')} options={STATUS_OPTIONS} className="w-full sm:w-40" />
          <Select placeholder="All classes" value={classFilter} onChange={(e) => onClassChange(e.target.value)} options={classes.map((c) => ({ value: c.id, label: c.name }))} loading={classesLoading} className="w-full sm:w-40" />
          <Input type="date" label="From" value={from} onChange={(e) => onFromChange(e.target.value)} className="w-full sm:w-36" />
          <Input type="date" label="To" value={to} onChange={(e) => onToChange(e.target.value)} className="w-full sm:w-36" />
          {hasFilters && (
            <button type="button" onClick={clearAll} className="text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap">Clear all</button>
          )}
          <span className="ml-auto text-xs text-gray-500 tabular-nums">{total} applicant{total === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
}
