'use client';

import { Input } from '@/features/shared/components';
import type { OrgCreateValues } from './orgForm';

interface SmtpFieldsProps {
  values: OrgCreateValues;
  errors: Partial<Record<keyof OrgCreateValues, string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Optional SMTP intake for org creation — sirf Gmail email + App Password.
 * Khali chhoda to emails platform transport se jati hain; baad mein org admin
 * Settings > Email se apna SMTP add/update kar sakta hai.
 */
export default function SmtpFields({ values, errors, onChange }: SmtpFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60">
        <p className="text-xs text-blue-700 font-medium">
          Optional — abhi chhod dein. Apni Gmail se bhejne ke liye: Google Account → Security →
          2-Step Verification ON → App Passwords se 16-character code generate karein.
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
