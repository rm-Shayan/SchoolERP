'use client';

import { memo } from 'react';
import type { Student } from '@/types';
import { Badge } from '@/features/shared/components';
import { getInitials, getSectionLabel, formatStatus, statusBadgeVariant, statusDotClass, isLastClassStudent } from './helpers';

interface StudentRowProps {
  student: Student;
  lastClassIds?: Set<string>;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onPassedOut?: (student: Student) => void;
}

function StudentRowInner({ student, lastClassIds, onView, onEdit, onDelete, onPassedOut }: StudentRowProps) {
  // "Passed Out" sirf school ki last class (e.g. Class 10 / Matric) ke ACTIVE
  // students ke liye — baqi classes promote hoti hain, pass nahi.
  const showPassedOut = student.status === 'ACTIVE' && !!onPassedOut && isLastClassStudent(student, lastClassIds ?? new Set());
  return (
    <tr className="group hover:bg-primary-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {student.imageUrl ? (
            <img
              src={student.imageUrl}
              alt={`${student.firstName} ${student.lastName}`}
              loading="lazy"
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{getInitials(student)}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{getSectionLabel(student)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-700 tabular-nums">{student.rollNumber}</span>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-600">
          {student.identifierCode}
        </code>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusDotClass(student.status)}`} />
            <Badge variant={statusBadgeVariant(student.status)}>{formatStatus(student.status)}</Badge>
          </span>
          {student.isBlocked && <Badge variant="danger">Blocked</Badge>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-100">
          <button
            onClick={() => onView(student)}
            title="View details"
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(student)}
            title="Edit student"
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(student)}
              title="Delete student"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {showPassedOut && (
            <button
              onClick={() => onPassedOut?.(student)}
              title="Student is in the school's final class — mark as passed out"
              className="ml-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              Passed Out
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export const StudentRow = memo(StudentRowInner);
