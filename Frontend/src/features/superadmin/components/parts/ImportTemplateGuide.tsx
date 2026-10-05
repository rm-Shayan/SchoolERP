'use client';

import { Card } from '@/features/shared/components';
import ExcelPreviewGrid from './ExcelPreviewGrid';
import TemplateColumnsTable, { TemplateCardHeader } from './TemplateColumnsTable';
import { ORG_TEMPLATE_COLUMNS } from './templateColumns';

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
      <TemplateCardHeader
        eyebrow="Template"
        title="Organization Excel format"
        description="Row 1 is the header row the importer reads — keep it exactly as downloaded."
        downloading={downloadingTemplate}
        onDownload={onDownloadTemplate}
      />

      <TemplateColumnsTable columns={ORG_TEMPLATE_COLUMNS} />

      <h3 className="mt-6 mb-1 text-sm font-bold text-slate-900">Sheet layout</h3>
      <p className="mb-3 text-xs text-slate-500">
        Replace the sample row 2 with your own organization data, then add more rows from row 3
        downwards. Do not rename or reorder row 1.
      </p>
      <ExcelPreviewGrid columns={ORG_TEMPLATE_COLUMNS} />

      <div className="mt-5 space-y-3">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          The downloaded template ships with a sample row — delete it or overwrite it. Keep at least
          one row with <span className="font-bold">Name</span> and{' '}
          <span className="font-bold">Code</span> before uploading.
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          Rows with a duplicate <span className="font-semibold text-slate-700">Code</span> or{' '}
          <span className="font-semibold text-slate-700">AdminUsername</span> are skipped
          automatically. Each row creates the organization plus its default branch. When{' '}
          <span className="font-semibold text-slate-700">AdminEmail</span> is given, a Principal
          account is created for that default branch and its credentials are emailed — leave{' '}
          <span className="font-semibold text-slate-700">AdminPassword</span> blank to
          auto-generate one.
        </p>
      </div>
    </Card>
  );
}