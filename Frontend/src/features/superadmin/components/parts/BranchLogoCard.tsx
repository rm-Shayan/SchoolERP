'use client';

import { useRef, useState } from 'react';
import type { Organization, School } from '@/types';
import { Card, Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { schoolService } from '@/lib/api';
import { validateImageUpload } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BranchLogoCardProps {
  school: School;
  org: Organization;
  onLogoUpdated: (updated: School) => void;
}

export default function BranchLogoCard({ school, org, onLogoUpdated }: BranchLogoCardProps) {
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
      // Pass the school id so the upload overwrites the branch's existing
      // Cloudinary asset (same public_id) instead of creating a second file.
      const { url } = await schoolService.uploadLogo(file, school.id);
      const updated = await schoolService.update(school.id, { logoUrl: url });
      onLogoUpdated(updated);
      toast.success('Branch logo updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    try {
      const updated = await schoolService.update(school.id, { logoUrl: null });
      onLogoUpdated(updated);
      toast.success('Branch logo removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove logo');
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] transition-shadow duration-300">
      <div className="h-1.5 bg-gradient-to-r from-primary-500 to-violet-600" />
      <div className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Branding</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-1">Branch Logo</h2>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Logo src={school.logoUrl || org.logoUrl} name={school.name} size="lg" />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                {school.logoUrl ? 'Replace branch logo' : 'Upload branch logo'}
              </Button>
              {school.logoUrl && (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 text-left"
                  onClick={removeLogo}
                >
                  Remove branch logo (will use organization logo)
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500">
            Upload a custom logo for this branch. If not set, the organization logo will be used.
            <br />
            Supported formats: PNG, JPG, WebP (max 1 MB).
          </p>
        </div>
      </div>
    </Card>
  );
}
