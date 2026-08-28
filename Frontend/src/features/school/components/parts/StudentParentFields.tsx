import { Input } from '@/features/shared/components';
import type { StudentFormValues } from './StudentFormModal';

interface StudentParentFieldsProps {
  values: StudentFormValues;
  errors: Record<string, string>;
  isEdit: boolean;
  setValue: (name: keyof StudentFormValues, value: string) => void;
}

export function StudentParentFields({ values, errors, isEdit, setValue }: StudentParentFieldsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Parent / Guardian</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Parent Name"
          placeholder="e.g. Ahmed Khan"
          value={values.parentName}
          onChange={(e) => setValue('parentName', e.target.value)}
          error={errors.parentName}
        />
        <Input
          label="WhatsApp Number"
          placeholder="e.g. 03001234567"
          value={values.parentWhatsappNo}
          onChange={(e) => setValue('parentWhatsappNo', e.target.value)}
          disabled={isEdit}
          error={errors.parentWhatsappNo}
        />
        <Input
          label="Phone (optional)"
          placeholder="e.g. 02134567890"
          value={values.parentPhone}
          onChange={(e) => setValue('parentPhone', e.target.value)}
        />
        <Input
          label="Email (optional)"
          type="email"
          placeholder="e.g. parent@example.com"
          value={values.parentEmail}
          onChange={(e) => setValue('parentEmail', e.target.value)}
        />
      </div>
      <Input
        label="Address (optional)"
        placeholder="e.g. House 12, Street 5, Gulshan"
        value={values.parentAddress}
        onChange={(e) => setValue('parentAddress', e.target.value)}
      />
      {isEdit && (
        <p className="text-xs text-gray-500">
          Phone number is the parent&apos;s unique key and can&apos;t be changed here.
        </p>
      )}
    </div>
  );
}
