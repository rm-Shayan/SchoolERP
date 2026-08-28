import { Input } from '@/features/shared/components';
import type { OrgCreateValues } from './orgForm';

interface AdminFieldsProps {
  values: OrgCreateValues;
  errors: Partial<Record<keyof OrgCreateValues, string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showUsername?: boolean;
  emailPlaceholder?: string;
}

export default function AdminFields({
  values,
  errors,
  onChange,
  showUsername = false,
  emailPlaceholder = 'principal@school.com',
}: AdminFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input label="Principal Name" name="adminName" placeholder="Full name" value={values.adminName} onChange={onChange} required error={errors.adminName} />
      <Input label="Principal Email" name="adminEmail" type="email" placeholder={emailPlaceholder} value={values.adminEmail} onChange={onChange} required error={errors.adminEmail} />
      {showUsername && (
        <Input label="Username (optional)" name="adminUsername" placeholder="e.g. admin_001" value={values.adminUsername} onChange={onChange} />
      )}
      <Input label="Password" name="adminPassword" type="password" placeholder="Min 8 characters" value={values.adminPassword} onChange={onChange} required error={errors.adminPassword} />
      <Input label="Phone (optional)" name="adminPhone" placeholder="03001234567" value={values.adminPhone} onChange={onChange} error={errors.adminPhone} />
    </div>
  );
}
