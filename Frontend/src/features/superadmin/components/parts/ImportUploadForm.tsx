'use client';

import { type RefObject } from 'react';
import { Button, Card } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import ImportStatus from './ImportStatus';
import type { ProgressState } from './types';

interface ImportUploadFormProps {
  file: File | null;
  dragging: boolean;
  progress: ProgressState;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onDraggingChange: (dragging: boolean) => void;
  onUpload: () => void;
  onReset: () => void;
}

export default function ImportUploadForm({
  file,
  dragging,
  progress,
  inputRef,
  onFileChange,
  onDraggingChange,
  onUpload,
  onReset,
}: ImportUploadFormProps) {
  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-600">Step 2</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">Upload completed template</h2><p className="mt-1 text-xs text-slate-500">Excel format only, up to 10 MB.</p></div>
      <div className="p-5 sm:p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDraggingChange(true);
        }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDraggingChange(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFileChange(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12',
          dragging
            ? 'border-primary-500 bg-primary-50/60 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/60 hover:border-primary-400 hover:bg-primary-50/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
          }}
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 sm:h-16 sm:w-16">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="break-words text-base font-bold text-slate-900">
          {file ? file.name : 'Drag & drop your Excel file here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {file
            ? `${(file.size / 1024).toFixed(1)} KB`
            : 'Required: Name, Code · Optional: Slug, LogoUrl, AdminName, AdminUsername, AdminEmail, AdminPassword, AdminPhone'}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          onClick={onUpload}
          disabled={!file || progress.phase === 'uploading' || progress.phase === 'processing'}
          loading={progress.phase === 'uploading'}
        >
          {progress.phase === 'uploading' ? 'Uploading…' : 'Start Import'}
        </Button>
        {(file || progress.phase !== 'idle') && (
          <Button variant="ghost" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      <ImportStatus progress={progress} />
      </div>
    </Card>
  );
}
