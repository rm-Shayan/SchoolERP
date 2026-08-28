'use client';

import { useState } from 'react';
import { Button, PageHeader } from '@/features/shared/components';
import { getApiErrorMessage } from '@/lib/utils';
import { feeService } from '@/lib/api';
import toast from 'react-hot-toast';

interface FeeRecordsHeaderProps {
  schoolId: string;
  dueDay: number;
  month: string;
  year: string;
  status: string;
  onEditDueDay: () => void;
  onGenerate: () => void;
  onPrintVouchers: () => void;
}

export default function FeeRecordsHeader({ schoolId, dueDay, month, year, status, onEditDueDay, onGenerate, onPrintVouchers }: FeeRecordsHeaderProps) {
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await feeService.exportCsv({ schoolId, month: Number(month), year: Number(year), status: status || undefined });
      toast.success('CSV downloaded');
    } catch (err) { toast.error(getApiErrorMessage(err, 'Export failed')); }
    finally { setExporting(false); }
  };

  return (
    <PageHeader
      title="Fee Records"
      description="Generate monthly vouchers, set due dates and extend per-student deadlines."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEditDueDay}
            className="!border-gray-200 hover:!border-primary-300">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Due Day: {dueDay}th
          </Button>
          <Button size="sm" variant="outline" loading={exporting} onClick={exportCsv}
            className="!border-gray-200 hover:!border-primary-300">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={onPrintVouchers}
            className="!border-gray-200 hover:!border-primary-300">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Vouchers
          </Button>
          <Button size="sm" onClick={onGenerate}
            className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 hover:from-primary-600 hover:via-primary-700 hover:to-primary-600 shadow-lg shadow-primary-200/50 !border-0">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Generate Vouchers
          </Button>
        </div>
      }
    />
  );
}
