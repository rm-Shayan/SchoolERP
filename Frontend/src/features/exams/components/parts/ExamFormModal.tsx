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

  const autoGenerate = () => {
    if (!values.startDate || !values.endDate) {
      toast.error('Please select both Start Date and End Date first');
      return;
    }
    
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (start > end) {
      toast.error('Start Date must be before End Date');
      return;
    }

    const availableDates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0) {
        availableDates.push(current.toISOString().slice(0, 10));
      }
      current.setDate(current.getDate() + 1);
    }

    if (availableDates.length === 0) {
      toast.error('No valid working days between the selected dates (skipping Sundays)');
      return;
    }

    const newRows: PaperRow[] = [];
    
    classes.forEach(c => {
      if (!c.subjects || c.subjects.length === 0) return;
      
      c.subjects.forEach((subj, idx) => {
        const dateIdx = idx % availableDates.length;
        const dateStr = availableDates[dateIdx];
        
        newRows.push({
          key: Math.random().toString(36).substring(7),
          classId: c.id,
          subjectId: subj.id,
          sectionId: '',
          date: dateStr,
          startTime: '09:00',
          endTime: '12:00',
          maxMarks: '100',
          roomNumber: ''
        });
      });
    });

    if (newRows.length === 0) {
      toast.error('No subjects found in any class to generate papers');
      return;
    }

    setRows(newRows);
    toast.success(`Auto-generated ${newRows.length} papers across ${classes.length} classes`);
  };

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
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Sheet — Papers</h4>
            <Button type="button" size="sm" variant="outline" onClick={autoGenerate}>
              ✨ Auto-Generate Papers
            </Button>
          </div>
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