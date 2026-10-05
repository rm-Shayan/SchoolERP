'use client';

import { useRef, useState } from 'react';
import { orgService } from '@/lib/api';
import { PageHeader } from '@/features/shared/components';
import ImportBranches from './ImportBranches';
import ImportTabs from './parts/ImportTabs';
import ImportUploadForm from './parts/ImportUploadForm';
import ImportTemplateGuide from './parts/ImportTemplateGuide';
import { useImportProgress } from './parts/useImportProgress';
import type { ImportTab, ProgressState } from './parts/types';
import { downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ImportOrganizationsPage() {
  const [tab, setTab] = useState<ImportTab>('organizations');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ phase: 'idle' });
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { listenForJob, resetJob } = useImportProgress();

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await orgService.downloadImportTemplate();
      downloadBlob(blob, 'organizations-import-template.xlsx');
      toast.success('Template downloaded — fill it in and upload it above');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Download failed');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setProgress({ phase: 'uploading' });
    try {
      const result = await orgService.importExcel(file);
      setProgress({
        phase: 'processing',
        current: 0,
        total: result.totalRows,
        percent: 0,
      });
      listenForJob(result.jobId, setProgress, {
        successMessage: 'Import completed!',
        failureMessage: 'Import failed',
      });
      toast.success(
        `Import job started for ${result.totalRows} row${result.totalRows !== 1 ? 's' : ''}`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setProgress({ phase: 'failed', error: msg });
      toast.error(msg);
    }
  };

  const reset = () => {
    resetJob();
    setFile(null);
    setProgress({ phase: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Import Data"
        description={
          tab === 'organizations'
            ? 'Bulk-create organizations from an Excel file (.xlsx / .xls, max 10 MB).'
            : 'Bulk-create branches from an Excel file — for one organization or all organizations.'
        }
      />

      <ImportTabs tab={tab} onTabChange={setTab} />

      {tab === 'branches' ? (
        <ImportBranches />
      ) : (
        <>
          <ImportUploadForm
            file={file}
            dragging={dragging}
            progress={progress}
            inputRef={inputRef}
            onFileChange={setFile}
            onDraggingChange={setDragging}
            onUpload={handleUpload}
            onReset={reset}
          />
          <ImportTemplateGuide
            downloadingTemplate={downloadingTemplate}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </>
      )}
    </div>
  );
}
