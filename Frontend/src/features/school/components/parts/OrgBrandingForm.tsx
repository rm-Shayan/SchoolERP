'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { orgService } from '@/lib/api';
import { Button, Input } from '@/features/shared/components';
import { setOrganizationForSchool } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { ThemeColorPicker } from './ThemeColorPicker';
import { LogoUpload } from './LogoUpload';
import { useStagedImage } from './useStagedImage';
import { OrgSocialLinks } from './OrgSocialLinks';

export function OrgBrandingForm() {
  const dispatch = useAppDispatch();
  const { organization, user } = useAppSelector((s) => s.auth);
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(organization?.name ?? '');
  const [themeColor, setThemeColor] = useState(organization?.themeColor ?? '#7c3aed');
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl ?? '');
  const { pendingFile, previewUrl, hasPending, stage, clear } = useStagedImage();
  const [phone, setPhone] = useState(organization?.phone ?? '');
  const [email, setEmail] = useState(organization?.email ?? '');
  const [website, setWebsite] = useState(organization?.website ?? '');
  const [facebookUrl, setFacebookUrl] = useState(organization?.facebookUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(organization?.instagramUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(organization?.twitterUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(organization?.youtubeUrl ?? '');

  // Redux is refreshed after login/navigation and after a branding update.
  // Keep the controlled form fields aligned with the latest DB-backed org.
  useEffect(() => {
    if (!organization) return;
    setName(organization.name ?? '');
    setThemeColor(organization.themeColor ?? '#7c3aed');
    setLogoUrl(organization.logoUrl ?? '');
    setPhone(organization.phone ?? '');
    setEmail(organization.email ?? '');
    setWebsite(organization.website ?? '');
    setFacebookUrl(organization.facebookUrl ?? '');
    setInstagramUrl(organization.instagramUrl ?? '');
    setTwitterUrl(organization.twitterUrl ?? '');
    setYoutubeUrl(organization.youtubeUrl ?? '');
    clear();
  }, [organization]);

  if (!organization) return null;

  const handleLogo = (file: File) => stage(file);

  const handleRemove = () => {
    clear();
    setLogoUrl('');
  };

  const handleUrlSave = (url: string) => {
    clear();
    setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Organization name is required');
    if (!canEdit) return toast.error('Only the organization admin can change branding');
    setSaving(true);
    if (pendingFile) setUploading(true);
    try {
      let finalLogoUrl = logoUrl;
      if (pendingFile) {
        const { url } = await orgService.uploadLogo(pendingFile, organization.id);
        finalLogoUrl = url;
      }
      const updated = await orgService.update(organization.id, {
        name: name.trim(),
        themeColor,
        logoUrl: finalLogoUrl || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
      });
      clear();
      dispatch(setOrganizationForSchool(updated));
      if (updated?.themeColor) window.dispatchEvent(new Event('org-theme-changed'));
      toast.success('Organization details updated — applied instantly');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <LogoUpload
        logoUrl={previewUrl ?? logoUrl}
        name={name || 'Org'}
        uploading={uploading || saving}
        fileRef={fileRef}
        onChange={(file) => file && handleLogo(file)}
        onRemove={handleRemove}
        onUrlSave={handleUrlSave}
      />
      {hasPending && (
        <p className="text-xs text-amber-600">Logo staged — click &ldquo;Save Changes&rdquo; to upload and apply.</p>
      )}
      <Input label="Organization Name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Theme Color</p>
        <ThemeColorPicker value={themeColor} onChange={setThemeColor} />
      </div>

      {/* Contact Info */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" placeholder="0300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} />
          <Input label="Email" type="email" placeholder="info@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} />
        </div>
        <Input label="Website" placeholder="https://school.edu" className="mt-4" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={!canEdit} />
      </div>

      <OrgSocialLinks
        links={{ facebookUrl, instagramUrl, twitterUrl, youtubeUrl }}
        onChange={(field, value) => {
          if (field === 'facebookUrl') setFacebookUrl(value);
          if (field === 'instagramUrl') setInstagramUrl(value);
          if (field === 'twitterUrl') setTwitterUrl(value);
          if (field === 'youtubeUrl') setYoutubeUrl(value);
        }}
        disabled={!canEdit}
      />

      {!canEdit && (
        <p className="text-xs text-gray-500">
          Only the organization admin can change branding &amp; details.
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <Button loading={saving} onClick={handleSave} disabled={!canEdit}>Save Changes</Button>
      </div>
    </div>
  );
}
