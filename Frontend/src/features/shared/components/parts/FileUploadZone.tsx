'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/compressFile';

interface FileUploadZoneProps {
  accept: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

export default function FileUploadZone({
  accept,
  file,
  onFileSelect,
  onRemove,
  error,
}: FileUploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  if (file) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 border rounded-lg',
        error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200',
      )}>
        <svg className={cn('w-5 h-5 shrink-0', error ? 'text-red-500' : 'text-green-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={error ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' : 'M5 13l4 4L19 7'} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm truncate', error ? 'text-red-700' : 'text-green-700')}>{file.name}</p>
          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:text-red-600 shrink-0">Remove</button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-sm text-gray-500">Click to select a file</span>
        <span className="text-xs text-gray-400">
          {accept ? accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ') : 'Any file'}
        </span>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}
