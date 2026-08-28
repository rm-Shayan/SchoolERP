import type { Student } from '@/types';
import type { Subject } from '@/lib/api/academicService';
import { Input } from '@/features/shared/components';

export interface CellValue {
  marks: string;
  max: string;
}

interface Props {
  students: Student[];
  subjects: Subject[];
  values: Record<string, CellValue>;
  onChange: (key: string, field: 'marks' | 'max', value: string) => void;
}

const cellKey = (studentId: string, subjectId: string) => `${studentId}:${subjectId}`;

export default function ResultGrid({ students, subjects, values, onChange }: Props) {
  if (students.length === 0 || subjects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No students or subjects found — check the section.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-600">
              Student
            </th>
            {subjects.map((s) => (
              <th key={s.id} className="px-3 py-2.5 text-center font-semibold text-slate-600">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-t border-slate-100">
              <td className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-700">
                {student.firstName} {student.lastName}
                <span className="ml-2 text-xs font-normal text-slate-400">#{student.rollNumber}</span>
              </td>
              {subjects.map((subject) => {
                const key = cellKey(student.id, subject.id);
                const val = values[key] ?? { marks: '', max: '100' };
                return (
                  <td key={subject.id} className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Marks"
                        className="h-9 w-16 px-2 text-center text-xs"
                        value={val.marks}
                        onChange={(e) => onChange(key, 'marks', e.target.value)}
                      />
                      <span className="text-xs text-slate-400">/</span>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Max"
                        className="h-9 w-14 px-2 text-center text-xs"
                        value={val.max}
                        onChange={(e) => onChange(key, 'max', e.target.value)}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}