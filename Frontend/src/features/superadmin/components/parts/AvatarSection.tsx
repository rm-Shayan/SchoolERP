'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/lib/api';
import { getInitials, validateImageUpload } from '@/lib/utils';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface AvatarSectionProps {
  user: User | null;
}

export default function AvatarSection({ user }: AvatarSectionProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateImageUpload(file);
      if (validationError) {
        toast.error(validationError);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPreview(URL.createObjectURL(file));
      setUploading(true);
      try {
        const updated = await authService.uploadAvatar(file);
        dispatch(setUser(updated));
        setPreview(null);
        toast.success('Profile picture updated');
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to upload image');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [dispatch]
  );

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  const avatarSrc = preview ?? user?.avatarUrl ?? null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 min-w-0">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full ring-4 ring-primary-100 overflow-hidden bg-primary-50 flex items-center justify-center">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                {user ? getInitials(user.name) : 'SA'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-60"
            title="Change profile picture"
          >
            {uploading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="text-center min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {user?.avatarUrl ? 'Change profile picture' : 'Upload profile picture'}
        </button>
      </div>
    </div>
  );
}
