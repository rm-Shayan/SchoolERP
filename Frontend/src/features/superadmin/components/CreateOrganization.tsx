'use client';

import { useCallback, useEffect, useState } from 'react';
import { orgService } from '@/lib/api';
import { Button, Modal } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useForm, cn } from '@/lib/utils';
import OrgFormFields from './parts/OrgFormFields';
import AdminFields from './parts/AdminFields';
import OrgLogoField from './parts/OrgLogoField';
import SmtpFields from './parts/SmtpFields';
import CloudFields from './parts/CloudFields';
import OrgAdminPicker from './parts/OrgAdminPicker';
import { initialOrgCreate, orgCreateValidators, validateOrgCreateFields, type OrgCreateValues } from './parts/orgForm';
import { toCreatePayload } from './parts/orgFormPayload';

interface Props { open: boolean; onClose: () => void; onCreated?: () => void; }
type AdminMode = 'new' | 'existing';

export default function CreateOrganization({ open, onClose, onCreated }: Props) {
  const [adminMode, setAdminMode] = useState<AdminMode>('new');
  const { values, errors, isSubmitting, setValue, setErrors, handleSubmit, reset } = useForm<OrgCreateValues>({
    initialValues: initialOrgCreate(),
    validators: orgCreateValidators,
    onSubmit: async (v) => {
      // Manual validation for all fields
      const allErrs = validateOrgCreateFields(v, adminMode);
      if (Object.keys(allErrs).length > 0) {
        setErrors(allErrs);
        return;
      }
      try {
        const payload = toCreatePayload(v);
        if (adminMode === 'existing' && v.adminEmail) {
          payload.existingAdminEmail = v.adminEmail.trim();
          delete payload.adminEmail; delete payload.adminName;
          delete payload.adminPassword; delete payload.smtp;
          delete (payload as any).cloudinary;
        }
        await orgService.create(payload as any);
        toast.success('Organization created successfully!');
        onCreated?.(); onClose();
      } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create organization'); }
    },
  });

  useEffect(() => { if (open) { reset(); setAdminMode('new'); } }, [open, reset]);
  const onFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.name, e.target.value);
    // Auto-generate slug from name
    if (e.target.name === 'name') {
      const slug = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [setValue]);

  const toggleAdminMode = useCallback((m: AdminMode) => {
    setAdminMode(m);
    if (m === 'existing') {
      setValue('adminName', ''); setValue('adminPassword', '');
      setValue('smtpUsername', ''); setValue('smtpPassword', '');
      setValue('cloudName', ''); setValue('cloudApiKey', ''); setValue('cloudApiSecret', '');
    }
  }, [setValue]);

  const step = (n: number, title: string, extra?: string) => (
    <div className="mb-3 flex items-center gap-2">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${n === 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{n}</span>
      <h3 className="text-sm font-semibold text-gray-900">{title} {extra && <span className="font-normal text-gray-400">{extra}</span>}</h3>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Create Organization" size="lg">
      <form onSubmit={handleSubmit} className="flex max-h-[80vh] flex-col">
        <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
            </div>
            <div><p className="text-sm font-semibold text-gray-900">Set up your organization</p><p className="mt-0.5 text-xs text-gray-600">Add essential details now. Optional integrations later.</p></div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            {step(1, 'Organization details')}
            <OrgFormFields values={values} errors={errors} onChange={onFieldChange} slugLabel="Slug (optional)" codePlaceholder="e.g. FALCON" />
            <div className="mt-4"><OrgLogoField name={values.name} logoUrl={values.logoUrl} onLogoUrl={setValue} /></div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
            {step(2, 'Admin account')}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-3">
              {(['new', 'existing'] as AdminMode[]).map((m) => (
                <button key={m} type="button" onClick={() => toggleAdminMode(m)}
                  className={cn('flex-1 py-2 text-xs font-semibold transition-colors', adminMode === m ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                  {m === 'new' ? 'Create New Admin' : 'Use Existing Unassigned Admin'}
                </button>
              ))}
            </div>
            {adminMode === 'new' ? (
              <>
                <p className="mb-3 text-xs text-gray-500">New Principal for the first branch. Credentials emailed.</p>
                <AdminFields values={values} errors={errors} onChange={onFieldChange} showUsername emailPlaceholder="principal@example.com" />
              </>
            ) : (
              <>
                <p className="mb-3 text-xs text-gray-500">Select an unassigned admin — they become this org&apos;s first branch Principal.</p>
                <OrgAdminPicker organizationId="" value={values.adminEmail} onSelect={(email) => setValue('adminEmail', email)} />
                {values.adminEmail && <p className="mt-2 text-xs text-green-600 font-medium">Selected: {values.adminEmail}</p>}
              </>
            )}
          </div>

          {adminMode === 'new' && (
            <>
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                {step(3, 'Email sending', '(optional)')}
                <p className="mb-3 text-xs text-gray-500">Organization&apos;s own Gmail for welcome email and notifications.</p>
                <SmtpFields values={values} errors={errors} onChange={onFieldChange} />
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm sm:p-5">
                {step(4, 'Cloudinary storage', '(optional)')}
                <p className="mb-3 text-xs text-gray-500">Use the organization&apos;s own Cloudinary for photos and documents.</p>
                <CloudFields values={values} errors={errors} onChange={onFieldChange} hint="Leave blank to use platform storage." />
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Create Organization</Button>
        </div>
      </form>
    </Modal>
  );
}
