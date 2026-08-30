import { useState } from 'react';
import { cn, composeValidators, isEmail, isPassword, required, useForm } from '@/lib/utils';
import { schoolService, type SchoolAdminAssignResult } from '@/lib/api/schoolService';
import { Modal, Input, Button } from '@/features/shared/components';
import type { School } from '@/types';
import toast from 'react-hot-toast';

interface AssignAdminModalProps {
  open: boolean;
  schoolId: string;
  onClose: () => void;
  onAssigned: (fresh: School, result: SchoolAdminAssignResult) => void;
}

type Mode = 'new' | 'existing';

export default function AssignAdminModal({ open, schoolId, onClose, onAssigned }: AssignAdminModalProps) {
  const [mode, setMode] = useState<Mode>('new');
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '', existingEmail: '' },
    validators: {
      email: mode === 'new' ? composeValidators(required('Admin email is required'), isEmail()) : undefined,
      password: isPassword(),
      existingEmail: mode === 'existing' ? composeValidators(required('Existing admin email is required'), isEmail()) : undefined,
    },
    onSubmit: async (v) => {
      try {
        const isExisting = mode === 'existing';
        const result = await schoolService.assignAdmin(schoolId, isExisting
          ? { existingAdminEmail: (v.existingEmail as string).trim() }
          : {
              adminEmail: (v.email as string).trim(),
              adminName: (v.name as string).trim() || undefined,
              adminPassword: (v.password as string) || undefined,
            });
        const fresh = await schoolService.getById(schoolId);
        onAssigned(fresh, result);
        if (result.adminCredentials) {
          toast.success('New principal created! Credentials emailed.');
        } else if (result.admin) {
          toast.success(`Branch admin updated — ${result.admin.name} manages this branch.`);
        } else {
          toast.success('Branch admin updated');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update branch admin');
      }
    },
  });

  const toggle = (m: Mode) => setMode(m);

  return (
    <Modal open={open} onClose={onClose} title="Change Branch Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['new', 'existing'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              className={cn(
                'flex-1 py-2 text-xs font-semibold transition-colors',
                mode === m ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              {m === 'new' ? 'New Principal' : 'Existing Admin (same account)'}
            </button>
          ))}
        </div>

        {mode === 'new' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Principal Name"
                name="name"
                placeholder="Full name"
                value={values.name as string}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                error={errors.name}
              />
              <Input
                label="Principal Email"
                name="email"
                type="email"
                placeholder="principal@school.com"
                value={values.email as string}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                error={errors.email}
                required
              />
            </div>
            <Input
              label="Password (optional — auto-generated)"
              name="password"
              type="password"
              placeholder="Leave blank to auto-generate"
              value={values.password as string}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              error={errors.password}
            />
            <p className="text-xs text-gray-500 -mt-2">A new Principal (Admin) account is created for this branch and credentials are emailed. The previous principal is deactivated.</p>
          </>
        ) : (
          <>
            <Input
              label="Existing Admin Email (same organization)"
              name="existingEmail"
              type="email"
              placeholder="admin@yourorg.com"
              value={values.existingEmail as string}
              onChange={handleChange}
              onBlur={() => handleBlur('existingEmail')}
              error={errors.existingEmail}
              required
            />
            <p className="text-xs text-gray-500 -mt-2">No new credentials — wahi account/branch subject hai. Previous principal deactivate nahi hota; wo bhi mast ek aur branch manage kar sakta hai.</p>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}