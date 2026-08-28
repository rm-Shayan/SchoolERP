'use client';

import { memo, useMemo } from 'react';
import { Button, Card } from '@/features/shared/components';
import type { ImportMode } from './useBranchImport';

interface TemplateRowProps {
  col: string;
  req: string;
  example: string;
}

interface Props {
  mode: ImportMode;
  downloadingTemplate: boolean;
  onDownload: () => void;
}

const TemplateRow = memo(function TemplateRow({ col, req, example }: TemplateRowProps) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-4 font-medium">{col}</td>
      <td className="py-2 pr-4">
        <span className={req === 'Yes' ? 'text-red-600' : 'text-gray-400'}>{req}</span>
      </td>
      <td className="py-2 text-gray-500">{example}</td>
    </tr>
  );
});

const buildTemplateColumns = (mode: ImportMode): TemplateRowProps[] =>
  mode === 'specific'
    ? [
        { col: 'Name', req: 'Yes', example: 'Gulshan Campus' },
        { col: 'Code', req: 'Yes', example: 'GULSHAN-01' },
        { col: 'Address', req: 'No', example: 'Main Boulevard, Gulshan' },
        { col: 'Phone', req: 'No', example: '03001234567' },
        { col: 'AdminName', req: 'No', example: 'Mr. Ali Khan' },
        { col: 'AdminEmail', req: 'No', example: 'principal@gulshan.edu' },
      ]
    : [
        { col: 'OrganizationCode', req: 'Yes', example: 'FALCON' },
        { col: 'Name', req: 'Yes', example: 'Gulshan Campus' },
        { col: 'Code', req: 'Yes', example: 'GULSHAN-01' },
        { col: 'Address', req: 'No', example: 'Main Boulevard, Gulshan' },
        { col: 'Phone', req: 'No', example: '03001234567' },
        { col: 'AdminName', req: 'No', example: 'Mr. Ali Khan' },
        { col: 'AdminEmail', req: 'No', example: 'principal@gulshan.edu' },
      ];

export default function BranchImportTemplate({ mode, downloadingTemplate, onDownload }: Props) {
  const rows = useMemo(() => buildTemplateColumns(mode), [mode]);

  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-600">Template</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">Branch Excel format</h2><p className="mt-1 text-xs text-slate-500">Download, replace the sample row and upload.</p></div>
        <Button size="sm" loading={downloadingTemplate} onClick={onDownload} className="!border-0 bg-primary-600 text-white">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Download Template (.xlsx)
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Column</th>
              <th className="py-2 pr-4 font-medium">Required</th>
              <th className="py-2 font-medium">Example</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {rows.map(({ col, req, example }) => (
              <TemplateRow key={col} col={col} req={req} example={example} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Rows with a duplicate branch Code or an unknown organization are skipped automatically.
        When AdminEmail is provided, a Principal (Admin) account is created for that branch and
        credentials are emailed.
      </p>
    </Card>
  );
}
