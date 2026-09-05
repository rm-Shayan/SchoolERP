'use client';

import { Card, CardContent, Input, Button } from '@/features/shared/components';
import { useForm, required, isEmail, isPhonePK } from '@/lib/utils';
import { parentService } from '@/lib/api';
import type { ParentProfile } from '@/lib/api/parentService';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import toast from 'react-hot-toast';

interface ProfileEditFormProps {
  parent: ParentProfile;
  onSaved: (updated: ParentProfile) => void;
}

export default function ProfileEditForm({ parent, onSaved }: ProfileEditFormProps) {
  const color = getOrgThemeColor() || '#6366f1';
  const gradient = `linear-gradient(135deg, ${color}, ${color}cc)`;

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: parent.name, phone: parent.phone ?? '', email: parent.email ?? '' },
    validators: {
      name: required('Full name is required'),
      phone: isPhonePK('Enter a valid phone number (e.g. 03211234567)'),
      email: isEmail('Enter a valid email address'),
    },
    onSubmit: async (v) => {
      const updated = await parentService.updateMe({
        name: v.name as string,
        phone: (v.phone as string) || undefined,
        email: (v.email as string) || undefined,
      });
      toast.success('Profile updated');
      onSaved(updated);
    },
  });

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: gradient }} />
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Edit Profile</h3>
        <p className="text-xs text-gray-500 mb-4">Update your contact details — school alerts go to this email & phone.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Full Name"
            name="name"
            value={values.name as string}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone"
              name="phone"
              value={values.phone as string}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              error={errors.phone}
              placeholder="e.g. 03211234567"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={values.email as string}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-[11px] text-gray-400 mr-auto">WhatsApp number is managed by the school.</span>
            <Button type="submit" loading={isSubmitting} size="sm">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}