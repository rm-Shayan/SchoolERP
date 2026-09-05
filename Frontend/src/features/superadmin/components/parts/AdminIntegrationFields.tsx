'use client';

import { Input } from '@/features/shared/components';

interface AdminIntegrationFieldsProps {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (name: string) => void;
}

export default function AdminIntegrationFields({
  values, errors, onChange, onBlur,
}: AdminIntegrationFieldsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Integration Settings *</h4>
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Gmail App Password — notifications will be sent from this.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="SMTP Email" name="smtpUsername" type="email" placeholder="school@gmail.com"
            value={values.smtpUsername as string} onChange={onChange}
            onBlur={() => onBlur('smtpUsername')} error={errors.smtpUsername} required />
          <Input label="Gmail App Password" name="smtpPassword" type="password"
            placeholder="•••• •••• •••• ••••"
            value={values.smtpPassword as string} onChange={onChange}
            onBlur={() => onBlur('smtpPassword')} error={errors.smtpPassword} required />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Organization Cloudinary — for file storage.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Cloud Name" name="cloudName" placeholder="e.g. my-school-cloud"
            value={values.cloudName as string} onChange={onChange}
            onBlur={() => onBlur('cloudName')} error={errors.cloudName} required />
          <Input label="API Key" name="cloudApiKey" placeholder="API Key"
            value={values.cloudApiKey as string} onChange={onChange}
            onBlur={() => onBlur('cloudApiKey')} error={errors.cloudApiKey} required />
          <Input label="API Secret" name="cloudApiSecret" type="password" placeholder="API Secret"
            value={values.cloudApiSecret as string} onChange={onChange}
            onBlur={() => onBlur('cloudApiSecret')} error={errors.cloudApiSecret} required />
        </div>
      </div>
    </div>
  );
}
