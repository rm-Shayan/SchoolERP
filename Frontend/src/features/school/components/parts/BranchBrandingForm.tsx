'use client';

import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { schoolService } from '@/lib/api';
import { Button } from '@/features/shared/components';
import { setActiveSchool } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { ThemeColorPicker } from './ThemeColorPicker';
import { LogoUpload } from './LogoUpload';
import { buildPrimaryScale } from '@/lib/theme';

export default function BranchBrandingForm() {
  const dispatch = useAppDispatch();
  const { school, organization } = useAppSelector((s) => s.auth);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [themeColor, setThemeColor] = useState(school?.themeColor ?? organization?.themeColor ?? '');
  const [logoUrl, setLogoUrl] = useState(school?.logoUrl ?? '');
  // Show organization logo as default when branch has no logo (same as sidebar)
  const displayLogo = logoUrl || organization?.logoUrl || '';

  if (!school) return null;

  const handleLogo = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await schoolService.uploadLogo(file, school.id);
      setLogoUrl(url);
      toast.success('Logo uploaded — press Save to apply');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await schoolService.update(school.id, {
        logoUrl: logoUrl || null,
        themeColor: themeColor || null,
      });
      dispatch(setActiveSchool(updated));
      toast.success('Branch branding updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  const scale = buildPrimaryScale(themeColor || '#2563eb');

  return (
    <div className="max-w-3xl space-y-6">
      {/* Live Preview */}
      <div className="rounded-xl border border-gray-200/60 overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</p>
        </div>
        <div className="p-5">
          <div className="rounded-xl overflow-hidden border border-gray-100">
            <div className="px-5 py-4" style={{ backgroundColor: scale?.['600'] || '#2563eb' }}>
              <div className="flex items-center gap-3">
                {displayLogo ? (
                  <img src={displayLogo} alt="Logo" className="h-8 w-8 rounded-full object-contain bg-white/10 p-0.5" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                    {school.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{school.name}</p>
                  <p className="text-white/60 text-[11px]">{organization?.name || 'Organization'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-xs text-gray-500">This is how your branch will appear in the sidebar.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <LogoUpload
        logoUrl={displayLogo}
        name={school.name || 'Branch'}
        uploading={uploading}
        fileRef={fileRef}
        onChange={(file) => file && handleLogo(file)}
        onRemove={() => setLogoUrl('')}
        onUrlSave={(url) => setLogoUrl(url)}
      />

      {/* Theme Color */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Branch Theme Color</p>
        <ThemeColorPicker value={themeColor || '#2563eb'} onChange={setThemeColor} />
        <p className="text-xs text-gray-400">
          Only this branch's theme will change — other branches won&apos;t be affected.
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <Button loading={saving} onClick={handleSave}>Save Branding</Button>
      </div>
    </div>
  );
}
