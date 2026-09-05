'use client';

import { memo } from 'react';
import { Badge } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import UserAvatar from '@/features/shared/components/UserAvatar';
import { formatDate } from '@/lib/utils';
import type { DirectoryItem } from '@/lib/api/staffService';
import ActionsMenu from './ActionsMenu';

interface UserRowProps {
  member: DirectoryItem;
  currentUserId?: string;
  onToggleBlock: (member: DirectoryItem) => void;
  onOpenBlock: (member: DirectoryItem) => void;
  onView: (member: DirectoryItem) => void;
  onEdit: (member: DirectoryItem) => void;
  onDelete: (member: DirectoryItem) => void;
  onResetPassword: (member: DirectoryItem) => void;
}

const STATUS_BADGE: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success', BLOCKED: 'danger', GRADUATED: 'info', DROPPED_OUT: 'danger', TRANSFERRED_OUT: 'warning',
};

function UserRowBase({
  member, currentUserId, onToggleBlock, onOpenBlock, onView,
  onEdit, onDelete, onResetPassword,
}: UserRowProps) {
  const blocked = member.status === 'BLOCKED';
  const isStudent = member.type === 'student';
  const isCurrent = member.id === currentUserId;

  return (
    <tr
      className="border-b border-gray-100/80 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200 cursor-pointer"
      onClick={() => onView(member)}
    >
      <td className="py-3.5 px-4">
          <div className="flex items-center gap-3">
            <UserAvatar src={member.avatarUrl} orgLogoUrl={member.organization?.logoUrl} name={member.name} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{member.name}</p>
            <p className="text-xs text-gray-500 truncate">{member.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <Badge variant={isStudent ? 'info' : 'default'}>{isStudent ? 'Student' : (member.subtitle ?? '—')}</Badge>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <Logo src={member.organization?.logoUrl} name={member.organization?.name ?? ''} size="sm" />
          <span className="text-gray-700 truncate">{member.organization?.name ?? '—'}</span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <Logo src={member.branch?.logoUrl} name={member.branch?.name ?? ''} size="sm" />
          <span className="text-gray-500 truncate">{member.branch?.name ?? '—'}</span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <Badge variant={STATUS_BADGE[member.status] ?? 'default'}>{member.status.replace('_', ' ')}</Badge>
      </td>
      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formatDate(member.createdAt)}</td>
      <td className="py-3.5 px-4 text-right">
        {isCurrent ? (
          <span className="text-xs text-gray-400">Current</span>
        ) : (
          <ActionsMenu
            member={member}
            blocked={blocked}
            onEdit={onEdit}
            onDelete={onDelete}
            onResetPassword={onResetPassword}
            onBlock={onOpenBlock}
            onUnblock={onToggleBlock}
          />
        )}
      </td>
    </tr>
  );
}

const UserRow = memo(UserRowBase);
export default UserRow;
