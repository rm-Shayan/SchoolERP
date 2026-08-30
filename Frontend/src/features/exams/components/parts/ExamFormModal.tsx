'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';
import { examService } from '@/lib/api';
import { academicService, type Term, type Class } from '@/lib/api/academicService';
import type { Exam } from '@/types';
import ExamPaperRows, { emptyRow, toPaperInputs, type PaperRow } from './ExamPaperRows';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schoolId: string;
  terms: Term[];
  exam?: Exam | null;
}

const toRows = (exam: Exam): PaperRow[] =>
  (exam.papers ?? []).map((p) => ({
    key: `${p.id}-${p.classId}-${p.subjectId}`, classId: p.classId, subjectId: p.subjectId,
    sectionId: p.sectionId ?? '', date: p.date ? String(p.date).slice(0, 10) : '',
    startTime: p.startTime ?? '', endTime: p.endTime ?? '',
    maxMarks: p.maxMarks != null ? String(p.maxMarks) : '', roomNumber: p.roomNumber ?? '',
  }));

export default function ExamFormModal({ open, onClose, onSaved, schoolId, terms, exam }: Props) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [rows, setRows] = useState<PaperRow[]>([]);

  const seed = useMemo(
    () =>
      exam
        ? { termId: exam.termId, name: exam.name || '', startDate: String(exam.startDate).slice(0, 10), endDate: String(exam.endDate).slice(0, 10) }
        : { termId: '', name: '', startDate: '', endDate: '' },
    [exam]
  );

  useEffect(() => {
    if (open) {
      reset();
      setRows(exam ? toRows(exam) : [emptyRow()]);
    }
    if (schoolId) academicService.getClassesBySchool(schoolId).then(setClasses).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam, schoolId]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: seed,
    validators: {
      termId: required('Select a term'),
      startDate: required('Start date is required'),
      endDate: required('End date is required'),
    },
    onSubmit: async (v) => {
      if (rows.length === 0) {
        toast.error('Add at least one paper to the date sheet');
        return;
      }
      const papers = toPaperInputs(rows);
      if (papers.length === 0) {
        toast.error('Every paper needs a class, subject and date');
        return;
      }
      const payload = { termId: v.termId, name: v.name || undefined, startDate: v.startDate, endDate: v.endDate, papers };
      try {
        if (exam) {
          await examService.update(exam.id, payload);
          toast.success('Exam date sheet updated');
        } else {
          await examService.create(schoolId, payload);
          toast.success('Exam created');
        }
        onSaved();
        onClose();
      } catch (err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save exam');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={exam ? 'Edit Exam & Date Sheet' : 'Create New Exam'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Term"
            name="termId"
            placeholder="Select a term (exam name comes from the term)"
            options={terms.map((i) => ({ value: i.id, label: i.name }))}
            value={values.termId}
            onChange={handleChange}
            onBlur={() => handleBlur('termId')}
            error={errors.termId}
            required
          />
          <Input
            label="Exam Name (optional)"
            name="name"
            placeholder="e.g. Mid-Term Examination"
            value={values.name}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            error={errors.name}
          />
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

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Date Sheet — Papers</h4>
          <ExamPaperRows rows={rows} classes={classes} onRowsChange={setRows} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {exam ? 'Save Changes' : 'Create Exam'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}