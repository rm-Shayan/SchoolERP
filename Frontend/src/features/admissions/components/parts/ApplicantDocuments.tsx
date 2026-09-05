'use client';

import { useRef, useState } from 'react';
import { admissionService } from '@/lib/api';
import type { Applicant, ApplicantDocumentType } from '@/types';
import { Button, Select } from '@/features/shared/components';
import { formatDate, validateDocumentUpload } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ApplicantDocumentsProps {
  applicant: Applicant;
  onChanged: (applicant: Applicant) => void;
}

const TYPE_LABELS: Record<ApplicantDocumentType, string> = {
  B_FORM: 'B-Form',
  BIRTH_CERTIFICATE: 'Birth Certificate',
  OTHER: 'Other',
};

export function ApplicantDocuments({ applicant, onChanged }: ApplicantDocumentsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ApplicantDocumentType>('B_FORM');
  const [busy, setBusy] = useState(false);
  const docs = applicant.documents ?? [];

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const err = validateDocumentUpload(file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const doc = await admissionService.uploadDocument(applicant.id, file, type);
      toast.success('Document uploaded');
      onChanged({ ...applicant, documents: [doc, ...docs] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload document');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    setBusy(true);
    try {
      await admissionService.deleteDocument(applicant.id, docId);
      toast.success('Document deleted');
      onChanged({ ...applicant, documents: docs.filter((d) => d.id !== docId) });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete document');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-3 border-t border-gray-100 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documents (B-Form / Birth Certificate)</p>

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
              <div className="min-w-0">
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:underline truncate block">
                  {TYPE_LABELS[doc.type] ?? doc.type} — {doc.filename}
                </a>
                <p className="text-xs text-gray-400">Uploaded {formatDate(doc.createdAt)}</p>
              </div>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => handleDelete(doc.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files?.[0]); e.target.value = ''; }}
        />
        <Select
          className="sm:w-48"
          value={type}
          onChange={(e) => setType(e.target.value as ApplicantDocumentType)}
          options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Button size="sm" variant="outline" loading={busy} onClick={() => fileRef.current?.click()} className="flex-1">
          Upload Document
        </Button>
      </div>
    </div>
  );
}
