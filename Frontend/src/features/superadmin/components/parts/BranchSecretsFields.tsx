'use client';

import { Input } from '@/features/shared/components';
import type { BranchSecretsValues } from './branchForm';

interface BranchSecretsFieldsProps {
  values: BranchSecretsValues;
  errors: Partial<Record<keyof BranchSecretsValues, string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BranchSecretsFields({ values, errors, onChange }: BranchSecretsFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          SMTP & Cloudinary
        </h4>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          Optional
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Credentials branch ke saath associate hote hain — admin account ke saath
        nahi. Sham khaali chhod dain: existing admin mode me is admin ke current
        SMTP/Cloudinary is nayi branch par copy ho jate hain; new admin mode me
        branch baad me Branch Settings se set ki ja sakti hai. Agar provided
        hain to wo sirf isi branch par apply honge.
      </p>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">SMTP <span className="text-gray-400">(Gmail App Password)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Gmail Address"
            name="smtpUsername"
            type="email"
            placeholder="school@gmail.com"
            value={values.smtpUsername}
            onChange={onChange}
            error={errors.smtpUsername}
          />
          <Input
            label="App Password"
            name="smtpPassword"
            type="password"
            placeholder="•••• •••• •••• ••••"
            value={values.smtpPassword}
            onChange={onChange}
            error={errors.smtpPassword}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Cloudinary <span className="text-gray-400">(photos/documents storage)</span></p>
        <Input
          label="Cloud Name"
          name="cloudName"
          placeholder="e.g. my-school-cloud"
          value={values.cloudName}
          onChange={onChange}
          error={errors.cloudName}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input
            label="API Key"
            name="cloudApiKey"
            placeholder="Cloudinary API Key"
            value={values.cloudApiKey}
            onChange={onChange}
            error={errors.cloudApiKey}
          />
          <Input
            label="API Secret"
            name="cloudApiSecret"
            type="password"
            placeholder="Cloudinary API Secret"
            value={values.cloudApiSecret}
            onChange={onChange}
            error={errors.cloudApiSecret}
            autoComplete="new-password"
          />
        </div>
      </div>
    </div>
  );
}