import { useForm, composeValidators, required, minLength, isPhonePK } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/lib/api';
import { Input, Button } from '@/features/shared/components';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface ProfileFormProps {
  user: User | null;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const dispatch = useAppDispatch();

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
    validators: {
      name: composeValidators(
        required('Name is required'),
        minLength(2, 'Name must be at least 2 characters')
      ),
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
    <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
      <div>
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="h-5 w-5 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Update the name and phone number shown to other admins.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
