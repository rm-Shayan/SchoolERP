'use client';

import { memo } from 'react';
import type { Student } from '@/types';
import { Card, EmptyState } from '@/features/shared/components';

interface StudentRosterTableProps {
  students: Student[];
}

function StudentRosterTable({ students }: StudentRosterTableProps) {
  if (students.length === 0) {
    return (
      <Card>
        <EmptyState title="No students" description="No active students match your selection." />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class / Section</th>
              <th className="px-4 py-3">Identifier</th>
              <th className="px-4 py-3">Parent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-primary-100 text-primary-700">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={`${s.firstName} ${s.lastName}`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </span>
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">{s.gender}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {s.section?.class?.name ?? '—'} {s.section?.name ? `/ ${s.section.name}` : ''}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.identifierCode}</td>
                <td className="px-4 py-3 text-gray-600">
                  {s.parent?.name || '—'}
                  {s.parent?.phone ? (
                    <p className="text-xs text-gray-400">{s.parent.phone}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default memo(StudentRosterTable);
