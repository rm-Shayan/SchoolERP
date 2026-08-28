import { Button, Card, CardContent, Input } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';

interface YearFormProps {
  onClose: () => void;
  onSubmit: (v: { name: string; startDate: string; endDate: string }) => void | Promise<void>;
  initial?: { name: string; startDate: string; endDate: string };
}

export default function YearForm({ onClose, onSubmit, initial }: YearFormProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: initial ?? { name: '', startDate: '', endDate: '' },
    validators: {
      name: required('Year name is required'),
      startDate: required('Start date is required'),
      endDate: required('End date is required'),
    },
    onSubmit: async (v) => {
      await onSubmit({ name: v.name as string, startDate: v.startDate as string, endDate: v.endDate as string });
    },
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            label="Name"
            name="name"
            placeholder="e.g. 2026-2027"
            value={values.name as string}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            required
          />
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={values.startDate as string}
            onChange={handleChange}
            onBlur={() => handleBlur('startDate')}
            error={errors.startDate}
            required
          />
          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={values.endDate as string}
            onChange={handleChange}
            onBlur={() => handleBlur('endDate')}
            error={errors.endDate}
            required
          />
          <div className="flex items-end gap-2">
            <Button type="submit" loading={isSubmitting}>{initial ? 'Update' : 'Save'}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
