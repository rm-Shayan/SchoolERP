'use client';

import { useState } from 'react';
import { examService } from '@/lib/api';
import type { CellValue } from './ResultGrid';
import toast from 'react-hot-toast';

export function useResultsSaving(examId: string) {
  const [values, setValues] = useState<Record<string, CellValue>>({});
  const [saving, setSaving] = useState(false);

  const handleCell = (key: string, field: 'marks' | 'max', value: string) => {
    setValues((prev) => {
      const cur = prev[key] ?? { marks: '', max: '100' };
      return { ...prev, [key]: { ...cur, [field]: value } };
    });
  };

  const saveResults = async () => {
    const entries = Object.entries(values)
      .filter(([, v]) => v.marks !== '' && v.max !== '')
      .map(([key, v]) => {
        const [studentId, subjectId] = key.split(':');
        return { studentId, subjectId, marksObtained: Number(v.marks), maxMarks: Number(v.max) };
      });
    if (entries.length === 0) {
      toast.error('Enter some marks first');
      return;
    }
    setSaving(true);
    try {
      await examService.submitResults(examId, entries);
      toast.success(`${entries.length} results saved`);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return { values, saving, handleCell, saveResults, resetValues: () => setValues({}) };
}