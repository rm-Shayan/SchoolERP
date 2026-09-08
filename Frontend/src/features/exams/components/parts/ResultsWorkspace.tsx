'use client';

import { useState } from 'react';
import { Card, CardContent, Button, ConfirmDialog, EmptyState, TableSkeleton } from '@/features/shared/components';
import type { Student } from '@/types';
import type { Subject } from '@/lib/api/academicService';
import { examService } from '@/lib/api';
import ResultGrid, { type CellValue } from './ResultGrid';
import toast from 'react-hot-toast';

interface Props {
  examId: string;
  students: Student[];
  subjects: Subject[];
  loading: boolean;
  onSaved: () => void;
  readOnly?: boolean;
}

export default function ResultsWorkspace({ examId, students, subjects, loading, onSaved, readOnly }: Props) {
  const [values, setValues] = useState<Record<string, CellValue>>({});
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
      onSaved();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const publishResults = async () => {
    setPublishing(true);
    try {
      const res = await examService.publish(examId);
      toast.success(`Results sent to ${res.notified} parent(s)`);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to publish');
    } finally {
      setPublishing(false);
      setPublishOpen(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : students.length === 0 ? (
          <EmptyState title="No students found" description="There are no active students in this section." />
        ) : (
          <>
            <ResultGrid students={students} subjects={subjects} values={values} onChange={handleCell} />
            {!readOnly && (
              <div className="mt-4 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                <Button variant="outline" onClick={saveResults} loading={saving}>
                  Save Results
                </Button>
                <Button onClick={() => setPublishOpen(true)}>Publish to Parents</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
      <ConfirmDialog
        open={publishOpen}
        title="Publish results?"
        message="A result summary will be emailed to all parents. Continue?"
        confirmLabel="Publish"
        loading={publishing}
        onConfirm={publishResults}
        onCancel={() => setPublishOpen(false)}
      />
    </Card>
  );
}