'use client';

import { useRef, useState } from 'react';
import { Badge, Button } from '@/features/shared/components';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';
import { studentService } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Student } from '@/types';

const MAX_PHOTO_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

interface Props {
  student: Student;
  onUpdated?: (student: Student) => void;
}

export default function StudentPhotoHeader({ student, onUpdated }: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePhoto = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Only JPG, PNG, WebP or HEIC (iPhone) photos are allowed'); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { toast.error(`Photo must be ${MAX_PHOTO_MB}MB or smaller`); return; }
    setBusy(true);
    try {
      const updated = await studentService.uploadPhoto(student.id, file);
      toast.success('Photo updated successfully');
      onUpdated?.(updated);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to upload photo'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gradient-to-r from-primary-50/70 to-white p-4">
      {student.imageUrl ? (
        <img src={student.imageUrl} alt={`${student.firstName} ${student.lastName}`} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white shadow-sm shrink-0" />
      ) : (
        <AvatarPlaceholder className="h-20 w-20 rounded-2xl shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight text-gray-900">{student.firstName} {student.lastName}</p>
        <p className="mt-0.5 text-sm text-gray-500">{student.section?.class?.name ? `${student.section.class.name} — ${student.section.name} · ` : ''}Roll #{student.rollNumber}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={student.status === 'ACTIVE' ? 'success' : 'info'}>{student.status.replace('_', ' ')}</Badge>
          {student.isBlocked && <Badge variant="danger">Blocked</Badge>}
        </div>
      </div>
      <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ''; }} />
      <Button size="sm" variant="outline" loading={busy} className="self-end shrink-0" onClick={() => photoRef.current?.click()}>
        {student.imageUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>
    </div>
  );
}
