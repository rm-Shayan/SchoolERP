import { Button, Input } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';

interface TermFormProps {
  onClose: () => void;
  onSubmit: (v: { name: string; startDate: string; endDate: string }) => void | Promise<void>;
  initial?: { name: string; startDate: string; endDate: string };
}

export default function TermForm({ onClose, onSubmit, initial }: TermFormProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: initial ?? { name: '', startDate: '', endDate: '' },
    validators: {
      name: required('Term name is required'),
      startDate: required('Start date is required'),
      endDate: required('End date is required'),
    },
    onSubmit: async (v) => {
      await onSubmit({ name: v.name as string, startDate: v.startDate as string, endDate: v.endDate as string });
    },
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
      <Input
        label="Term name"
        name="name"
        placeholder="e.g. Term 1"
        value={values.name as string}
        onChange={handleChange}
        onBlur={() => handleBlur('name')}
        error={errors.name}
        className="flex-1 min-w-32"
        required
      />
      <Input
        label="Start"
        name="startDate"
        type="date"
        value={values.startDate as string}
        onChange={handleChange}
        onBlur={() => handleBlur('startDate')}
        error={errors.startDate}
        required
      />
      <Input
        label="End"
        name="endDate"
        type="date"
        value={values.endDate as string}
        onChange={handleChange}
        onBlur={() => handleBlur('endDate')}
        error={errors.endDate}
        required
      />
      <Button type="submit" size="sm" loading={isSubmitting}>{initial ? 'Update Term' : 'Save Term'}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
    </form>
  );
}
