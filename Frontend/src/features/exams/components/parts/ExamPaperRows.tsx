'use client';

import type { ExamPaperInput } from '@/lib/api/examService';
import type { Class } from '@/lib/api/academicService';
import { Button, Input, Select } from '@/features/shared/components';

export interface PaperRow {
  key: string;
  classId: string;
  subjectId: string;
  sectionId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: string;
  roomNumber: string;
}

interface Props {
  rows: PaperRow[];
  classes: Class[];
  onRowsChange: (rows: PaperRow[]) => void;
}

let keyCounter = 0;
export const nextRowKey = () => `row-${++keyCounter}`;

export function emptyRow(): PaperRow {
  return { key: nextRowKey(), classId: '', subjectId: '', sectionId: '', date: '', startTime: '09:00', endTime: '11:00', maxMarks: '', roomNumber: '' };
}

export function toPaperInputs(rows: PaperRow[]): ExamPaperInput[] {
  return rows
    .filter((r) => r.classId && r.subjectId && r.date)
    .map((r) => ({
      classId: r.classId,
      subjectId: r.subjectId,
      sectionId: r.sectionId || null,
      date: r.date,
      startTime: r.startTime || null,
      endTime: r.endTime || null,
      maxMarks: r.maxMarks ? Number(r.maxMarks) : null,
      roomNumber: r.roomNumber || null,
    }));
}

export default function ExamPaperRows({ rows, classes, onRowsChange }: Props) {
  const update = (key: string, patch: Partial<PaperRow>) => {
    onRowsChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const opts = (items?: { id: string; name: string }[]) =>
    (items ?? []).map((i) => ({ value: i.id, label: i.name }));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No papers yet — click &quot;+ Add Paper&quot; to assign which subject is on which date.
        </p>
      )}
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {rows.map((row, idx) => {
          const cls = classes.find((c) => c.id === row.classId);
          const subjects = cls?.subjects ?? [];
          const sections = cls?.sections ?? [];
          return (
            <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Paper {idx + 1}</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => onRowsChange(rows.filter((r) => r.key !== row.key))}>
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Select label="Class" name="classId" options={opts(classes)} value={row.classId} required
                  onChange={(e) => update(row.key, { classId: e.target.value, subjectId: '', sectionId: '' })} />
                <Select label="Subject" name="subjectId" options={opts(subjects)} value={row.subjectId} required
                  disabled={!row.classId} placeholder={row.classId ? 'Select subject' : 'Pick class first'}
                  onChange={(e) => update(row.key, { subjectId: e.target.value })} />
                <Select label="Section (optional)" name="sectionId" options={opts(sections)} value={row.sectionId}
                  placeholder="Whole class" disabled={!row.classId}
                  onChange={(e) => update(row.key, { sectionId: e.target.value })} />
                <Input label="Paper Date" name="date" type="date" value={row.date} required
                  onChange={(e) => update(row.key, { date: e.target.value })} />
                <Input label="Start Time" name="startTime" type="time" value={row.startTime}
                  onChange={(e) => update(row.key, { startTime: e.target.value })} />
                <Input label="End Time" name="endTime" type="time" value={row.endTime}
                  onChange={(e) => update(row.key, { endTime: e.target.value })} />
                <Input label="Max Marks" name="maxMarks" type="number" min="1" value={row.maxMarks}
                  onChange={(e) => update(row.key, { maxMarks: e.target.value })} />
                <Input label="Room" name="roomNumber" value={row.roomNumber}
                  onChange={(e) => update(row.key, { roomNumber: e.target.value })} />
              </div>
            </div>
          );
        })}
      </div>
      <Button size="sm" variant="outline" onClick={() => onRowsChange([...rows, emptyRow()])}>
        + Add Paper
      </Button>
    </div>
  );
}