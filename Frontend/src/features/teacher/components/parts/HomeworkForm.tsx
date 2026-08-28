import { useForm, required } from '@/lib/utils';
import { Button, Input } from '@/features/shared/components';
import SubjectChips from './SubjectChips';

export interface SectionOption {
  id: string;
  label: string;
  classId: string;
}

export interface SubjectOption {
  id: string;
  label: string;
}

export interface HomeworkFormValues {
  sectionId: string;
  subjectIds: string[];
  title: string;
  content: string;
}

interface HomeworkFormProps {
  sections: SectionOption[];
  sectionsLoading?: boolean;
  subjects?: SubjectOption[];
  subjectsLoading?: boolean;
  initialValues?: Partial<HomeworkFormValues>;
  onSubmit: (values: HomeworkFormValues) => Promise<void>;
  onCancel: () => void;
  onSectionChange?: (sectionId: string) => void;
}

export default function HomeworkForm({
  sections, sectionsLoading, subjects = [], subjectsLoading,
  initialValues, onSubmit, onCancel, onSectionChange,
}: HomeworkFormProps) {
  const { values, errors, isSubmitting, setValue, handleBlur, handleSubmit } = useForm({
    initialValues: {
      sectionId: initialValues?.sectionId ?? '',
      subjectIds: initialValues?.subjectIds ?? [],
      title: initialValues?.title ?? '',
      content: initialValues?.content ?? '',
    },
    validators: {
      sectionId: required('Section is required'),
      title: required('Title is required'),
      content: required('Homework details are required'),
    },
    onSubmit: async (v) => {
      await onSubmit({
        sectionId: v.sectionId as string,
        subjectIds: v.subjectIds as string[],
        title: v.title as string,
        content: v.content as string,
      });
    },
  });

  const selectedIds = (values.subjectIds as string[]) || [];

  const toggleSubject = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    setValue('subjectIds', next);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Section <span className="text-red-500">*</span>
        </label>
        <select
          className="block h-11 w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          value={values.sectionId as string}
          onChange={(e) => {
            setValue('sectionId', e.target.value);
            setValue('subjectIds', []);
            onSectionChange?.(e.target.value);
          }}
          onBlur={() => handleBlur('sectionId')}
        >
          <option value="">{sectionsLoading ? 'Loading…' : 'Select section'}</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {errors.sectionId && <p className="mt-1 text-xs text-red-500">{errors.sectionId}</p>}
      </div>

      {values.sectionId && (
        <SubjectChips
          subjects={subjects}
          loading={subjectsLoading ?? false}
          selected={selectedIds}
          onToggle={toggleSubject}
          onSelectAll={() => setValue('subjectIds', subjects.map((s) => s.id))}
        />
      )}

      <Input label="Title" name="title" placeholder="e.g. Chapter 4 exercises"
        value={values.title as string} onChange={(e) => setValue('title', e.target.value)}
        onBlur={() => handleBlur('title')} error={errors.title} required />
      <Input label="Homework Details" name="content" placeholder="What should students complete?"
        value={values.content as string} onChange={(e) => setValue('content', e.target.value)}
        onBlur={() => handleBlur('content')} error={errors.content} required />

      <p className="text-xs text-gray-500">
        {selectedIds.length > 0
          ? `Parents will be notified for ${selectedIds.length} subject(s).`
          : 'Parents of the selected section get notified by email instantly.'}
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>Post Homework</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
