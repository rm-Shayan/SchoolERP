import { cn } from '@/lib/utils';
import type { AuditAction, AuditEntityType } from '@/types';

export const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: 'Staff login',
  LOGOUT: 'Staff logout',
  PARENT_LOGIN: 'Parent login',
  STUDENT_LOGIN: 'Student login',
  CREATE_ORG: 'Organization created',
  UPDATE_ORG: 'Organization updated',
  DELETE_ORG: 'Organization deleted',
  CREATE_SCHOOL: 'Branch created',
  UPDATE_SCHOOL: 'Branch updated',
  DELETE_SCHOOL: 'Branch deleted',
  ASSIGN_SCHOOL_ADMIN: 'Branch admin assigned',
  CREATE_STAFF: 'Staff account created',
  UPDATE_STAFF: 'Staff account updated',
  DEACTIVATE_STAFF: 'Staff deactivated',
  REACTIVATE_STAFF: 'Staff reactivated',
  RESET_STAFF_PASSWORD: 'Staff password reset',
  BLOCK_ORG: 'Organization blocked',
  UNBLOCK_ORG: 'Organization unblocked',
  BLOCK_SCHOOL: 'Branch blocked',
  UNBLOCK_SCHOOL: 'Branch unblocked',
  BLOCK_USER: 'Staff blocked',
  UNBLOCK_USER: 'Staff unblocked',
  BLOCK_STUDENT: 'Student blocked',
  UNBLOCK_STUDENT: 'Student unblocked',
  BLOCK_PARENT: 'Parent blocked',
  UNBLOCK_PARENT: 'Parent unblocked',
};

type BadgeStyle = { dot: string; badge: string };

const ACTION_STYLE: Partial<Record<AuditAction, BadgeStyle>> = {
  LOGIN: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 shadow-sm shadow-sky-100/50' },
  LOGOUT: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 shadow-sm shadow-gray-200/50' },
  PARENT_LOGIN: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 shadow-sm shadow-sky-100/50' },
  STUDENT_LOGIN: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 shadow-sm shadow-sky-100/50' },
  CREATE_ORG: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  CREATE_SCHOOL: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  CREATE_STAFF: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  ASSIGN_SCHOOL_ADMIN: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 shadow-sm shadow-sky-100/50' },
  DEACTIVATE_STAFF: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 shadow-sm shadow-amber-100/50' },
  REACTIVATE_STAFF: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  BLOCK_ORG: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  BLOCK_SCHOOL: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  BLOCK_USER: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  BLOCK_STUDENT: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  BLOCK_PARENT: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  UNBLOCK_ORG: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  UNBLOCK_SCHOOL: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  UNBLOCK_USER: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  UNBLOCK_STUDENT: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  UNBLOCK_PARENT: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm shadow-emerald-100/50' },
  DELETE_ORG: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
  DELETE_SCHOOL: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-sm shadow-rose-100/50' },
};

const DEFAULT_STYLE: BadgeStyle = { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 shadow-sm shadow-gray-200/50' };

export function ActionBadge({ action }: { action: AuditAction }) {
  const s = ACTION_STYLE[action] ?? DEFAULT_STYLE;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200', s.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

export const ENTITY_LABELS: Record<AuditEntityType, string> = {
  ORGANIZATION: 'Organization',
  SCHOOL: 'Branch',
  USER: 'Staff',
  STUDENT: 'Student',
  PARENT: 'Parent',
  AUTH: 'Auth',
};

const ENTITY_DOT: Record<AuditEntityType, string> = {
  ORGANIZATION: 'bg-violet-500',
  SCHOOL: 'bg-emerald-500',
  USER: 'bg-sky-500',
  STUDENT: 'bg-amber-500',
  PARENT: 'bg-rose-500',
  AUTH: 'bg-gray-400',
};

export function EntityBadge({ entityType }: { entityType: AuditEntityType }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-gray-100 text-gray-600 shadow-sm shadow-gray-200/50 transition-all duration-200">
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', ENTITY_DOT[entityType] ?? 'bg-gray-400')} />
      {ENTITY_LABELS[entityType] ?? entityType}
    </span>
  );
}
