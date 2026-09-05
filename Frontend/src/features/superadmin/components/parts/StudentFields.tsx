'use client';

import { Input } from '@/features/shared/components';

interface StudentFieldsProps {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StudentFields({ values, errors, onChange }: StudentFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" name="firstName" placeholder="e.g. Ahmed"
          value={values.firstName as string} onChange={onChange} error={errors.firstName} required />
        <Input label="Last Name" name="lastName" placeholder="e.g. Khan"
          value={values.lastName as string} onChange={onChange} />
      </div>
      <Input label="Roll Number" name="rollNumber" placeholder="e.g. 101"
        value={values.rollNumber as string} onChange={onChange} error={errors.rollNumber} required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Parent Name" name="parentName" placeholder="e.g. Mr. Khan"
          value={values.parentName as string} onChange={onChange} />
        <Input label="Parent WhatsApp" name="parentWhatsappNo" placeholder="03001234567"
          value={values.parentWhatsappNo as string} onChange={onChange} />
      </div>
    </>
  );
}
