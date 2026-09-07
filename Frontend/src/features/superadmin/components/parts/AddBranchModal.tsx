import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from '@/features/shared/components';
import { cn, composeValidators, isEmail, isOrgCode, isPhonePK, required, useForm } from '@/lib/utils';
import { orgService } from '@/lib/api';
import type { BranchFormValues } from './branchForm';
import OrgAdminPicker from './OrgAdminPicker';
import BranchSecretsFields from './BranchSecretsFields';

interface AddBranchModalProps {
  open: boolean;
  onClose: () => void;
  organizationId?: string;
  onCreate: (values: BranchFormValues & { organizationId: string }) => Promise<boolean>;
}

type AdminMode = 'new' | 'existing';

export default function AddBranchModal({ open, onClose, organizationId, onCreate }: AddBranchModalProps) {
  const [mode, setMode] = useState<AdminMode>('new');
  const [orgOpts, setOrgOpts] = useState<{ value: string; label: string }[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);

  const { values, errors, isSubmitting, setValue, setErrors, handleChange, handleSubmit, reset } = useForm<BranchFormValues & { organizationId: string }>({
    initialValues: {
      organizationId: organizationId ?? '',
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
    },
    validators: {
      ...(organizationId ? {} : { organizationId: required('Select an organization') }),
      name: required('Branch name is required'),
      code: composeValidators(required('Branch code is required'), isOrgCode()),
      phone: isPhonePK(),
      adminEmail: mode === 'new' ? composeValidators(required('Admin email is required'), isEmail()) : undefined,
      existingAdminEmail: mode === 'existing' ? composeValidators(required('Email is required'), isEmail()) : undefined,
      ...(mode === 'new' ? { smtpUsername: required('Gmail is required'), smtpPassword: required('App password is required'), cloudName: required('Cloud name is required'), cloudApiKey: required('API key is required'), cloudApiSecret: required('API secret is required') } : {}),
    },
    onSubmit: async (v) => {
      const ok = await onCreate({ ...v, organizationId: effectiveOrgId });
      if (ok) {
        reset();
        setMode('new');
        onClose();
      }
    },
  });

  const effectiveOrgId = organizationId ?? (values as any).organizationId ?? '';

  useEffect(() => {
    if (!open || organizationId) return;
    setOrgsLoading(true);
    orgService
      .getAll()            .then((orgs: any[]) => setOrgOpts(orgs.map((o) => ({ value: o.id, label: o.name }))))
            .catch(() => setOrgOpts([]))
      .finally(() => setOrgsLoading(false));
  }, [open, organizationId]);

  const toggle = (m: AdminMode) => {
    setMode(m);
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
        {!organizationId && (
          <Select
            label="Organization"
            name="organizationId"
            placeholder={orgsLoading ? 'Loading…' : 'Select organization'}
            options={orgOpts}
            value={(values as any).organizationId}
            onChange={handleChange}
            error={(errors as any).organizationId}
            required
          />
        )}
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
              <OrgAdminPicker organizationId={effectiveOrgId} value={values.existingAdminEmail} onSelect={(e) => setValue('existingAdminEmail', e)} />
              <Input label="Existing Admin Email" name="existingAdminEmail" type="email" placeholder="admin@yourorg.com" value={values.existingAdminEmail} onChange={handleChange} error={errors.existingAdminEmail} required />
              <p className="text-xs text-gray-500">No new credentials — the same email/password/username will be used; they can switch to this branch from Settings → My Branches.</p>
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
