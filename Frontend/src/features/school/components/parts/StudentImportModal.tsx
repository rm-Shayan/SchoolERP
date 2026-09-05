'use client';

import { useRef, useState } from 'react';
import { studentService } from '@/lib/api';
import { Modal, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface StudentImportModalProps {
  open: boolean;
  schoolId?: string;
  onClose: () => void;
  onImported: () => void;
}

const COLUMNS = [
  'First Name', 'Last Name', 'Class Name', 'Section Name', 'Roll Number',
  'Gender', 'DOB', 'Parent Name', 'Parent WhatsApp', 'Parent Phone',
  'Parent Email', 'Parent Address',
];

function downloadTemplate() {
  const header = COLUMNS.map((c) => `<th>${c}</th>`).join('');
  const sample = COLUMNS.map((c) => `<td>${SAMPLE[c] ?? ''}</td>`).join('');
  const html = `<html><body><table border="1"><tr>${header}</tr><tr>${sample}</tr></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students-import-template.xls';
  a.click();
  URL.revokeObjectURL(url);
}

const SAMPLE: Record<string, string> = {
  'First Name': 'Ahmed', 'Last Name': 'Khan', 'Class Name': 'Class 5',
  'Section Name': 'A', 'Roll Number': '101', 'Gender': 'Male',
  DOB: '2012-05-15', 'Parent Name': 'Mr. Khan', 'Parent WhatsApp': '03001234567',
  'Parent Phone': '03001234567', 'Parent Email': 'khan@email.com', 'Parent Address': '123 Main St',
};

export default function StudentImportModal({ open, schoolId, onClose, onImported }: StudentImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error('Select an Excel file first');
    if (!schoolId) return;
    setUploading(true);
    try {
      const { jobId, totalRows } = await studentService.importExcel(schoolId, file);
      toast.success(`Import started — ${totalRows} students queued (job ${jobId})`);
      setFile(null);
      onImported();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to start import');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Student Import (Excel)">
      <div className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Click to choose an .xlsx / .xls file'}</p>
          <p className="text-xs text-gray-500 mt-1">Each row creates a student — class & section are resolved by name.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadTemplate}>Download Template</Button>
          <span className="text-xs text-gray-500 self-center">Use this Excel template (fill it, then upload).</span>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Expected columns</p>
          <div className="flex flex-wrap gap-1.5">
            {COLUMNS.map((col) => (
              <span key={col} className="text-[11px] font-medium bg-white border border-gray-200 text-gray-600 rounded px-2 py-0.5">{col}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleUpload} loading={uploading} disabled={!file}>Start Import</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
