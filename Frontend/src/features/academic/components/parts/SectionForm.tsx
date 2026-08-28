import { Button, Input } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';

interface SectionFormProps {
  onClose: () => void;
  onSubmit: (v: { name: string; capacity: string; roomNumber: string }) => void | Promise<void>;
  initial?: { name: string; capacity: string; roomNumber: string };
}

export default function SectionForm({ onClose, onSubmit, initial }: SectionFormProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: initial ?? { name: '', capacity: '', roomNumber: '' },
    validators: { name: required('Section name is required') },
    onSubmit: async (v) => {
      await onSubmit({ name: v.name as string, capacity: v.capacity as string, roomNumber: v.roomNumber as string });
    },
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
      <Input
        label="Section"
        name="name"
        placeholder="e.g. A"
        value={values.name as string}
        onChange={handleChange}
        onBlur={() => handleBlur('name')}
        error={errors.name}
        required
        className="w-28"
      />
      <Input
        label="Capacity"
        name="capacity"
        type="number"
        placeholder="e.g. 40"
        value={values.capacity as string}
        onChange={handleChange}
        className="w-24"
      />
      <Input
        label="Room"
        name="roomNumber"
        placeholder="e.g. 201"
        value={values.roomNumber as string}
        onChange={handleChange}
        className="w-24"
      />
      <Button type="submit" size="sm" loading={isSubmitting}>{initial ? 'Update' : 'Save'}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
    </form>
  );
}
