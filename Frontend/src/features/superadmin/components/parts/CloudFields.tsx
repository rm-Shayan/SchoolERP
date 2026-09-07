'use client';

import { Input } from '@/features/shared/components';

interface CloudFieldsProps {
  values: {
    cloudName: string;
    cloudApiKey: string;
    cloudApiSecret: string;
  };
  errors?: Partial<Record<'cloudName' | 'cloudApiKey' | 'cloudApiSecret', string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}

/** Cloudinary credentials — uploads stored on the org's own cloud storage. */
export default function CloudFields({ values, errors, onChange, hint }: CloudFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Cloud Name"
        name="cloudName"
        placeholder="e.g. my-school-cloud"
        value={values.cloudName}
        onChange={onChange}
        error={errors?.cloudName}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="API Key"
          name="cloudApiKey"
          placeholder="Cloudinary API Key"
          value={values.cloudApiKey}
          onChange={onChange}
          error={errors?.cloudApiKey}
        />
        <Input
          label="API Secret"
          name="cloudApiSecret"
          type="password"
          placeholder="Cloudinary API Secret"
          value={values.cloudApiSecret}
          onChange={onChange}
          error={errors?.cloudApiSecret}
          autoComplete="new-password"
        />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
