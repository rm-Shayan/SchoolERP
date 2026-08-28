'use client';

import { useState } from 'react';
import { admissionService } from '@/lib/api';
import type { AdmissionStatus } from '@/types';
import { Input, Select, Card, Button } from '@/features/shared/components';
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

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by student or parent name, phone…"
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
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <Select
              placeholder="All statuses"
              value={statusFilter}
              onChange={(e) => onStatusChange((e.target.value || '') as AdmissionStatus | '')}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="All classes"
              value={classFilter}
              onChange={(e) => onClassChange(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              loading={classesLoading}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex items-center gap-2">
            <Input type="date" label="From" value={from} onChange={(e) => onFromChange(e.target.value)} />
            <Input type="date" label="To" value={to} onChange={(e) => onToChange(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-500">{total} applicant{total === 1 ? '' : 's'}</span>
            <Button size="sm" variant="outline" loading={exporting} onClick={handleExport}>Export CSV</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
