'use client';

import { memo } from 'react';
import { Badge, Button } from '@/features/shared/components';
import { getRoleLabel, formatDate } from '@/lib/utils';
import type { User } from '@/types';
import { ROLE_BADGE } from './helpers';

interface UserRowProps {
  member: User;
  currentUserId?: string;
  busy?: boolean;
  onToggleBlock: (member: User) => void;
  onOpenBlock: (member: User) => void;
  onView: (member: User) => void;
}

const avatarGradients = [
  'from-violet-400 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
];

function getAvatarGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarGradients[hash % avatarGradients.length];
}

function UserRowBase({ member, currentUserId, busy, onToggleBlock, onOpenBlock, onView }: UserRowProps) {
  const isCurrent = member.id === currentUserId;
  const blocked = !member.isActive;
  return (
    <tr
      className="border-b border-gray-100/80 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200 cursor-pointer"
      onClick={() => onView(member)}
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${getAvatarGradient(member.name)} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-sm font-bold text-white">{member.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{member.name}</p>
            <p className="text-xs text-gray-500 truncate">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <Badge variant={ROLE_BADGE[member.role] ?? 'default'}>{getRoleLabel(member.role)}</Badge>
      </td>
      <td className="py-3.5 px-4 text-gray-700">{member.organization?.name ?? <span className="text-gray-400">Not assigned</span>}</td>
      <td className="py-3.5 px-4 text-gray-500">{member.school?.name ?? <span className="text-gray-400">Not assigned</span>}</td>
      <td className="py-3.5 px-4">
        <div>
          <Badge variant={blocked ? 'danger' : 'success'}>
            {blocked ? 'Blocked' : 'Active'}
          </Badge>
          {blocked && member.blockedReason && (
            <p className="text-[11px] text-red-500 mt-0.5 max-w-[160px] truncate" title={member.blockedReason}>
              {member.blockedReason}
            </p>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formatDate(member.createdAt)}</td>
      <td className="py-3.5 px-4 text-right">
        {isCurrent ? (
          <span className="text-xs text-gray-400">Current account</span>
        ) : blocked ? (
          <Button size="sm" variant="secondary" loading={busy} disabled={busy} onClick={(e) => { e.stopPropagation(); onToggleBlock(member); }}>
            Unblock
          </Button>
        ) : (
          <Button size="sm" variant="outline" loading={busy} disabled={busy} onClick={(e) => { e.stopPropagation(); onOpenBlock(member); }}>
            Block
          </Button>
        )}
      </td>
    </tr>
  );
}

const UserRow = memo(UserRowBase);
export default UserRow;
