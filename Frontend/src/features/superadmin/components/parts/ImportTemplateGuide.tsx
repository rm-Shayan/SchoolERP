'use client';

import { memo } from 'react';
import { Button, Card } from '@/features/shared/components';
import ExcelPreviewGrid from './ExcelPreviewGrid';

const TEMPLATE_COLUMNS: ReadonlyArray<readonly [string, string, string]> = [
  ['Name', 'Yes', 'Falcon Academy Systems'],
  ['Code', 'Yes', 'FALCON-01'],
  ['Slug', 'No', 'falcon-academy (auto-created from Code if blank)'],
  ['LogoUrl', 'No', 'https://example.com/logo.png'],
  ['AdminName', 'No', 'Mr. Ali Khan (Principal name)'],
  ['AdminUsername', 'No', 'falcon_admin'],
  ['AdminEmail', 'No', 'admin@falcon.edu (required to create an Admin)'],
  ['AdminPassword', 'No', 'Welcome@123 (auto-generated if blank)'],
  ['AdminPhone', 'No', '03001234567'],
];

const SAMPLE_HEADERS = [
  'Name', 'Code', 'Slug', 'LogoUrl', 'AdminName',
  'AdminUsername', 'AdminEmail', 'AdminPassword', 'AdminPhone',
];

const SAMPLE_ROW = [
  'Falcon Academy Systems', 'FALCON-01', 'falcon-academy', 'https://example.com/logo.png',
  'Mr. Ali Khan', 'falcon_admin', 'admin@falcon.edu', 'Welcome@123', '03001234567',
];

const TemplateColumnRow = memo(function TemplateColumnRow({
  col, req, example,
}: {
  col: string;
  req: string;
  example: string;
}) {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="border border-slate-200 px-3 py-2 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">{col}</td>
      <td className="border border-slate-200 px-3 py-2 text-center whitespace-nowrap">
        <span className={req === 'Yes' ? 'text-red-600 font-semibold' : 'text-gray-400'}>{req}</span>
      </td>
      <td className="border border-slate-200 px-3 py-2 font-mono text-xs text-gray-600">{example}</td>
    </tr>
  );
});

interface ImportTemplateGuideProps {
  downloadingTemplate: boolean;
  onDownloadTemplate: () => void;
}

export default function ImportTemplateGuide({
  downloadingTemplate,
  onDownloadTemplate,
}: ImportTemplateGuideProps) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-gray-900">Excel Template — Required Columns</h2>
        <Button size="sm" loading={downloadingTemplate} onClick={onDownloadTemplate} className="!border-0 bg-primary-600 text-white">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Download Template (.xlsx)
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-gray-500">
              <th className="border border-slate-200 px-3 py-2 font-semibold">Column</th>
              <th className="border border-slate-200 px-3 py-2 text-center font-semibold">Required</th>
              <th className="border border-slate-200 px-3 py-2 font-semibold">Example</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {TEMPLATE_COLUMNS.map(([col, req, example]) => (
              <TemplateColumnRow key={col} col={col} req={req} example={example} />
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-1">Sheet layout</h3>
      <p className="text-xs text-gray-500 mb-3">
        Keep row 1 exactly as it is — those are the column headers the importer reads. Replace or
        delete the sample row 2, then add your organizations from row 3 downwards.
      </p>
      <ExcelPreviewGrid headers={SAMPLE_HEADERS} row={SAMPLE_ROW} />
      <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        The downloaded template includes a sample row. Replace the example values with your own
        organization data and keep at least one row with Name and Code before uploading.
      </p>
      <p className="mt-4 text-xs text-gray-500">
        Rows with a duplicate Code are skipped automatically, and a duplicate AdminUsername is
        skipped too. When AdminEmail is provided, an <span className="font-semibold text-gray-700">Admin (Principal)</span> account is
        created for the auto-created default branch — with the username, password and phone from the
        row, when given — and credentials are emailed. Leave AdminPassword blank to auto-generate one.
      </p>
    </Card>
  );
}
