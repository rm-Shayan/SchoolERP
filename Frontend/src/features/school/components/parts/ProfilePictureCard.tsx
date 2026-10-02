'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/lib/api';
import { getInitials, validateImageUpload } from '@/lib/utils';
import { Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useStagedImage } from './useStagedImage';

/**
 * Avatar card — file select par upload NAHI, sirf preview stage hota hai.
 * Upload explicit "Save Photo" click par fire hota hai (Discard par cancel).
 */
export function ProfilePictureCard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { pendingFile, previewUrl: preview, hasPending, stage, clear } = useStagedImage();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageUpload(file);
      if (err) { toast.error(err); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
      stage(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [stage]
  );

  const savePhoto = useCallback(async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const updated = await authService.uploadAvatar(pendingFile);
      dispatch(setUser(updated));
      clear();
      toast.success('Profile picture updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [dispatch, pendingFile, clear]);

  return (
    <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="relative">
        <div className="h-20 w-20 rounded-full ring-4 ring-primary-100 overflow-hidden bg-primary-50 flex items-center justify-center">
          {preview ?? user?.avatarUrl ? (
            <img src={preview ?? user?.avatarUrl ?? ''} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary-600">{user ? getInitials(user.name) : '?'}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
        <p className="text-[11px] text-primary-600 font-medium mt-0.5 uppercase tracking-wide">{user?.role?.replace('_', ' ')}</p>
        {hasPending && (
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" loading={uploading} onClick={savePhoto}>Save Photo</Button>
            <Button size="sm" variant="ghost" onClick={clear} disabled={uploading}>Discard</Button>
          </div>
        )}
      </div>
    </div>
  );
}