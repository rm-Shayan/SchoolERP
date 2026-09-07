'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input } from '@/features/shared/components';
import { useForm, required, cn } from '@/lib/utils';
import AssignedSectionsEditor from './AssignedSectionsEditor';

export interface SectionOption {
  id: string;
  name: string;
}

export interface AssignedSection {
  name: string;
  capacity: string;
  roomNumber: string;
}

interface ClassFormProps {
  onClose: () => void;
  onSubmit: (v: { name: string; order: string; sections: AssignedSection[] }) => void | Promise<void>;
  initial?: { name: string; order: string };
  /** School section pool — assign sections to the class via checkboxes. */
  sectionOptions: SectionOption[];
  /** Already-assigned sections (edit mode) with their per-class capacity/room. */
  initialSections?: AssignedSection[];
}

export default function ClassForm({ onClose, onSubmit, initial, sectionOptions, initialSections }: ClassFormProps) {
  const isEdit = Boolean(initial);
  const [assigned, setAssigned] = useState<AssignedSection[]>(initialSections ?? []);
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: initial?.name ?? '', order: initial?.order ?? '0' },
    validators: { name: required('Class name is required') },
    onSubmit: async (v) => {
      await onSubmit({ name: v.name as string, order: v.order as string, sections: assigned });
    },
  });

  const toggle = (name: string) => {
    setAssigned((prev) =>
      prev.some((s) => s.name === name)
        ? prev.filter((s) => s.name !== name)
        : [...prev, { name, capacity: '', roomNumber: '' }]
    );
  };

  const patch = (name: string, field: 'capacity' | 'roomNumber', value: string) => {
    setAssigned((prev) => prev.map((s) => (s.name === name ? { ...s, [field]: value } : s)));
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Class Name"
              name="name"
              placeholder="e.g. Class 3"
              value={values.name as string}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={errors.name}
              required
              className="w-48"
            />
            <Input
              label="Order"
              name="order"
              type="number"
              placeholder="e.g. 3"
              value={values.order as string}
              onChange={handleChange}
              className="w-24"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Assign sections{' '}
              <span className="normal-case font-normal">(from the school pool — create them first in the "Sections" tab)</span>
            </p>
            {sectionOptions.length === 0 ? (
              <p className="text-sm text-gray-400">The sections pool is empty — create sections first in the "2. Sections" tab.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {sectionOptions.map((s) => {
                  const active = assigned.some((a) => a.name === s.name);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.name)}
                      className={cn(
                        'text-sm px-3 py-2 rounded-lg border transition-colors',
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <AssignedSectionsEditor assigned={assigned} onPatch={patch} />

          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update Class' : 'Save Class'}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
