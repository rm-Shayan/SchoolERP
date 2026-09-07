'use client';

import { useState } from 'react';
import { PageHeader, Card, Button } from '@/features/shared/components';
import { studentService, staffService, staffAttendanceService } from '@/lib/api';
import ImportSteps from './parts/ImportSteps';
import TemplateTable from './parts/TemplateTable';
import { STUDENT_COLUMNS, STAFF_COLUMNS, TIMETABLE_MULTI_COLUMNS, STAFF_ATTENDANCE_COLUMNS } from './parts/importColumns';
import { downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

type ImportType = 'students' | 'staff' | 'staff-attendance' | 'timetable';

const TAB_META: Record<ImportType, { label: string; icon: string }> = {
  students: {
    label: 'Students',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  staff: {
    label: 'Staff',
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z',
  },
  'staff-attendance': {
    label: 'Staff Attendance',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  timetable: {
    label: 'Timetable',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
};

const TIPS: Record<ImportType, string[]> = {
  students: [
    'Class Name / Section Name must exactly match existing classes in the Academic Setup.',
    'Roll Number must be unique within each section.',
    'If a parent email is provided, login credentials are sent via email.',
  ],
  staff: [
    'Role only accepts these values: TEACHER, STAFF, ACCOUNTANT, NURSE, LIBRARIAN.',
    'Leave Password blank and the system will auto-generate and email it.',
    'Email must be unique — each staff member gets a unique account.',
  ],
  'staff-attendance': [
    'Matches by Staff Name or Email — exact name or email is required.',
    'Date format must be YYYY-MM-DD (e.g. 2026-08-27).',
    'Status only accepts these values: PRESENT, ABSENT, LATE, LEAVE.',
    'If a record for the same staff + date already exists, it will be overwritten.',
  ],
  timetable: [
    'Each row is for one section — use the "Class 5 - A" format in the Section column.',
    'The Day column accepts both day names (Monday) and numbers (1-7).',
    'The Teacher column requires the exact name as it appears in the staff list.',
  ],
};

export default function ImportGuidePage() {
  const [activeTab, setActiveTab] = useState<ImportType>('students');
  const columns = activeTab === 'students' ? STUDENT_COLUMNS : activeTab === 'staff' ? STAFF_COLUMNS : activeTab === 'staff-attendance' ? STAFF_ATTENDANCE_COLUMNS : TIMETABLE_MULTI_COLUMNS;
  const requiredCount = columns.filter((c) => c.req).length;

  const handleDownload = async () => {
    try {
      if (activeTab === 'students') {
        await studentService.downloadImportTemplate();
      } else if (activeTab === 'staff') {
        const blob = await staffService.downloadImportTemplate();
        downloadBlob(blob, 'staff-import-template.xlsx');
      } else if (activeTab === 'staff-attendance') {
        const res = await staffAttendanceService.downloadImportTemplate();
        downloadBlob(new Blob([res.data], { type: 'application/vnd.ms-excel' }), 'staff-attendance-template.xlsx');
      } else {
        const header = columns.map((c) => c.col).join(',');
        const sample = ['Monday,Mathematics,Mr. Ahmed Khan,08:00,08:45,Class 5 - A'].join('\n');
        const csv = `${header}\n${sample}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, 'timetable-import-sample.csv');
      }
      toast.success(`${TAB_META[activeTab].label} template downloaded`);
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
          <Button variant="outline" size="sm" onClick={handleDownload} className="shrink-0">Download Sample (.xlsx)</Button>
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
