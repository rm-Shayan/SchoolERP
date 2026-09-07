'use client';

import { useMemo } from 'react';
import type { Student, AttendanceStatus } from '@/types';
import { academicService } from '@/lib/api';

export interface SectionOption {
  id: string;
  label: string;
  classId: string;
  className: string;
  sectionName: string;
}

export const STATUS_OPTIONS: { value: AttendanceStatus; label: string; classes: string }[] = [
  { value: 'PRESENT', label: 'P', classes: 'bg-green-600 text-white' },
  { value: 'LATE', label: 'L', classes: 'bg-yellow-500 text-white' },
  { value: 'ABSENT', label: 'A', classes: 'bg-red-600 text-white' },
  { value: 'LEAVE', label: 'LV', classes: 'bg-blue-500 text-white' },
  { value: 'HALF_DAY', label: 'HD', classes: 'bg-cyan-600 text-white' },
];

export async function fetchSectionOptions(schoolId: string): Promise<SectionOption[]> {
  // Backend listClassesBySchool includes nested sections — single request
  const classes = await academicService.getClassesBySchool(schoolId);
  const opts: SectionOption[] = [];
  for (const c of classes) {
    (c.sections ?? []).forEach((s) => opts.push({
      id: s.id, label: `${c.name} — ${s.name}`, classId: c.id, className: c.name, sectionName: s.name,
    }));
  }
  return opts;
}

/** Unique class list for the marking dropdown — derived from SectionOption. */
export function groupSectionOptions(sections: SectionOption[]) {
  const map = new Map<string, { id: string; name: string }>();
  for (const s of sections) if (!map.has(s.classId)) map.set(s.classId, { id: s.classId, name: s.className });
  return [...map.values()];
}

export function useAttendanceCounts(students: Student[], marks: Record<string, AttendanceStatus>): Record<string, number> {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const st = marks[s.id] ?? 'PRESENT';
      counts[st] = (counts[st] ?? 0) + 1;
    });
    return counts;
  }, [students, marks]);
}
