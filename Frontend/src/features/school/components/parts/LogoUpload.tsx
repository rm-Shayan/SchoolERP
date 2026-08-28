'use client';

import { type RefObject, useState } from 'react';
import { Button, Input } from '@/features/shared/components';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LogoUploadProps {
  logoUrl: string | null | undefined;
  name: string;
  uploading: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  onUrlSave?: (url: string) => void;
}

export function LogoUpload({ logoUrl, name, uploading, fileRef, onChange, onRemove, onUrlSave }: LogoUploadProps) {
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return toast.error('Enter a valid image URL');
    if (!/^https?:\/\//i.test(trimmed)) return toast.error('URL must start with http:// or https://');
    onUrlSave?.(trimmed);
    setUrlInput('');
    setUrlMode(false);
    toast.success('Logo URL set — press Save to apply');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { onChange(e.target.files?.[0] ?? null); e.target.value = ''; }} />
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-contain border border-gray-200 bg-white p-1"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
            {getInitials(name)}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              {logoUrl ? 'Upload File' : 'Upload Logo'}
            </Button>
            {onUrlSave && (
              <Button size="sm" variant="outline" onClick={() => setUrlMode(!urlMode)}>
                {urlMode ? 'Cancel URL' : 'Paste URL'}
              </Button>
            )}
            {logoUrl && (
              <Button size="sm" variant="ghost" onClick={onRemove}>Remove</Button>
            )}
          </div>
          <p className="text-xs text-gray-500">PNG, JPG or WebP — shown in sidebar, header &amp; ID cards.</p>
        </div>
      </div>

      {urlMode && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input label="Image URL" placeholder="https://example.com/logo.png" value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)} />
          </div>
          <Button size="sm" onClick={handleUrlSubmit}>Set URL</Button>
        </div>
      )}
    </div>
  );
}
