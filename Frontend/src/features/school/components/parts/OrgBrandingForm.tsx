'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { orgService } from '@/lib/api';
import { Button, Input } from '@/features/shared/components';
import { setOrganizationForSchool } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { ThemeColorPicker } from './ThemeColorPicker';
import { LogoUpload } from './LogoUpload';

export function OrgBrandingForm() {
  const dispatch = useAppDispatch();
  const { organization, user } = useAppSelector((s) => s.auth);
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(organization?.name ?? '');
  const [themeColor, setThemeColor] = useState(organization?.themeColor ?? '#2563eb');
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl ?? '');
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
    setThemeColor(organization.themeColor ?? '#2563eb');
    setLogoUrl(organization.logoUrl ?? '');
    setPhone(organization.phone ?? '');
    setEmail(organization.email ?? '');
    setWebsite(organization.website ?? '');
    setFacebookUrl(organization.facebookUrl ?? '');
    setInstagramUrl(organization.instagramUrl ?? '');
    setTwitterUrl(organization.twitterUrl ?? '');
    setYoutubeUrl(organization.youtubeUrl ?? '');
  }, [organization]);

  if (!organization) return null;

  const handleLogo = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await orgService.uploadLogo(file, organization.id);
      setLogoUrl(url);
      toast.success('Logo uploaded — press Save to apply');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Organization name is required');
    if (!canEdit) return toast.error('Only the organization admin can change branding');
    setSaving(true);
    try {
      const updated = await orgService.update(organization.id, {
        name: name.trim(),
        themeColor,
        logoUrl: logoUrl || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
      });
      dispatch(setOrganizationForSchool(updated));
      toast.success('Organization details updated — applied instantly');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <LogoUpload
        logoUrl={logoUrl}
        name={name || 'Org'}
        uploading={uploading}
        fileRef={fileRef}
        onChange={(file) => file && handleLogo(file)}
        onRemove={() => setLogoUrl('')}
        onUrlSave={(url) => setLogoUrl(url)}
      />
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

      {/* Social Links */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Social Links</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            <Input placeholder="Facebook URL" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            <Input placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            <Input placeholder="Twitter / X URL" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            <Input placeholder="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} disabled={!canEdit} />
          </div>
        </div>
      </div>

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
