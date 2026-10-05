'use client';

import { type RefObject } from 'react';
import { Button, Card } from '@/features/shared/components';
import ImportDropzone from './ImportDropzone';
import ImportStatus from './ImportStatus';
import type { ProgressState } from './types';

const ORG_DROPZONE_HINT =
  'Excel format only, up to 10 MB · Required: Name, Code · Optional: Slug, LogoUrl, AdminName, AdminUsername, AdminEmail, AdminPassword, AdminPhone';

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
  const busy = progress.phase === 'uploading' || progress.phase === 'processing';

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">
          Step 2 · Upload
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">Upload completed template</h2>
        <p className="mt-1 text-xs text-slate-500">
          Pick the .xlsx you filled in — the preview below shows exactly what will be read.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <ImportDropzone
          file={file}
          dragging={dragging}
          inputRef={inputRef}
          hint={ORG_DROPZONE_HINT}
          onFileChange={onFileChange}
          onDraggingChange={onDraggingChange}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={onUpload} disabled={!file || busy} loading={progress.phase === 'uploading'}>
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