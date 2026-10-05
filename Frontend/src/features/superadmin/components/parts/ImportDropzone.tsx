'use client';

import { type RefObject } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  file: File | null;
  dragging: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Column hint shown when no file is picked yet. */
  hint: string;
  onFileChange: (file: File | null) => void;
  onDraggingChange: (dragging: boolean) => void;
}

/** Shared Excel dropzone used by both the organizations and branches tabs. */
export default function ImportDropzone({
  file,
  dragging,
  inputRef,
  hint,
  onFileChange,
  onDraggingChange,
}: Props) {
  const pick = (files: FileList | null | undefined) => {
    const f = files?.[0];
    if (f) onFileChange(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDraggingChange(true);
      }}
      onDragLeave={() => onDraggingChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDraggingChange(false);
        pick(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload Excel file"
      className={cn(
        'cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-10',
        dragging
          ? 'scale-[1.01] border-primary-500 bg-primary-50/70'
          : 'border-slate-300 bg-slate-50/60 hover:border-primary-400 hover:bg-primary-50/30'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <p className="break-words text-base font-bold text-slate-900">
        {file ? file.name : 'Drag & drop your Excel file here, or click to browse'}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {file ? `${(file.size / 1024).toFixed(1)} KB · ready to import` : hint}
      </p>
    </div>
  );
}