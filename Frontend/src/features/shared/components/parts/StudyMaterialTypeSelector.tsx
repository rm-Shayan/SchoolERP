'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TYPE_ACCEPT_MAP, TYPE_MAX_BYTES_MAP, TYPE_OPTIONS, getMediaType } from './studyMaterialHelpers';
import FileUploadZone from './FileUploadZone';

interface Props {
  type: string;
  setType: (v: string) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  linkUrl: string;
  setLinkUrl: (v: string) => void;
  setFileError: (v: string) => void;
}

export default function StudyMaterialTypeSelector({ type, setType, file, setFile, linkUrl, setLinkUrl, setFileError }: Props) {
  const [mode, setMode] = useState<'file' | 'url'>(file ? 'file' : 'url');
  const [fileError, setFileErrorLocal] = useState('');
  const handleFileError = (msg: string) => { setFileError(msg); setFileErrorLocal(msg); };
  const accept = TYPE_ACCEPT_MAP[type as keyof typeof TYPE_ACCEPT_MAP] ?? '';
  const maxBytes = TYPE_MAX_BYTES_MAP[type as keyof typeof TYPE_MAX_BYTES_MAP] ?? 0;

  const handleFileSelect = (selected: File) => {
    setFileError('');
    setFileErrorLocal('');
    if (maxBytes && selected.size > maxBytes) {
      const msg = `File is too large (${(selected.size / (1024 * 1024)).toFixed(1)} MB). Max for ${type} is ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`;
      handleFileError(msg);
      return;
    }
    const inferred = getMediaType(selected.name);
    if (inferred === 'image' || inferred === 'video') setType(inferred === 'image' ? 'IMAGE' : 'VIDEO');
    setFile(selected);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={type} onChange={(e) => { setType(e.target.value); setFile(null); setLinkUrl(''); handleFileError(''); }}>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
          {(['file', 'url'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all',
                mode === m ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {m === 'file' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              )}
              {m === 'file' ? 'Upload File' : 'Paste URL'}
            </button>
          ))}
        </div>
        {mode === 'file' ? (
          <FileUploadZone accept={Array.isArray(accept) ? accept.join(',') : (typeof accept === 'string' ? accept : '')} file={file} onFileSelect={handleFileSelect} onRemove={() => { setFile(null); handleFileError(''); }} error={fileError} />
        ) : (
          <input type="url" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        )}
      </div>
    </>
  );
}
