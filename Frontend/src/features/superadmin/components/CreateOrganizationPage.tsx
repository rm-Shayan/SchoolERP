'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orgService } from '@/lib/api';
import { Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useForm } from '@/lib/utils';
import OrgFormFields from './parts/OrgFormFields';
import AdminFields from './parts/AdminFields';
import OrgLogoField from './parts/OrgLogoField';
import SmtpFields from './parts/SmtpFields';
import CloudFields from './parts/CloudFields';
import OrgCreatedPanel from './parts/OrgCreatedPanel';
import { initialOrgCreate, orgCreateValidators, type OrgCreateValues } from './parts/orgForm';
import { toCreatePayload } from './parts/orgFormPayload';
import SectionCard from './parts/SectionCard';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState<{ id: string; name: string; code: string } | null>(null);

  const { values, errors, isSubmitting, setValue, handleSubmit } = useForm<OrgCreateValues>({
    initialValues: initialOrgCreate(),
    validators: orgCreateValidators,
    onSubmit: async (v) => {
      try {
        const result = await orgService.create(toCreatePayload(v));
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
        const msg = err?.response?.data?.message || err?.message || 'Failed to create organization';
        toast.error(msg);
      }
    },
  });

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.name, e.target.value),
    [setValue]
  );

  if (credentials) {
    return (
      <OrgCreatedPanel
        credentials={credentials}
        emailConfigured={emailConfigured}
        defaultBranch={defaultBranch}
        onDashboard={() => router.push('/admin/dashboard')}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5 text-white shadow-lg shadow-primary-600/15 sm:p-7">
        <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Organization</h1>
          <p className="mt-1 text-sm text-white/75">Set up your tenant, principal account and optional integrations.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80"><span>01 Details</span><span>02 Principal</span><span>03 Email</span><span>04 Storage</span></div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="h-2 flex-1 rounded-full bg-gray-100">
            <div className={`h-full rounded-full transition-all ${s <= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          </div>
        ))}
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Complete the required details to create the organization</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SectionCard step={1} title="Organization Details" icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        } required>
          <OrgFormFields values={values} errors={errors} onChange={onFieldChange} />
          <OrgLogoField name={values.name} logoUrl={values.logoUrl} onLogoUrl={setValue} />
        </SectionCard>

        <SectionCard step={2} title="Principal Credentials" icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        } required>
          <p className="text-sm text-gray-500 mb-2">First branch ka Principal (Admin) account.</p>
          <AdminFields values={values} errors={errors} onChange={onFieldChange} showUsername />
        </SectionCard>

        <SectionCard step={3} title="Email Configuration" defaultOpen={false} icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        }>
          <p className="text-sm text-gray-500">Gmail App Password — notifications isi se jayengi.</p>
          <SmtpFields values={values} errors={errors} onChange={onFieldChange} />
        </SectionCard>

        <SectionCard step={4} title="Cloud Storage" defaultOpen={false} icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
        }>
          <p className="text-sm text-gray-500">Organization ki apni Cloudinary.</p>
          <CloudFields values={values} errors={errors} onChange={onFieldChange} hint="Agar chhod dein to platform storage use hogi." />
        </SectionCard>

        {/* Submit area */}
        <div className="sticky bottom-0 rounded-xl border border-gray-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/dashboard')} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Organization
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
