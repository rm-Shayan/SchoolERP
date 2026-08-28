import { Input } from '@/features/shared/components';
import type { OrgCreateValues } from './orgForm';
import BankFields from './BankFields';

interface OrgFormFieldsProps {
  values: OrgCreateValues;
  errors: Partial<Record<keyof OrgCreateValues, string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  slugLabel?: string;
  codePlaceholder?: string;
}

export default function OrgFormFields({
  values,
  errors,
  onChange,
  slugLabel = 'Slug (auto-generated)',
  codePlaceholder = 'e.g. FALCON-01',
}: OrgFormFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Organization Name"
        name="name"
        placeholder="e.g. Falcon Academy Systems"
        value={values.name}
        onChange={onChange}
        required
        error={errors.name}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Code"
          name="code"
          placeholder={codePlaceholder}
          value={values.code}
          onChange={onChange}
          required
          error={errors.code}
        />
        <Input label={slugLabel} name="slug" placeholder="e.g. falcon-academy" value={values.slug} onChange={onChange} error={errors.slug} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="themeColor"
              value={values.themeColor || '#2563eb'}
              onChange={onChange}
              className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer bg-white p-1"
              aria-label="Brand color"
            />
            <Input
              name="themeColor"
              placeholder="#2563eb"
              value={values.themeColor}
              onChange={onChange}
              error={errors.themeColor}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Used on branded login + public org pages.</p>
        </div>
      </div>

      {/* Bank details — fee vouchers par print hota hai */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details *</h4>
        <BankFields values={values} errors={errors} onChange={onChange} hint="Fee vouchers par print hoga — branches apna account baad mein override kar sakti hain." />
      </div>
    </div>
  );
}
