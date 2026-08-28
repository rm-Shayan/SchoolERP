'use client';

import { useState } from 'react';
import { Card, CardContent, Select, Button } from '@/features/shared/components';
import type { Student } from '@/types';
import ResultCardModal from './ResultCardModal';

interface ResultCardPickerProps {
  examId: string;
  students: Student[];
  loading: boolean;
}

export default function ResultCardPicker({ examId, students, loading }: ResultCardPickerProps) {
  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Result Card</h3>
        <Select
          label="Student"
          placeholder={loading ? 'Loading students…' : 'Select a student'}
          loading={loading}
          options={students.map((s) => ({
            value: s.id,
            label: `${s.firstName} ${s.lastName} (Roll ${s.rollNumber})`,
          }))}
          value={cardStudent?.id ?? ''}
          onChange={(e) => setCardStudent(students.find((s) => s.id === e.target.value) ?? null)}
        />
        <Button disabled={!cardStudent} onClick={() => setPreviewStudent(cardStudent)}>
          View Result Card
        </Button>
        <ResultCardModal examId={examId} student={previewStudent} onClose={() => setPreviewStudent(null)} />
      </CardContent>
    </Card>
  );
}
