'use client';

import type { Class } from '@/lib/api/academicService';

interface Props {
  teachers: { id: string; name: string }[];
  classes: Class[];
  filterTeacher: string;
  filterClass: string;
  onTeacherChange: (id: string) => void;
  onClassChange: (id: string) => void;
  onClear: () => void;
}

export default function AssignmentFilterBar({ teachers, classes, filterTeacher, filterClass, onTeacherChange, onClassChange, onClear }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700" value={filterTeacher} onChange={(e) => onTeacherChange(e.target.value)}>
        <option value="">All teachers</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700" value={filterClass} onChange={(e) => onClassChange(e.target.value)}>
        <option value="">All classes</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {(filterTeacher || filterClass) && (
        <button onClick={onClear} className="text-xs text-primary-600 hover:underline self-center">Clear filters</button>
      )}
    </div>
  );
}
