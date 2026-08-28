import { useForm, composeValidators, required, isOrgCode, isPhonePK } from '@/lib/utils';
import { schoolService } from '@/lib/api';
import { Modal, Input, Button } from '@/features/shared/components';
import type { School } from '@/types';
import toast from 'react-hot-toast';

interface EditSchoolModalProps {
  open: boolean;
  school: School;
  onClose: () => void;
  onSaved: (updated: School) => void;
}

export default function EditSchoolModal({ open, school, onClose, onSaved }: EditSchoolModalProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: school.name,
      code: school.code,
      address: school.address ?? '',
      phone: school.phone ?? '',
    },
    validators: {
      name: required('Branch name is required'),
      code: composeValidators(required('Branch code is required'), isOrgCode()),
      phone: isPhonePK('Enter a valid phone number'),
    },
    onSubmit: async (v) => {
      try {
        const updated = await schoolService.update(school.id, {
          name: v.name as string,
          code: v.code as string,
          address: (v.address as string) || undefined,
          phone: (v.phone as string) || undefined,
        });
        onSaved(updated);
        toast.success('Branch updated');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update branch');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Branch Name"
          name="name"
          value={values.name as string}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          required
        />
        <Input
          label="Branch Code"
          name="code"
          value={values.code as string}
          onChange={handleChange}
          onBlur={() => handleBlur('code')}
          error={errors.code}
          required
        />
        <Input
          label="Address (optional)"
          name="address"
          value={values.address as string}
          onChange={handleChange}
        />
        <Input
          label="Phone (optional)"
          name="phone"
          value={values.phone as string}
          onChange={handleChange}
          onBlur={() => handleBlur('phone')}
          error={errors.phone}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
