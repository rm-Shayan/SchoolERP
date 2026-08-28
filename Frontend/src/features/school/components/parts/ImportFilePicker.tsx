'use client';

import { useRef } from 'react';

interface ImportFilePickerProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const EXPECTED_COLUMNS = [
  'First Name', 'Last Name', 'Class Name', 'Section Name', 'Roll Number',
  'Gender', 'DOB', 'Parent Name', 'Parent Phone', 'Parent Phone',
  'Parent Email', 'Parent Address',
];

export function ImportFilePicker({ file, onFileChange }: ImportFilePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Click to choose an .xlsx file'}</p>
        <p className="text-xs text-gray-500 mt-1">Each row creates a student — class &amp; section are matched by name.</p>
      </div>
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Expected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPECTED_COLUMNS.map((col) => (
            <span key={col} className="text-[11px] font-medium bg-white border border-gray-200 text-gray-600 rounded px-2 py-0.5">{col}</span>
          ))}
        </div>
      </div>
    </>
  );
}
