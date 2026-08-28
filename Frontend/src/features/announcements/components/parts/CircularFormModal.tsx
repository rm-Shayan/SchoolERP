import { Modal, Input, Select, Button } from '@/features/shared/components';
import { useForm, required, minLength } from '@/lib/utils';
import { circularService } from '@/lib/api';
import type { CircularAudience } from '@/lib/api/circularService';
import { AUDIENCE_OPTIONS } from './audienceMeta';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (notified: number) => void;
  schoolId: string;
  defaultAudience: CircularAudience;
}

export default function CircularFormModal({ open, onClose, onSaved, schoolId, defaultAudience }: Props) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { title: '', content: '', audience: defaultAudience },
    validators: {
      title: required('Title is required'),
      content: composeContent(),
    },
    onSubmit: async (v) => {
      try {
        const res = await circularService.create(schoolId, {
          title: v.title,
          content: v.content,
          audience: v.audience,
        });
        toast.success('Announcement published');
        onSaved(res.notifiedParents + res.notifiedStaff);
        onClose();
      } catch (err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to publish');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New Announcement" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          placeholder="e.g. Summer Vacation Notice"
          value={values.title}
          onChange={handleChange}
          onBlur={() => handleBlur('title')}
          error={errors.title}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
          <textarea
            name="content"
            rows={5}
            placeholder="Type your full message here..."
            className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/80"
            value={values.content}
            onChange={handleChange}
            onBlur={() => handleBlur('content')}
          />
          {errors.content && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.content}</p>}
        </div>
        <Select
          label="For whom?"
          name="audience"
          options={AUDIENCE_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} — ${o.description}` }))}
          value={values.audience}
          onChange={handleChange}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Publish
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function composeContent() {
  return minLength(10, 'Enter at least 10 characters');
}