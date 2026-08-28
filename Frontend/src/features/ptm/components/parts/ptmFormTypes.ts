import type { PTMScope } from '@/lib/api/ptmService';

export interface PickedStudent {
  id: string;
  label: string;
}

export interface AudienceValue {
  classFromId: string;
  classToId: string;
  sectionIds: string[];
  /** id -> "Class · Section" label (edit-mode chips render without extra fetches). */
  sectionLabels: Record<string, string>;
  student: PickedStudent | null;
}

export const EMPTY_AUDIENCE: AudienceValue = {
  classFromId: '',
  classToId: '',
  sectionIds: [],
  sectionLabels: {},
  student: null,
};

export interface ScopeOption {
  key: PTMScope;
  label: string;
  hint: string;
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  { key: 'WHOLE_SCHOOL', label: 'Whole School', hint: 'All classes & sections' },
  { key: 'CLASS_RANGE', label: 'Class Range', hint: 'e.g. Class 1 to 4' },
  { key: 'SECTIONS', label: 'Sections', hint: 'Specific section(s)' },
  { key: 'STUDENT', label: 'Single Student', hint: 'One child only' },
];

export function validateAudience(scope: PTMScope, a: AudienceValue): string | null {
  if (scope === 'CLASS_RANGE') {
    if (!a.classFromId || !a.classToId) return 'Select both From and To classes for the range.';
    return null;
  }
  if (scope === 'SECTIONS') return a.sectionIds.length === 0 ? 'Pick at least one section.' : null;
  if (scope === 'STUDENT') return a.student ? null : 'Search and select a student.';
  return null;
}
