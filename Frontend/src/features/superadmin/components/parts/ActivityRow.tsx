'use client';

import { memo } from 'react';
import type { AuditLogEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import { ActionBadge, EntityBadge, RoleBadge } from './ActivityBadges';

interface ActivityRowProps {
  log: AuditLogEntry;
}

function parseDetails(details?: string): { reason?: string; loginId?: string } | null {
  if (!details) return null;
  try { return JSON.parse(details); } catch { return null; }
}

function ActivityRowBase({ log }: ActivityRowProps) {
  const details = parseDetails(log.details);
  const reason = details?.reason;

  return (
    <tr className="border-b border-gray-100/60 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
      <td className="py-3.5 px-4">
        <p className="font-semibold text-gray-900 truncate">{log.actorName ?? 'System'}</p>
        <RoleBadge role={log.actorRole} />
      </td>
      <td className="py-3.5 px-4">
        <ActionBadge action={log.action} actorRole={log.actorRole} />
      </td>
      <td className="py-3.5 px-4">
        <EntityBadge entityType={log.entityType} />
      </td>
      <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate" title={log.entityName ?? ''}>
        {log.entityName ?? '—'}
      </td>
      <td className="py-3.5 px-4 text-gray-500 max-w-[160px] truncate text-xs" title={reason ?? ''}>
        {reason ?? '—'}
      </td>
      <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap" title={log.ipAddress ?? ''}>
        {log.ipAddress ?? '—'}
      </td>
      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-xs">{formatDate(log.createdAt)}</td>
    </tr>
  );
}

const ActivityRow = memo(ActivityRowBase);
export default ActivityRow;
