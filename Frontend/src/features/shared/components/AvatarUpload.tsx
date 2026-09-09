'use client';

import { useRef, useState } from 'react';
import AvatarPlaceholder from './AvatarPlaceholder';

interface Props {
  currentUrl?: string | null;
  name?: string;
  onFileSelect: (file: File | null) => void;
}

export default function AvatarUpload({ currentUrl, name, onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Max 5 MB'); return; }
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
    onFileSelect(file);
  };

  const clear = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const imgSrc = preview || currentUrl || null;

  return (
    <div className="flex items-center gap-4">
      {imgSrc ? (
        <img src={imgSrc} alt={name || 'Avatar'} className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-white" />
      ) : (
        <AvatarPlaceholder className="w-16 h-16 rounded-2xl shadow-lg" />
      )}
      <div className="flex flex-col gap-1">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-primary-600 hover:text-primary-700">
          {currentUrl ? 'Change Photo' : 'Upload Photo'}
        </button>
        <span className="text-[10px] text-gray-400">Optional · Max 5 MB</span>
        {preview && (
          <button type="button" onClick={clear} className="text-[10px] text-red-500 hover:text-red-600">Remove</button>
        )}
      </div>
    </div>
  );
}
