import { Button, Input, Modal } from '@/features/shared/components';
import { composeValidators, isEmail, isOrgCode, isPhonePK, required, useForm } from '@/lib/utils';
import type { BranchFormValues } from './helpers';

interface AddBranchModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: BranchFormValues) => Promise<boolean>;
}

const INITIAL_VALUES: BranchFormValues = {
  name: '',
  code: '',
  address: '',
  phone: '',
  adminEmail: '',
  adminName: '',
  adminPassword: '',
};

export default function AddBranchModal({ open, onClose, onCreate }: AddBranchModalProps) {
  const { values, errors, isSubmitting, handleChange, handleSubmit, reset } = useForm<BranchFormValues>({
    initialValues: INITIAL_VALUES,
    validators: {
      name: required('Branch name is required'),
      code: composeValidators(required('Branch code is required'), isOrgCode()),
      phone: isPhonePK(),
      adminEmail: composeValidators(required('Admin email is required'), isEmail()),
    },
    onSubmit: async (v) => {
      const ok = await onCreate(v);
      if (ok) {
        reset();
        onClose();
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add New Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Branch Name" name="name" placeholder="e.g. Gulshan Campus" value={values.name} onChange={handleChange} error={errors.name} required />
        <Input label="Branch Code" name="code" placeholder="e.g. GULSHAN-01" value={values.code} onChange={handleChange} error={errors.code} required />
        <Input label="Address (optional)" name="address" placeholder="Full address" value={values.address} onChange={handleChange} />
        <Input label="Phone (optional)" name="phone" placeholder="03001234567" value={values.phone} onChange={handleChange} error={errors.phone} />

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Principal Name" name="adminName" placeholder="Full name" value={values.adminName} onChange={handleChange} />
            <Input label="Principal Email" name="adminEmail" type="email" placeholder="principal@school.com" value={values.adminEmail} onChange={handleChange} error={errors.adminEmail} required />
          </div>
          <Input label="Password (optional — auto-generated)" name="adminPassword" type="password" placeholder="Leave blank to auto-generate" value={values.adminPassword} onChange={handleChange} />
          <p className="text-xs text-gray-500">A Principal (Admin) account will be created for this branch and credentials will be emailed.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Create Branch</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
