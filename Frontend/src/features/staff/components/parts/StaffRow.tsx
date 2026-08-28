'use client';

import { memo } from 'react';
import type { User } from '@/types';
import { Badge, Button } from '@/features/shared/components';
import { getRoleLabel, formatDate } from '@/lib/utils';
import { documentsApi } from '@/lib/api/documents';

interface StaffRowProps {
  member: User;
  onBlock: (member: User) => void;
  onUnblock: (member: User) => void;
  onEdit: (member: User) => void;
  onSelect?: (member: User) => void;
}

function StaffRow({ member, onBlock, onUnblock, onEdit, onSelect }: StaffRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelect?.(member)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-700">{member.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
            {member.phone && <p className="text-xs text-gray-500 truncate">{member.phone}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <span className="block truncate min-w-0">{member.email}</span>
      </td>
      <td className="px-4 py-3">
        <Badge variant={member.role === 'ADMIN' ? 'info' : member.role === 'TEACHER' ? 'success' : 'default'}>
          {getRoleLabel(member.role)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={member.isActive ? 'success' : 'danger'}>{member.isActive ? 'Active' : 'Blocked'}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(member.createdAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => documentsApi.staffIdCard(member.id)}>ID Card</Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(member)}>Edit</Button>
          <Button size="sm" variant={member.isActive ? 'danger' : 'outline'}
            onClick={() => member.isActive ? onBlock(member) : onUnblock(member)}>
            {member.isActive ? 'Block' : 'Unblock'}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default memo(StaffRow);
