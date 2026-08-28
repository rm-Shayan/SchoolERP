'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/lib/api';
import { getInitials, validateImageUpload } from '@/lib/utils';
import { Input, Button } from '@/features/shared/components';
import { useForm, composeValidators, required, minLength, isPhonePK } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfileSection() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageUpload(file);
      if (err) { toast.error(err); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
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

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          <p className="text-sm text-gray-500">Update your name, phone and profile picture.</p>
        </div>
      </div>

      {/* Avatar */}
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
            {uploading ? (
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <p className="text-[11px] text-primary-600 font-medium mt-0.5 uppercase tracking-wide">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <ProfileForm />
    </div>
  );
}

function ProfileForm() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
    validators: {
      name: composeValidators(required('Name is required'), minLength(2, 'At least 2 characters')),
      phone: isPhonePK('Enter a valid phone number'),
    },
    onSubmit: async (v) => {
      try {
        const updated = await authService.updateMe({
          name: (v.name as string).trim(),
          phone: (v.phone as string).trim() || undefined,
        });
        dispatch(setUser(updated));
        toast.success('Profile saved');
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to save profile');
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          name="name"
          value={values.name as string}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          required
        />
        <Input
          label="Phone"
          name="phone"
          placeholder="03xx-xxxxxxx"
          value={values.phone as string}
          onChange={handleChange}
          onBlur={() => handleBlur('phone')}
          error={errors.phone}
        />
      </div>
      <Input label="Email" value={user?.email ?? ''} disabled />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </div>
    </form>
  );
}
