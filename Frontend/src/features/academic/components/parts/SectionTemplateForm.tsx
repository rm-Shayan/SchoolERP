import { Button, Card, CardContent, Input } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';

interface SectionTemplateFormProps {
  onClose: () => void;
  onSubmit: (v: { name: string }) => void | Promise<void>;
  initial?: { name: string };
}

export default function SectionTemplateForm({ onClose, onSubmit, initial }: SectionTemplateFormProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: initial ?? { name: '' },
    validators: { name: required('Section name is required') },
    onSubmit: async (v) => {
      await onSubmit({ name: v.name as string });
    },
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <Input
            label="Section Name"
            name="name"
            placeholder="e.g. A, B, Morning"
            value={values.name as string}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            required
            className="w-56"
          />
          <p className="text-xs text-gray-400 pb-1 max-w-56">
            Capacity isn't set here — it's set when you assign the section to a class
            (each class-section combination has its own capacity).
          </p>
          <Button type="submit" loading={isSubmitting}>{initial ? 'Update' : 'Save'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </form>
      </CardContent>
    </Card>
  );
}
