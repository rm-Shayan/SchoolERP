'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orgService } from '@/lib/api';
import { Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useForm, cn } from '@/lib/utils';
import OrgFormFields from './parts/OrgFormFields';
import AdminFields from './parts/AdminFields';
import OrgLogoField from './parts/OrgLogoField';
import SmtpFields from './parts/SmtpFields';
import CloudFields from './parts/CloudFields';
import OrgCreatedPanel from './parts/OrgCreatedPanel';
import OrgAdminPicker from './parts/OrgAdminPicker';
import { initialOrgCreate, validateOrgCreateFields, type OrgCreateValues } from './parts/orgForm';
import { toCreatePayload } from './parts/orgFormPayload';
import SectionCard from './parts/SectionCard';

type AdminMode = 'new' | 'existing';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [adminMode, setAdminMode] = useState<AdminMode>('new');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState<{ id: string; name: string; code: string } | null>(null);

  const { values, errors, isSubmitting, setValue, setErrors, handleSubmit } = useForm<OrgCreateValues>({
    initialValues: initialOrgCreate(),
    validators: {},
    onSubmit: async (v) => {
      const allErrs = validateOrgCreateFields(v, adminMode);
      if (Object.keys(allErrs).length > 0) { setErrors(allErrs); return; }
      try {
        const payload = toCreatePayload(v);
        if (adminMode === 'existing' && v.adminEmail) {
          payload.existingAdminEmail = v.adminEmail.trim();
          delete payload.adminEmail; delete payload.adminName;
          delete payload.adminPassword; delete payload.smtp;
          delete (payload as any).cloudinary;
        }
        const result = await orgService.create(payload as any);
        if (result.adminCredentials) {
          setCredentials(result.adminCredentials);
          setEmailConfigured(result.emailConfigured ?? true);
          setDefaultBranch(result.defaultBranch ?? null);
          toast.success(result.emailConfigured ? 'Organization created! Credentials emailed.' : 'Organization created!');
        } else {
          toast.success('Organization created successfully');
          router.push('/admin/dashboard');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to create organization');
      }
    },
  });

  const onFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.name, e.target.value);
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

  if (credentials) {
    return <OrgCreatedPanel credentials={credentials} emailConfigured={emailConfigured} defaultBranch={defaultBranch} onDashboard={() => router.push('/admin/dashboard')} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5 text-white shadow-lg sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create Organization</h1>
            <p className="mt-1 text-sm text-white/75">Set up your tenant, principal account and optional integrations.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SectionCard step={1} title="Organization Details" required>
          <OrgFormFields values={values} errors={errors} onChange={onFieldChange} slugLabel="Slug (auto-generated)" codePlaceholder="e.g. FALCON" />
          <OrgLogoField name={values.name} logoUrl={values.logoUrl} onLogoUrl={setValue} />
        </SectionCard>

        <SectionCard step={2} title="Admin Account" required>
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
              <p className="text-sm text-gray-500 mb-2">Principal (Admin) account for the first branch.</p>
              <AdminFields values={values} errors={errors} onChange={onFieldChange} showUsername />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">Select an unassigned admin — they become this org&apos;s first branch Principal.</p>
              <OrgAdminPicker organizationId="" value={values.adminEmail} onSelect={(email) => setValue('adminEmail', email)} />
              {values.adminEmail && <p className="mt-2 text-sm text-green-600 font-medium">Selected: {values.adminEmail}</p>}
            </>
          )}
        </SectionCard>

        {adminMode === 'new' && (
          <>
            <SectionCard step={3} title="Email Configuration" defaultOpen={false}>
              <p className="text-sm text-gray-500">Gmail App Password — notifications will be sent through it.</p>
              <SmtpFields values={values} errors={errors} onChange={onFieldChange} />
            </SectionCard>
            <SectionCard step={4} title="Cloud Storage" defaultOpen={false}>
              <p className="text-sm text-gray-500">Organization's own Cloudinary.</p>
              <CloudFields values={values} errors={errors} onChange={onFieldChange} hint="Leave empty to use platform storage." />
            </SectionCard>
          </>
        )}

        <div className="sticky bottom-0 rounded-xl border border-gray-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/dashboard')} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Create Organization</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
