'use client';

import { useMemo } from 'react';
import { Card } from '@/features/shared/components';
import type { ImportMode } from './types';
import ExcelPreviewGrid from './ExcelPreviewGrid';
import TemplateColumnsTable, { TemplateCardHeader } from './TemplateColumnsTable';
import { branchTemplateColumns } from './templateColumns';

interface Props {
  mode: ImportMode;
  downloadingTemplate: boolean;
  onDownload: () => void;
}

export default function BranchImportTemplate({ mode, downloadingTemplate, onDownload }: Props) {
  const columns = useMemo(() => branchTemplateColumns(mode), [mode]);

  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <TemplateCardHeader
        eyebrow="Template"
        title="Branch Excel format"
        description={
          mode === 'specific'
            ? 'One organization per sheet — Name and Code are required.'
            : 'Every row needs OrganizationCode so branches match their organization.'
        }
        downloading={downloadingTemplate}
        onDownload={onDownload}
      />

      <TemplateColumnsTable columns={columns} />

      <h3 className="mt-6 mb-1 text-sm font-bold text-slate-900">Sheet layout</h3>
      <p className="mb-3 text-xs text-slate-500">
        Row 1 is the header row the importer reads — keep it unchanged. Replace the sample row 2,
        then add your branches from row 3 downwards.
      </p>
      <ExcelPreviewGrid columns={columns} />

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Rows with a duplicate branch <span className="font-semibold text-slate-700">Code</span> or an
        unknown organization are skipped automatically. When{' '}
        <span className="font-semibold text-slate-700">AdminEmail</span> is given, a Principal
        account is created for that branch and its credentials are emailed.
      </p>
    </Card>
  );
}