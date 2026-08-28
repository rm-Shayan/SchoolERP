import { Card, CardHeader, CardContent } from '@/features/shared/components';
import type { User } from '@/types';
import StaffRow from './StaffRow';

interface StaffTableProps {
  members: User[];
  onBlock: (member: User) => void;
  onUnblock: (member: User) => void;
  onEdit: (member: User) => void;
  onSelect?: (member: User) => void;
}

export default function StaffTable({ members, onBlock, onUnblock, onEdit, onSelect }: StaffTableProps) {
  return (
    <Card>
      <CardHeader><h2 className="font-semibold text-gray-900">Staff Roster</h2></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {members.map((member) => (
                 <StaffRow key={member.id} member={member} onBlock={onBlock} onUnblock={onUnblock} onEdit={onEdit} onSelect={onSelect} />
               ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
