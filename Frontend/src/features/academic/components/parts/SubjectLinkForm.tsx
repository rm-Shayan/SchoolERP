'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input } from '@/features/shared/components';
import { useForm, required, isOrgCode, cn } from '@/lib/utils';

interface SubjectLinkFormProps {
  classes: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (v: { name: string; code?: string; classIds: string[] }) => void | Promise<void>;
}

export default function SubjectLinkForm({ classes, onClose, onSubmit }: SubjectLinkFormProps) {
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classError, setClassError] = useState('');
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', code: '' },
    validators: {
      name: required('Subject name is required'),
      code: isOrgCode(),
    },
    onSubmit: async (v) => {
      if (classIds.length === 0) {
        setClassError('Select at least one class');
        return;
      }
      await onSubmit({ name: v.name as string, code: (v.code as string) || undefined, classIds });
    },
  });

  const toggle = (id: string) => {
    setClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setClassError('');
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Subject Name"
              name="name"
              placeholder="e.g. Mathematics"
              value={values.name as string}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={errors.name}
              required
              className="w-48"
            />
            <Input
              label="Code (optional)"
              name="code"
              placeholder="e.g. MATH"
              value={values.code as string}
              onChange={handleChange}
              onBlur={() => handleBlur('code')}
              error={errors.code}
              className="w-28"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Link to classes
            </p>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">No classes yet — create a class first.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {classes.map((c) => {
                  const active = classIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={cn(
                        'text-left text-sm px-3 py-2 rounded-lg border transition-colors',
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {classError && <p className="mt-1 text-xs text-red-600">{classError}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>Save & Link</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
