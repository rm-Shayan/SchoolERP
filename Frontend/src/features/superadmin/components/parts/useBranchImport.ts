'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { orgService, schoolService } from '@/lib/api';
import toast from 'react-hot-toast';
import { downloadBlob } from '@/lib/utils';
import { cleanupJobListeners, listenForProgress } from './branchImportSocket';
import type { ProgressState } from './branchImportSocket';

export type ImportMode = 'specific' | 'all';

export default function useBranchImport() {
  const [mode, setMode] = useState<ImportMode>('specific');
  const [orgs, setOrgs] = useState<{ id: string; name: string; code: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ phase: 'idle' });
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const jobIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => cleanupJobListeners(jobIdRef), []);

  useEffect(() => cleanup, [cleanup]);

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await schoolService.downloadImportTemplate();
      downloadBlob(blob, 'branches-import-template.xlsx');
      toast.success('Template downloaded — fill it in and upload it above');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Download failed');
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  useEffect(() => {
    orgService
      .getAll()
      .then((data) => {
        setOrgs(data.map((o) => ({ id: o.id, name: o.name, code: o.code })));
        if (data.length > 0) setOrganizationId(data[0].id);
      })
      .catch(() => {
        toast.error('Failed to load organizations for the import form');
      });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    if (mode === 'specific' && !organizationId) {
      toast.error('Select an organization first');
      return;
    }
    setProgress({ phase: 'uploading' });
    try {
      const result = await schoolService.importExcel(
        file,
        mode === 'specific' ? organizationId : undefined
      );
      setProgress({
        phase: 'processing',
        current: 0,
        total: result.totalRows,
        percent: 0,
      });
      listenForProgress(result.jobId, setProgress, cleanup, jobIdRef);
      toast.success(
        `Branch import job started for ${result.totalRows} row${result.totalRows !== 1 ? 's' : ''}`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setProgress({ phase: 'failed', error: msg });
      toast.error(msg);
    }
  }, [file, mode, organizationId, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    jobIdRef.current = null;
    setFile(null);
    setProgress({ phase: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  }, [cleanup]);

  return {
    mode,
    setMode,
    orgs,
    organizationId,
    setOrganizationId,
    file,
    setFile,
    dragging,
    setDragging,
    progress,
    downloadingTemplate,
    handleDownloadTemplate,
    handleUpload,
    reset,
    inputRef,
  };
}
