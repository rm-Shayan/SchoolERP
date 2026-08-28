import { useForm, composeValidators, required, isEmail, isPassword } from '@/lib/utils';
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

export default function AssignAdminModal({ open, schoolId, onClose, onAssigned }: AssignAdminModalProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '' },
    validators: {
      email: composeValidators(required('Admin email is required'), isEmail()),
      password: isPassword(),
    },
    onSubmit: async (v) => {
      try {
        const result = await schoolService.assignAdmin(schoolId, {
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

  return (
    <Modal open={open} onClose={onClose} title="Change Branch Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
