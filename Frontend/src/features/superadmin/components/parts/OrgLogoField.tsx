'use client';

import { useRef, useState } from 'react';
import { Button, Input } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { orgService } from '@/lib/api';
import { validateImageUpload } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrgLogoFieldProps {
  name: string;
  logoUrl: string;
  onLogoUrl: (name: string, value: string) => void;
  organizationId?: string | null;
}

export default function OrgLogoField({ name, logoUrl, onLogoUrl, organizationId }: OrgLogoFieldProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageUpload(file);
    if (validationError) {
      toast.error(validationError);
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const { url } = await orgService.uploadLogo(file, organizationId || undefined);
      onLogoUrl('logoUrl', url);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">Logo (optional)</span>
      <div className="flex flex-wrap items-center gap-3">
        <Logo src={logoUrl || null} name={name || 'Org'} size="lg" />
        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" loading={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
            {logoUrl ? 'Replace image' : 'Upload image'}
          </Button>
          {logoUrl && (
            <button type="button" className="text-xs text-red-600 hover:text-red-700 text-left" onClick={() => onLogoUrl('logoUrl', '')}>
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">Or paste a direct image URL (https://...):</p>
      <Input
        className="mt-1"
        placeholder="https://example.com/logo.png"
        value={logoUrl}
        onChange={(e) => {
          const val = e.target.value.trim();
          if (val && val.startsWith('data:')) {
            toast.error('Data URLs not supported — paste a direct image URL (https://...)');
            return;
          }
          if (val && !/^https?:\/\//i.test(val)) {
            toast.error('URL must start with http:// or https://');
            return;
          }
          onLogoUrl('logoUrl', e.target.value);
        }}
      />
    </div>
  );
}
