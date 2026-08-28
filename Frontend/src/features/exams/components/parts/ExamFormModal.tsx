'use client';

import { useMemo } from 'react';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';
import { examService } from '@/lib/api';
import type { Term } from '@/lib/api/academicService';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schoolId: string;
  terms: Term[];
}

const toOptions = (items: { id: string; name: string }[]) =>
  items.map((i) => ({ value: i.id, label: i.name }));

export default function ExamFormModal({ open, onClose, onSaved, schoolId, terms }: Props) {
  const termOptions = useMemo(() => toOptions(terms), [terms]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { termId: '', startDate: '', endDate: '' },
    validators: {
      termId: required('Select a term'),
      startDate: required('Start date is required'),
      endDate: required('End date is required'),
    },
    onSubmit: async (v) => {
      try {
        await examService.create(schoolId, {
          termId: v.termId,
          startDate: v.startDate,
          endDate: v.endDate,
        });
        toast.success('Exam created');
        onSaved();
        onClose();
      } catch (err) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? 'Failed to create exam');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create New Exam" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Term"
          name="termId"
          placeholder="Select a term (the exam name will come from the term)"
          options={termOptions}
          value={values.termId}
          onChange={handleChange}
          onBlur={() => handleBlur('termId')}
          error={errors.termId}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={handleChange}
            onBlur={() => handleBlur('startDate')}
            error={errors.startDate}
            required
          />
          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={handleChange}
            onBlur={() => handleBlur('endDate')}
            error={errors.endDate}
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Exam
          </Button>
        </div>
      </form>
    </Modal>
  );
}