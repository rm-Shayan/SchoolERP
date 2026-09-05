'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/features/shared/components';
import type { SectionOption } from '@/features/teacher/components/parts/HomeworkForm';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import FileUploadZone from './FileUploadZone';

export interface StudyMaterialFormValues {
  title: string;
  description: string;
  type: string;
  file: File | null;
  linkUrl: string;
  sectionId: string;
}

interface Props {
  sections: SectionOption[];
  sectionsLoading?: boolean;
  initialValues?: Partial<StudyMaterialFormValues>;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  submitting?: boolean;
}

const TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' },
  { value: 'VIDEO', label: 'Video', accept: '.mp4,.webm,.ogg,.mov' },
  { value: 'IMAGE', label: 'Image', accept: '.jpg,.jpeg,.png,.gif,.webp' },
  { value: 'LINK', label: 'External Link', accept: '' },
];

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

type InputMode = 'file' | 'url';

export default function StudyMaterialForm({
  sections,
  sectionsLoading,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  submitting = false,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [desc, setDesc] = useState(initialValues?.description ?? '');
  const [type, setType] = useState(initialValues?.type ?? 'DOCUMENT');
  const [linkUrl, setLinkUrl] = useState(initialValues?.linkUrl ?? '');
  const [file, setFile] = useState<File | null>(initialValues?.file ?? null);
  const [sectionId, setSectionId] = useState(initialValues?.sectionId ?? '');
  const [mode, setMode] = useState<InputMode>(initialValues?.file ? 'file' : 'url');
  const [fileError, setFileError] = useState('');

  const accept = TYPE_OPTIONS.find((t) => t.value === type)?.accept ?? '';

  const handleFileSelect = useCallback((selected: File) => {
    setFileError('');
    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      if (selected.size > MAX_VIDEO_BYTES) {
        setFileError(`Video is too large (${(selected.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 50 MB. The backend will compress it automatically.`);
        return;
      }
      setType('VIDEO');
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      setType('IMAGE');
    }
    setFile(selected);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (mode === 'file' && !file) { toast.error('Select a file or switch to URL'); return; }
    if (mode === 'url' && !linkUrl.trim()) { toast.error('Enter a URL or switch to file upload'); return; }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('type', type);
    if (desc.trim()) fd.append('description', desc.trim());
    if (mode === 'file' && file) fd.append('file', file);
    if (mode === 'url' && linkUrl.trim()) fd.append('linkUrl', linkUrl.trim());
    if (sectionId) fd.append('sectionId', sectionId);

    await onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Notes" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={type} onChange={(e) => { setType(e.target.value); setFile(null); setLinkUrl(''); setFileError(''); }}>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All sections</option>
            {sectionsLoading ? <option disabled>Loading...</option> : sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* File / URL toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
          {(['file', 'url'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all', mode === m ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
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
          <FileUploadZone accept={accept} file={file} onFileSelect={handleFileSelect} onRemove={() => { setFile(null); setFileError(''); }} error={fileError} />
        ) : (
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or any URL" />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
      </div>
    </div>
  );
}
