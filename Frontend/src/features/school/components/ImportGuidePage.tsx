'use client';

import { useEffect, useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Button } from '@/features/shared/components';
import { staffService, staffAttendanceService } from '@/lib/api';
import ImportSteps from './parts/ImportSteps';
import TemplateTable from './parts/TemplateTable';
import { TAB_META, TIPS, COLUMNS_BY_TYPE, ImportType } from './parts/importColumns';
import { downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

const SAMPLE_ROWS: Record<ImportType, string> = {
  students: 'Ahmed,Khan,Class 5,A,101,03001234567,Male,2012-05-15,Mr. Khan,03009876543,khan@email.com,123 Main St',
  staff: 'Mr. Ahmed Khan,ahmed@school.edu,03001234567,TEACHER',
  'staff-attendance': 'Mr. Ahmed Khan,ahmed@school.edu,2026-08-27,PRESENT,Late by 10 mins',
  timetable: 'Monday,Mathematics,Mr. Ahmed Khan,08:00,08:45,Class 5 - A',
  admissions: 'Ahmed,Khan,Class 5,Mr. Khan,03001234567,03001234567,khan@email.com,2012-05-15,Male,5000',
};

export default function ImportGuidePage() {
  const { isAdmin } = useRoleAccess();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ImportType>('students');
  useEffect(() => {
    if (isAdmin) return;
    router.replace('/branch/dashboard');
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const columns = COLUMNS_BY_TYPE[activeTab];
  const requiredCount = columns.filter((c) => c.req).length;

  const handleDownload = async () => {
    try {
      if (activeTab === 'staff') {
        const blob = await staffService.downloadImportTemplate();
        downloadBlob(blob, 'staff-import-template.xlsx');
      } else if (activeTab === 'staff-attendance') {
        const res = await staffAttendanceService.downloadImportTemplate();
        downloadBlob(new Blob([res.data], { type: 'application/vnd.ms-excel' }), 'staff-attendance-template.xlsx');
      } else {
        const header = columns.map((c) => c.col).join(',');
        const csv = `${header}\n${SAMPLE_ROWS[activeTab]}`;
        downloadBlob(new Blob([csv], { type: 'text/csv' }), `${activeTab}-import-sample.csv`);
      }
      toast.success(`${TAB_META[activeTab].label} sample downloaded`);
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Guide"
        description="Understand the Excel format, download a sample template, and start bulk importing."
      />

      <ImportSteps />

      <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {(Object.keys(TAB_META) as ImportType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_META[tab].label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{TAB_META[activeTab].label} Import Format</h2>
            <p className="text-xs text-gray-500 mt-0.5">{columns.length} cols — <span className="font-medium text-red-600">{requiredCount} required</span>, {columns.length - requiredCount} optional</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload} className="shrink-0">Download Sample</Button>
        </div>

        <TemplateTable columns={columns} />

        <div className="mt-5 rounded-xl bg-primary-50 border border-primary-100 p-4">
          <p className="text-xs font-semibold text-primary-800 uppercase tracking-wide mb-2">Tips</p>
          <ul className="space-y-1.5">
            {TIPS[activeTab].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-primary-900">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}