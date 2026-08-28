'use client';

import { useMemo } from 'react';
import { Input, Select } from '@/features/shared/components';
import type { Class } from '@/types';
import { GENDER_OPTIONS } from './helpers';
import type { StudentFormValues } from './StudentFormModal';

interface StudentBasicFieldsProps {
  values: StudentFormValues;
  errors: Record<string, string>;
  classes: Class[];
  setValue: (name: keyof StudentFormValues, value: string) => void;
}

export function StudentBasicFields({ values, errors, classes, setValue }: StudentBasicFieldsProps) {
  const selectedClass = useMemo(
    () => classes.find((c) => c.id === values.classId),
    [classes, values.classId]
  );
  const sections = selectedClass?.sections ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Student Information</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="e.g. Ali"
          value={values.firstName}
          onChange={(e) => setValue('firstName', e.target.value)}
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          placeholder="e.g. Khan"
          value={values.lastName}
          onChange={(e) => setValue('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Roll Number"
          placeholder="e.g. 101"
          value={values.rollNumber}
          onChange={(e) => setValue('rollNumber', e.target.value)}
          error={errors.rollNumber}
        />
        <Select
          label="Gender"
          options={GENDER_OPTIONS}
          placeholder="Select gender"
          value={values.gender}
          onChange={(e) => setValue('gender', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={values.dob}
          onChange={(e) => setValue('dob', e.target.value)}
        />
        <div className="hidden sm:block" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Class"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select class"
          value={values.classId}
          onChange={(e) => {
            setValue('classId', e.target.value);
            setValue('sectionId', '');
          }}
          error={errors.classId}
        />
        <Select
          label="Section"
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
          placeholder={values.classId ? 'Select section' : 'Select a class first'}
          value={values.sectionId}
          onChange={(e) => setValue('sectionId', e.target.value)}
          disabled={!values.classId}
          error={errors.sectionId}
        />
      </div>
    </div>
  );
}
