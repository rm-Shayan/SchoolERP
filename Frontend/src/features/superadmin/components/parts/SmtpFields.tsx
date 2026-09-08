'use client';

import { Input } from '@/features/shared/components';
import type { OrgCreateValues } from './orgForm';

interface SmtpFieldsProps {
  values: OrgCreateValues;
  errors: Partial<Record<keyof OrgCreateValues, string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Optional SMTP intake for org creation — Gmail email + App Password only.
 * If left empty, emails are sent via the platform transport; the org admin
 * can add/update their SMTP later from Settings > Email.
 */
export default function SmtpFields({ values, errors, onChange }: SmtpFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary-50 rounded-xl border border-primary-200/60">
        <p className="text-xs text-primary-700 font-medium">
          Optional — you can skip this for now. To send from your Gmail: Google Account → Security →
          enable 2-Step Verification → generate a 16-character code from App Passwords.
        </p>
      </div>
      <Input
        label="School Gmail Address"
        name="smtpUsername"
        type="email"
        value={values.smtpUsername}
        onChange={onChange}
        error={errors.smtpUsername}
        placeholder="school@gmail.com"
      />
      <Input
        label="Gmail App Password"
        name="smtpPassword"
        type="password"
        value={values.smtpPassword}
        onChange={onChange}
        error={errors.smtpPassword}
        placeholder="•••• •••• •••• ••••"
        autoComplete="new-password"
      />
    </div>
  );
}
