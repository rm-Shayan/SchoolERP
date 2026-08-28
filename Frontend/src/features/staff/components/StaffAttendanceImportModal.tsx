'use client';

import { useRef, useState } from 'react';
import { staffAttendanceService } from '@/lib/api';
import { Modal, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface StaffAttendanceImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const SAMPLE_COLUMNS = [
  { col: 'Staff Name', req: true, example: 'Mr. Ahmed Khan' },
  { col: 'Email', req: false, example: 'ahmed@school.edu' },
  { col: 'Date', req: true, example: '2026-08-27' },
  { col: 'Status', req: true, example: 'PRESENT / ABSENT / LATE / LEAVE' },
  { col: 'Remarks', req: false, example: 'Late by 10 mins' },
];

export default function StaffAttendanceImportModal({ open, onClose, onImported }: StaffAttendanceImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number; errors: string[] } | null>(null);

  const handleUpload = async () => {
    if (!file) return toast.error('Select an Excel file first');
    setUploading(true);
    setResult(null);
    try {
      const res = await staffAttendanceService.importAttendance(file);
      const data = res.data.data;
      setResult(data);
      if (data.succeeded > 0) {
        toast.success(`${data.succeeded} records imported`);
        onImported();
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} records failed`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to import');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await staffAttendanceService.downloadImportTemplate();
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff-attendance-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Staff Attendance" size="lg">
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-amber-800">Expected Excel Format</h4>
            <Button size="sm" variant="outline" onClick={handleDownloadSample}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Template
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-amber-700 border-b border-amber-200">
                <th className="py-1 pr-3 font-medium">Column</th>
                <th className="py-1 pr-3 font-medium">Required</th>
                <th className="py-1 font-medium">Example</th>
              </tr></thead>
              <tbody className="text-amber-900">
                {SAMPLE_COLUMNS.map((c) => (
                  <tr key={c.col} className="border-b border-amber-100">
                    <td className="py-1 pr-3 font-medium">{c.col}</td>
                    <td className="py-1 pr-3"><span className={c.req ? 'font-semibold' : 'text-amber-600'}>{c.req ? 'Yes' : 'No'}</span></td>
                    <td className="py-1 text-amber-700">{c.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          />
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Click to choose an .xlsx file'}</p>
          <p className="text-xs text-gray-500 mt-1">Each row updates or creates an attendance record for that staff on that date.</p>
        </div>

        {result && (
          <div className={`rounded-xl p-4 text-sm ${result.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="font-medium">{result.succeeded} records imported successfully</p>
            {result.failed > 0 && <p className="text-amber-700 mt-1">{result.failed} records failed</p>}
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 list-disc list-inside max-h-24 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleUpload} loading={uploading} disabled={!file}>Import Attendance</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
