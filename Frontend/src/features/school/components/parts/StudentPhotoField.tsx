'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/features/shared/components';

const MAX_PHOTO_MB = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

interface StudentPhotoFieldProps {
  value?: string;
  onFile: (file: File | null) => void;
}

export function StudentPhotoField({ value, onFile }: StudentPhotoFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [error, setError] = useState('');

  useEffect(() => { setPreview(value ?? null); setError(''); }, [value]);

  const pick = (file: File | null) => {
    if (!file) { setPreview(value ?? null); setError(''); onFile(null); return; }
    if (!ALLOWED.includes(file.type)) { setError('Only JPG, PNG, WebP or HEIC photos are allowed'); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setError(`Photo must be ${MAX_PHOTO_MB}MB or smaller`); return; }
    setError('');
    setPreview(URL.createObjectURL(file));
    onFile(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl text-white shadow-sm">
        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : '📷'}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">Student Photo</p>
        <p className="text-xs text-gray-500">JPG, PNG, WebP or HEIC · up to {MAX_PHOTO_MB}MB</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}>Choose Photo</Button>
          {preview && <Button type="button" size="sm" variant="ghost" onClick={() => pick(null)}>Remove</Button>}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0] ?? null; pick(f); e.target.value = ''; }}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
