'use client';

import { useCallback, useEffect } from 'react';
import { orgService } from '@/lib/api';
import { Button, Modal } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useForm } from '@/lib/utils';
import OrgFormFields from './parts/OrgFormFields';
import AdminFields from './parts/AdminFields';
import OrgLogoField from './parts/OrgLogoField';
import SmtpFields from './parts/SmtpFields';
import CloudFields from './parts/CloudFields';
import { initialOrgCreate, orgCreateValidators, type OrgCreateValues } from './parts/orgForm';
import { toCreatePayload } from './parts/orgFormPayload';

interface CreateOrganizationProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateOrganization({ open, onClose, onCreated }: CreateOrganizationProps) {
  const { values, errors, isSubmitting, setValue, handleSubmit, reset } = useForm<OrgCreateValues>({
    initialValues: initialOrgCreate(),
    validators: orgCreateValidators,
    onSubmit: async (v) => {
      try {
        await orgService.create(toCreatePayload(v));
        toast.success('Organization created successfully!');
        onCreated?.();
        onClose();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to create organization');
      }
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.name, e.target.value),
    [setValue]
  );

  return (
    <Modal open={open} onClose={onClose} title="Create Organization" size="lg">
      <form onSubmit={handleSubmit} className="flex max-h-[80vh] flex-col">
        <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
            </div>
            <div><p className="text-sm font-semibold text-gray-900">Set up your organization</p><p className="mt-0.5 text-xs text-gray-600">Add the essential details now. Optional integrations can be configured later.</p></div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">1</span><div><h3 className="text-sm font-semibold text-gray-900">Organization details</h3><p className="text-xs text-gray-500">Brand identity, code and fee voucher details.</p></div></div>
          <OrgFormFields
            values={values}
            errors={errors}
            onChange={onFieldChange}
            slugLabel="Slug (optional)"
            codePlaceholder="e.g. FALCON"
          />
          <div className="mt-4">
            <OrgLogoField name={values.name} logoUrl={values.logoUrl} onLogoUrl={setValue} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">2</span><h3 className="text-sm font-semibold text-gray-900">Admin account</h3></div>
          <p className="mb-3 text-xs text-gray-500">
            Optional — this person becomes the Principal (Admin) of the first branch. Credentials are emailed once the organization is created.
          </p>
          <AdminFields
            values={values}
            errors={errors}
            onChange={onFieldChange}
            showUsername
            emailPlaceholder="principal@example.com"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">3</span><h3 className="text-sm font-semibold text-gray-900">Email sending <span className="font-normal text-gray-400">(optional)</span></h3></div>
          <p className="mb-3 text-xs text-gray-500">
            Organization ki apni Gmail — welcome email aur notifications isi se jati hain.
          </p>
          <SmtpFields values={values} errors={errors} onChange={onFieldChange} />
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">4</span><h3 className="text-sm font-semibold text-gray-900">Cloudinary storage <span className="font-normal text-gray-500">(optional)</span></h3></div>
          <p className="mb-3 text-xs text-gray-500">Use the organization&apos;s own Cloudinary account for photos and documents.</p>
          <CloudFields values={values} errors={errors} onChange={onFieldChange} hint="Leave all fields blank to use platform storage." />
        </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Create Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
}
