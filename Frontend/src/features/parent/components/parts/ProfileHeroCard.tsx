'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, Badge } from '@/features/shared/components';
import { getApiErrorMessage } from '@/lib/utils';
import { parentService, PARENT_PROFILE_UPDATED_EVENT, type ParentProfile } from '@/lib/api/parentService';
import { PortalAvatar } from '../portalCards';

interface ProfileHeroCardProps {
  name: string;
  badgeLabel: string;
  badgeVariant?: 'success' | 'info';
  meta: string;
  imageUrl?: string | null;
  color: string;
  memberSince?: string | null;
  canEditPhoto: boolean;
  onProfilePhotoUploaded?: (profile: ParentProfile) => void;
}

export default function ProfileHeroCard({
  name, badgeLabel, badgeVariant = 'info', meta, imageUrl, color,
  memberSince, canEditPhoto, onProfilePhotoUploaded,
}: ProfileHeroCardProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const gradient = `linear-gradient(135deg, ${color}, ${color}cc)`;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canEditPhoto) return;
    setUploading(true);
    try {
      const updated = await parentService.uploadAvatar(file);
      toast.success('Profile photo updated');
      onProfilePhotoUploaded?.(updated);
      window.dispatchEvent(new Event(PARENT_PROFILE_UPDATED_EVENT));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Photo upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: gradient }} />
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
        <div className="relative shrink-0 self-start sm:self-auto">
          <PortalAvatar src={imageUrl ?? null} name={name} color={color} className="h-16 w-16 rounded-2xl shadow-md" />
          {canEditPhoto && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change photo"
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110 disabled:opacity-60"
                style={{ background: gradient }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">{name}</h2>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{meta}</p>
          {memberSince && <p className="mt-0.5 text-xs text-gray-400">{memberSince}</p>}
          {uploading && <p className="mt-1 text-xs font-medium" style={{ color }}>Uploading photo…</p>}
        </div>
      </CardContent>
    </Card>
  );
}
