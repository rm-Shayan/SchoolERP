'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/lib/api';
import { useForm, composeValidators, required, minLength, isPhonePK } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Input, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

export default function ProfileTab() {
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          <p className="text-sm text-gray-500">Update your name and phone number.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="h-16 w-16 rounded-full ring-4 ring-primary-100 overflow-hidden bg-primary-50 flex items-center justify-center">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary-600">{user ? getInitials(user.name) : '?'}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <p className="text-[11px] text-primary-600 font-medium mt-0.5 uppercase tracking-wide">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" name="name" value={values.name as string} onChange={handleChange} onBlur={() => handleBlur('name')} error={errors.name} required />
          <Input label="Phone" name="phone" placeholder="03xx-xxxxxxx" value={values.phone as string} onChange={handleChange} onBlur={() => handleBlur('phone')} error={errors.phone} />
        </div>
        <Input label="Email" value={user?.email ?? ''} disabled />
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
