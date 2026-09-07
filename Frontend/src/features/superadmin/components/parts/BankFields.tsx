import { Input } from '@/features/shared/components';

interface BankFieldsProps {
  values: {
    bankName: string;
    bankAccountTitle: string;
    bankAccountNumber: string;
  };
  errors?: Partial<Record<'bankName' | 'bankAccountTitle' | 'bankAccountNumber', string>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}

/** Org/branch bank details — printed on fee vouchers. */
export default function BankFields({ values, errors, onChange, hint }: BankFieldsProps) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Bank Name"
          name="bankName"
          placeholder="e.g. Meezan Bank"
          value={values.bankName}
          onChange={onChange}
          required
          error={errors?.bankName}
        />
        <Input
          label="Account Number / IBAN"
          name="bankAccountNumber"
          placeholder="e.g. PK36MEZN0001234567890123"
          value={values.bankAccountNumber}
          onChange={onChange}
          required
          error={errors?.bankAccountNumber}
        />
      </div>
      <Input
        label="Account Title"
        name="bankAccountTitle"
        placeholder="e.g. Falcon Academy Systems"
        className="mt-4"
        value={values.bankAccountTitle}
        onChange={onChange}
        required
        error={errors?.bankAccountTitle}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
