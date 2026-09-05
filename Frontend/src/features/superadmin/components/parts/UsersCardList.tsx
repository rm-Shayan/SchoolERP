'use client';

import { memo } from 'react';
import { Badge, Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import UserAvatar from '@/features/shared/components/UserAvatar';
import { formatDate } from '@/lib/utils';
import type { DirectoryItem } from '@/lib/api/staffService';
import ActionsMenu from './ActionsMenu';

interface UserCardProps {
  member: DirectoryItem;
  currentUserId?: string;
  onToggleBlock: (m: DirectoryItem) => void;
  onOpenBlock: (m: DirectoryItem) => void;
  onView: (m: DirectoryItem) => void;
  onEdit: (m: DirectoryItem) => void;
  onDelete: (m: DirectoryItem) => void;
  onResetPassword: (m: DirectoryItem) => void;
}

const UserCard = memo(function UserCard({
  member, currentUserId, onToggleBlock, onOpenBlock, onView,
  onEdit, onDelete, onResetPassword,
}: UserCardProps) {
  const blocked = member.status === 'BLOCKED';
  const isStudent = member.type === 'student';

  return (
    <div className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
      <button type="button" className="flex items-start justify-between gap-3 text-left" onClick={() => onView(member)}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar src={member.avatarUrl} orgLogoUrl={member.organization?.logoUrl} name={member.name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{member.name}</p>
            <p className="text-xs text-gray-500 truncate">{member.email ?? '—'}</p>
          </div>
        </div>
        <Badge variant={blocked ? 'danger' : isStudent ? 'info' : 'success'}>
          {blocked ? 'Blocked' : member.status}
        </Badge>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isStudent ? 'info' : 'default'}>{isStudent ? 'Student' : (member.subtitle ?? '—')}</Badge>
        <span className="text-xs text-gray-400">Joined {formatDate(member.createdAt)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100/80 bg-gray-50/60 p-3 text-sm">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Organization</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Logo src={member.organization?.logoUrl} name={member.organization?.name ?? ''} size="sm" />
            <p className="truncate text-gray-900">{member.organization?.name ?? '—'}</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Branch</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Logo src={member.branch?.logoUrl} name={member.branch?.name ?? ''} size="sm" />
            <p className="truncate text-gray-900">{member.branch?.name ?? '—'}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {member.id === currentUserId ? (
          <span className="text-xs text-gray-400">Current</span>
        ) : (
          <>
            {!blocked ? (
              <Button size="sm" variant="outline" onClick={() => onOpenBlock(member)}>Block</Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => onToggleBlock(member)}>Unblock</Button>
            )}
            <ActionsMenu member={member} blocked={blocked} onEdit={onEdit} onDelete={onDelete}
              onResetPassword={onResetPassword} onBlock={onOpenBlock} onUnblock={onToggleBlock} />
          </>
        )}
      </div>
    </div>
  );
});

interface UsersCardListProps {
  members: DirectoryItem[];
  currentUserId?: string;
  onToggleBlock: (m: DirectoryItem) => void;
  onOpenBlock: (m: DirectoryItem) => void;
  onView: (m: DirectoryItem) => void;
  onEdit: (m: DirectoryItem) => void;
  onDelete: (m: DirectoryItem) => void;
  onResetPassword: (m: DirectoryItem) => void;
}

export default function UsersCardList({
  members, currentUserId, onToggleBlock, onOpenBlock, onView, onEdit, onDelete, onResetPassword,
}: UsersCardListProps) {
  return (
    <div className="md:hidden divide-y divide-gray-100/80">
      {members.map((m) => (
        <UserCard key={`${m.type}-${m.id}`} member={m} currentUserId={currentUserId}
          onToggleBlock={onToggleBlock} onOpenBlock={onOpenBlock} onView={onView}
          onEdit={onEdit} onDelete={onDelete} onResetPassword={onResetPassword} />
      ))}
    </div>
  );
}
