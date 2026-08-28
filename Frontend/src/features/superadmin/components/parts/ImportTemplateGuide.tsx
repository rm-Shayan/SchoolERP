'use client';

import { memo } from 'react';
import { Button, Card } from '@/features/shared/components';

const TEMPLATE_COLUMNS: ReadonlyArray<readonly [string, string, string]> = [
  ['Name', 'Yes', 'Falcon Academy Systems'],
  ['Code', 'Yes', 'FALCON-01'],
  ['Slug', 'No', 'falcon-academy (auto-created from Code if blank)'],
  ['LogoUrl', 'No', 'https://example.com/logo.png'],
  ['AdminName', 'No', 'Mr. Ali Khan'],
  ['AdminUsername', 'No', 'falcon_admin'],
  ['AdminEmail', 'No', 'admin@falcon.edu'],
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
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-4 font-medium whitespace-nowrap">{col}</td>
      <td className="py-2 pr-4">
        <span className={req === 'Yes' ? 'text-red-600 font-medium' : 'text-gray-400'}>{req}</span>
      </td>
      <td className="py-2 text-gray-500">{example}</td>
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
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Column</th>
              <th className="py-2 pr-4 font-medium">Required</th>
              <th className="py-2 font-medium">Example</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {TEMPLATE_COLUMNS.map(([col, req, example]) => (
              <TemplateColumnRow key={col} col={col} req={req} example={example} />
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Sample Row</h3>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/40 p-2">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              {SAMPLE_HEADERS.map((h) => (
                <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-b border-gray-100">
              {SAMPLE_ROW.map((v, i) => (
                <td key={i} className="py-2 pr-3 whitespace-nowrap">{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        The downloaded template includes a sample row. Replace the example values with your own
        organization data and keep at least one row with Name and Code before uploading.
      </p>
      <p className="mt-4 text-xs text-gray-500">
        Rows with a duplicate Code are skipped automatically, and a duplicate AdminUsername is
        skipped too. When AdminEmail is provided, a Super Admin account is created (with the
        username, password and phone from the row, when given), a default branch is added, and
        credentials are emailed.
      </p>
    </Card>
  );
}
