'use client';

import { useEffect, useState } from 'react';
import type { Student, StudentStatus } from '@/types';
import type { StudentFormValues } from './StudentFormModal';

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'DROPPED_OUT', label: 'Dropped Out' },
  { value: 'TRANSFERRED_OUT', label: 'Transferred Out' },
];

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

export function getInitials(student: Student): string {
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
}

// School's LAST class (max order) — only its students are marked "Passed Out"
// (e.g., Matric/Class 10). Students from other classes are promoted, not passed out.
export function getLastClassIds(classes: { id: string; order: number }[]): Set<string> {
  const maxOrder = classes.reduce((max, c) => Math.max(max, c.order), -1);
  return new Set(classes.filter((c) => c.order === maxOrder).map((c) => c.id));
}

export function isLastClassStudent(student: Student, lastClassIds: Set<string>): boolean {
  return !!student.section?.classId && lastClassIds.has(student.section.classId);
}

export function getSectionLabel(student: Student): string {
  return student.section?.class?.name
    ? `${student.section.class.name} — ${student.section.name}`
    : 'No section';
}

export function formatStatus(status: StudentStatus): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusBadgeVariant(status: StudentStatus): 'success' | 'info' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'GRADUATED':
      return 'info';
    case 'DROPPED_OUT':
      return 'danger';
    case 'TRANSFERRED_OUT':
      return 'warning';
    default:
      return 'default';
  }
}

export function statusDotClass(status: StudentStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500';
    case 'GRADUATED':
      return 'bg-primary-500';
    case 'DROPPED_OUT':
      return 'bg-red-500';
    case 'TRANSFERRED_OUT':
      return 'bg-amber-500';
    default:
      return 'bg-gray-400';
  }
}

export const studentCreatePayload = (v: StudentFormValues) => ({
  sectionId: v.sectionId,
  firstName: v.firstName,
  lastName: v.lastName,
  rollNumber: v.rollNumber,
  gender: v.gender || undefined,
  dob: v.dob || undefined,
  parentName: v.parentName,
  parentWhatsappNo: v.parentWhatsappNo,
  parentPhone: v.parentPhone || undefined,
  parentEmail: v.parentEmail || undefined,
  parentAddress: v.parentAddress || undefined,
});

export const studentUpdatePayload = (v: StudentFormValues) => ({
  firstName: v.firstName,
  lastName: v.lastName,
  rollNumber: v.rollNumber,
  gender: v.gender || null,
  dob: v.dob || null,
  sectionId: v.sectionId,
  parentName: v.parentName,
  parentPhone: v.parentPhone || null,
  parentEmail: v.parentEmail || null,
  parentAddress: v.parentAddress || null,
});
