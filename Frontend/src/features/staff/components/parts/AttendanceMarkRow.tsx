'use client';

import type { User } from '@/types';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEAVE', label: 'Leave' },
];

interface Props {
  member: User;
  currentStatus?: string;
  onMark: (staffId: string, status: string) => void;
  onDelete?: () => void;
}

export default function AttendanceMarkRow({ member, currentStatus, onMark, onDelete }: Props) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900">{member.name}</div>
        <div className="text-xs text-gray-400">{member.email}</div>
      </td>
      <td className="py-3 px-4 text-gray-600">{member.role}</td>
      <td className="py-3 px-4 text-gray-500 font-mono text-xs">{member.username || '—'}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1.5 justify-center flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => onMark(member.id, opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                currentStatus === opt.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        {currentStatus && onDelete && (
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors" title="Remove record">
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
