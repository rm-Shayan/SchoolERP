import type { Student, AttendanceStatus } from '@/types';
import { Card, CardHeader, CardContent } from '@/features/shared/components';
import AttendanceRow from './AttendanceRow';

interface Props {
  students: Student[];
  marks: Record<string, AttendanceStatus>;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
}

export default function AttendanceTable({ students, marks, onToggle }: Props) {
  return (
    <Card>
      <CardHeader><h2 className="font-semibold text-gray-900">{students.length} Students</h2></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <AttendanceRow key={s.id} student={s} status={marks[s.id] ?? 'PRESENT'} onToggle={onToggle} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
