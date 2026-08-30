import { useState } from 'react';
import { Button, Input, Modal } from '@/features/shared/components';
import { cn, composeValidators, isEmail, isOrgCode, isPhonePK, required, useForm } from '@/lib/utils';
import type { BranchFormValues } from './branchForm';
import OrgAdminPicker from './OrgAdminPicker';
import BranchSecretsFields from './BranchSecretsFields';

interface AddBranchModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onCreate: (values: BranchFormValues) => Promise<boolean>;
}

type AdminMode = 'new' | 'existing';

const INITIAL_VALUES: BranchFormValues = {
  name: '',
  code: '',
  address: '',
  phone: '',
  adminEmail: '',
  adminName: '',
  adminPassword: '',
  existingAdminEmail: '',
  smtpUsername: '',
  smtpPassword: '',
  cloudName: '',
  cloudApiKey: '',
  cloudApiSecret: '',
};

export default function AddBranchModal({ open, onClose, organizationId, onCreate }: AddBranchModalProps) {
  const [mode, setMode] = useState<AdminMode>('new');
  const { values, errors, isSubmitting, setValue, setErrors, handleChange, handleSubmit, reset } = useForm<BranchFormValues>({
    initialValues: INITIAL_VALUES,
    validators: {
      name: required('Branch name is required'),
      code: composeValidators(required('Branch code is required'), isOrgCode()),
      phone: isPhonePK(),
      adminEmail: mode === 'new' ? composeValidators(required('Admin email is required'), isEmail()) : undefined,
      existingAdminEmail: mode === 'existing' ? composeValidators(required('Existing admin email is required'), isEmail()) : undefined,
      smtpUsername: mode === 'new' ? required('Gmail is required for new admin') : undefined,
      smtpPassword: mode === 'new' ? required('App password is required for new admin') : undefined,
      cloudName: mode === 'new' ? required('Cloud name is required for new admin') : undefined,
      cloudApiKey: mode === 'new' ? required('API key is required for new admin') : undefined,
      cloudApiSecret: mode === 'new' ? required('API secret is required for new admin') : undefined,
    },
    onSubmit: async (v) => {
      const ok = await onCreate(v);
      if (ok) {
        reset();
        setMode('new');
        onClose();
      }
    },
  });

  const toggle = (m: AdminMode) => {
    setMode(m);
    // Form VALUES persist karo (user ka entered data na ghute) — sirf uss
    // mode ke irrelevant errors clear hote hain.
    setErrors((prev) => {
      const next = { ...prev };
      const clear = m === 'new'
        ? ['existingAdminEmail']
        : ['adminEmail', 'smtpUsername', 'smtpPassword', 'cloudName', 'cloudApiKey', 'cloudApiSecret'];
      clear.forEach((k) => delete next[k]);
      return next;
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Branch Name" name="name" placeholder="e.g. Gulshan Campus" value={values.name} onChange={handleChange} error={errors.name} required />
        <Input label="Branch Code" name="code" placeholder="e.g. GULSHAN-01" value={values.code} onChange={handleChange} error={errors.code} required />
        <Input label="Address (optional)" name="address" placeholder="Full address" value={values.address} onChange={handleChange} />
        <Input label="Phone (optional)" name="phone" placeholder="03001234567" value={values.phone} onChange={handleChange} error={errors.phone} />

        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['new', 'existing'] as AdminMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              className={cn(
                'flex-1 py-2 text-xs font-semibold transition-colors',
                mode === m ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              {m === 'new' ? 'New Admin Account' : 'Existing Admin (same account)'}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {mode === 'new' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Principal Name" name="adminName" placeholder="Full name" value={values.adminName} onChange={handleChange} />
                <Input label="Principal Email" name="adminEmail" type="email" placeholder="principal@school.com" value={values.adminEmail} onChange={handleChange} error={errors.adminEmail} required />
              </div>
              <Input label="Password (optional — auto-generated)" name="adminPassword" type="password" placeholder="Leave blank to auto-generate" value={values.adminPassword} onChange={handleChange} />
              <p className="text-xs text-gray-500">A new Principal (Admin) account is created and credentials are emailed.</p>
            </>
          ) : (
            <>
              <OrgAdminPicker organizationId={organizationId} value={values.existingAdminEmail} onSelect={(e) => setValue('existingAdminEmail', e)} />
              <Input
                label="Existing Admin Email (same organization)"
                name="existingAdminEmail"
                type="email"
                placeholder="admin@yourorg.com"
                value={values.existingAdminEmail}
                onChange={handleChange}
                error={errors.existingAdminEmail}
                required
              />
              <p className="text-xs text-gray-500">No new credentials — wahi email/password/username use hoga, bas Settings → My Branches se is branch par switch karega.</p>
            </>
          )}
        </div>

        <BranchSecretsFields values={values} errors={errors} onChange={handleChange} required={mode === 'new'} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Create Branch</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}