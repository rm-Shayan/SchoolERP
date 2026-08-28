'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { timetableService } from '@/lib/api';
import { Modal, Button, Select } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import useSectionOptions from './useSectionOptions';

interface Props { open: boolean; sectionId: string; onClose: () => void; onImported: () => void; }
interface ImportResult { successCount: number; failedCount: number; errors: { row: number; error: string }[]; }
const SINGLE_COLS = ['Day', 'Subject', 'Teacher', 'Start Time', 'End Time'];
const MULTI_COLS = ['Day', 'Subject', 'Teacher', 'Start Time', 'End Time', 'Section'];

export default function TimetableImportModal({ open, sectionId, onClose, onImported }: Props) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const sections = useSectionOptions(schoolId);
  const jobIdRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [multiSection, setMultiSection] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [failed, setFailed] = useState('');

  const cleanup = useCallback(() => {
    const s = getSocket(); if (!s || !jobIdRef.current) return;
    s.off('timetable_import_progress'); s.off('timetable_import_completed'); s.off('timetable_import_failed');
    s.emit('leave_room', `job:${jobIdRef.current}`); jobIdRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);
  useEffect(() => { if (!open) { setFile(null); setRunning(false); setProgress(null); setResult(null); setFailed(''); setMultiSection(false); cleanup(); } }, [open, cleanup]);

  const downloadTemplate = async () => {
    const headers = multiSection ? MULTI_COLS : SINGLE_COLS;
    const sample = multiSection
      ? ['Monday', 'Mathematics', 'Mr. Ahmed', '08:00', '08:45', 'A']
      : ['Monday', 'Mathematics', 'Mr. Ahmed', '08:00', '08:45'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timetable-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const startImport = async () => {
    if (!file) return toast.error('Select an Excel file first');
    if (!/\.xlsx?$/i.test(file.name)) return toast.error('Please choose an .xlsx or .xls file');
    setRunning(true); setResult(null); setFailed('');
    try {
      const { jobId, totalRows } = await timetableService.importExcel(sectionId, file);
      jobIdRef.current = jobId;
      setProgress({ current: 0, total: totalRows, percent: 0 });
      toast.success(`Import started — ${totalRows} slots queued`);
      const s = getSocket();
      const attach = () => {
        if (!s?.connected) return;
        s.emit('join_room', `job:${jobId}`);
        s.on('timetable_import_progress', (p: any) => { if (p?.jobId === jobId) setProgress({ current: p.current, total: p.total, percent: p.progress }); });
        s.on('timetable_import_completed', (p: any) => {
          if (p?.jobId !== jobId) return;
          setResult(p.result ?? null); setProgress(null); setRunning(false);
          toast.success(`Import finished — ${p.result?.successCount ?? 0} slots added`); onImported(); cleanup();
        });
        s.on('timetable_import_failed', (p: any) => { if (p?.jobId === jobId) { setFailed(p?.error ?? 'Import job failed'); setRunning(false); cleanup(); } });
      };
      if (s?.connected) attach(); else s?.once('connect', attach);
    } catch (err: any) { setRunning(false); setFailed(err?.response?.data?.message ?? 'Failed to start import'); }
  };

  const close = () => { if (!running) { cleanup(); onClose(); } };
  const cols = multiSection ? MULTI_COLS : SINGLE_COLS;

  return (
    <Modal open={open} onClose={close} title="Import Timetable (Excel)" size="lg">
      <div className="space-y-4">
        {!running && !result && !failed && (
          <>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800"><span className="font-semibold">Columns:</span> {cols.join(', ')}</p>
              <Button size="sm" variant="outline" onClick={downloadTemplate}>Download Sample</Button>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={multiSection} onChange={(e) => setMultiSection(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-blue-800">Import to multiple sections</span>
              </label>
              <span className="text-xs text-blue-600">— add a &quot;Section&quot; column in your Excel</span>
            </div>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Click to choose an .xlsx file'}</p>
              <p className="text-xs text-gray-500 mt-1">Subject &amp; teacher names must match existing records.</p>
            </div>
          </>
        )}
        {running && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Importing timetable slots…</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${progress?.percent ?? 0}%` }} /></div>
            <p className="text-xs text-gray-500 tabular-nums">{progress ? `${progress.current} of ${progress.total} processed (${progress.percent}%)` : 'Starting…'}</p>
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-2xl font-bold text-green-700 tabular-nums">{result.successCount}</p>
                <p className="text-xs text-green-600">Slots created</p>
              </div>
              <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                <p className="text-2xl font-bold text-red-700 tabular-nums">{result.failedCount}</p>
                <p className="text-xs text-red-600">Rows skipped</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Row errors</p>
                {result.errors.slice(0, 8).map((e) => <p key={e.row} className="text-xs text-gray-600 py-0.5">Row {e.row}: {e.error}</p>)}
                {result.errors.length > 8 && <p className="text-xs text-gray-400 pt-1">…and {result.errors.length - 8} more</p>}
              </div>
            )}
          </div>
        )}
        {failed && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{failed}</div>}
        <div className="flex gap-3 pt-2">
          {!running && !result && <Button onClick={startImport} disabled={!file}>Start Import</Button>}
          {result && <Button onClick={close}>Done</Button>}
          <Button variant="ghost" onClick={close} disabled={running}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
