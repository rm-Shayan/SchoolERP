'use client';

import { useState } from 'react';
import { Button, Input } from '@/features/shared/components';
import type { SectionOption } from '@/features/teacher/components/parts/HomeworkForm';
import type { SubjectOption } from '@/features/teacher/components/parts/HomeworkForm';
import toast from 'react-hot-toast';
import StudyMaterialTypeSelector from './StudyMaterialTypeSelector';

export interface StudyMaterialFormValues {
  title: string;
  description: string;
  type: string;
  file: File | null;
  linkUrl: string;
  sectionId: string;
  subjectId: string;
}

interface Props {
  sections: SectionOption[];
  sectionsLoading?: boolean;
  subjects?: SubjectOption[];
  subjectsLoading?: boolean;
  initialValues?: Partial<StudyMaterialFormValues>;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  submitting?: boolean;
}

export default function StudyMaterialForm({
  sections,
  sectionsLoading,
  subjects = [],
  subjectsLoading = false,
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
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '');
  const [fileError, setFileError] = useState('');
  const [_linkError, _setLinkError] = useState('');
  const [_sectionError, _setSectionError] = useState('');
  const [_subjectError, _setSubjectError] = useState('');

  const handleSubmit = async () => {
    _setSectionError('');
    _setSubjectError('');
    _setLinkError('');
    setFileError('');

    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!sectionId) { _setSectionError('Select a section'); return; }
    if (subjectId && !subjects.some((s) => s.id === subjectId)) { _setSubjectError('Select a valid subject'); return; }

    if (!file && !linkUrl.trim()) { toast.error('Select a file or enter a URL'); return; }
    if (linkUrl.trim() && !/^https?:\/\//i.test(linkUrl)) { _setLinkError('Enter a valid URL starting with https://'); return; }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('type', type);
    if (desc.trim()) fd.append('description', desc.trim());
    if (file) fd.append('file', file);
    if (linkUrl.trim()) fd.append('linkUrl', linkUrl.trim());
    if (sectionId) fd.append('sectionId', sectionId);
    if (subjectId) fd.append('subjectId', subjectId);

    await onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Notes" className="w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" rows={2}
          value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" maxLength={2000} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={sectionId} onChange={(e) => { setSectionId(e.target.value); setSubjectId(''); _setSubjectError(''); }}>
            <option value="">All sections</option>
            {sectionsLoading ? <option disabled>Loading...</option> : sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {subjects.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={subjectId} onChange={(e) => { setSubjectId(e.target.value); _setSubjectError(''); }}>
            <option value="">All subjects</option>
            {subjectsLoading ? <option disabled>Loading...</option> : subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {_subjectError && <p className="mt-1 text-xs text-red-500">{_subjectError}</p>}
        </div>
      )}

      <StudyMaterialTypeSelector type={type} setType={setType} file={file} setFile={setFile} linkUrl={linkUrl} setLinkUrl={setLinkUrl} setFileError={setFileError} />

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
      </div>
    </div>
  );
}
