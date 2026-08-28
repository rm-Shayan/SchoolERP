'use client';

import { memo } from 'react';
import { Badge, Button } from '@/features/shared/components';
import { formatDate, getRoleLabel } from '@/lib/utils';
import type { User } from '@/types';
import { ROLE_BADGE } from './helpers';

interface UserCardProps {
  member: User;
  currentUserId?: string;
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

const UserCard = memo(function UserCard({ member, currentUserId, onToggleBlock, onOpenBlock, onView }: UserCardProps) {
  const isCurrent = member.id === currentUserId;
  const blocked = !member.isActive;
  return (
    <div className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors duration-200">
      <button type="button" className="flex items-start justify-between gap-3 text-left" onClick={() => onView(member)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getAvatarGradient(member.name)} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-sm font-bold text-white">{member.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{member.name}</p>
            <p className="text-xs text-gray-500 truncate">{member.email}</p>
          </div>
        </div>
        <Badge variant={blocked ? 'danger' : 'success'}>
          {blocked ? 'Blocked' : 'Active'}
        </Badge>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={ROLE_BADGE[member.role] ?? 'default'}>{getRoleLabel(member.role)}</Badge>
        <span className="text-xs text-gray-400">Joined {formatDate(member.createdAt)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100/80 bg-gray-50/60 p-3 text-sm">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Organization</p>
          <p className="mt-0.5 truncate text-gray-900">{member.organization?.name ?? <span className="text-gray-400">Not assigned</span>}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Branch</p>
          <p className="mt-0.5 truncate text-gray-900">{member.school?.name ?? <span className="text-gray-400">Not assigned</span>}</p>
        </div>
      </div>

      {blocked && member.blockedReason && (
        <p className="text-xs text-red-500">Reason: {member.blockedReason}</p>
      )}

      <div className="flex justify-end">
        {isCurrent ? (
          <span className="text-xs text-gray-400">Current account</span>
        ) : blocked ? (
          <Button size="sm" variant="secondary" onClick={() => onToggleBlock(member)}>
            Unblock
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onOpenBlock(member)}>
            Block
          </Button>
        )}
      </div>
    </div>
  );
});

interface UsersCardListProps {
  members: User[];
  currentUserId?: string;
  onToggleBlock: (member: User) => void;
  onOpenBlock: (member: User) => void;
  onView: (member: User) => void;
}

export default function UsersCardList({ members, currentUserId, onToggleBlock, onOpenBlock, onView }: UsersCardListProps) {
  return (
    <div className="md:hidden divide-y divide-gray-100/80">
      {members.map((member) => (
        <UserCard
          key={member.id}
          member={member}
          currentUserId={currentUserId}
          onToggleBlock={onToggleBlock}
          onOpenBlock={onOpenBlock}
          onView={onView}
        />
      ))}
    </div>
  );
}
