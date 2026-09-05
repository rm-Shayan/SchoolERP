'use client';

import { memo } from 'react';
import type { AuditLogEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import { ActionBadge, EntityBadge, RoleBadge } from './ActivityBadges';

interface ActivityCardProps {
  log: AuditLogEntry;
}

const ActivityCard = memo(function ActivityCard({ log }: ActivityCardProps) {
  let reason: string | null = null;
  if (log.details) {
    try { reason = JSON.parse(log.details).reason ?? null; } catch { reason = null; }
  }

  return (
    <div className="p-4 flex flex-col gap-2.5 hover:bg-gray-50/50 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 break-words">
            {log.actorName ?? 'System'}
          </p>
          <div className="mt-1"><RoleBadge role={log.actorRole} /></div>
        </div>
        <span className="shrink-0 text-xs text-gray-400 tabular-nums">{formatDate(log.createdAt)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionBadge action={log.action} actorRole={log.actorRole} />
        <EntityBadge entityType={log.entityType} />
      </div>
      {log.entityName && (
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">Target:</span> {log.entityName}
        </p>
      )}
      {reason && <p className="text-xs text-gray-500 truncate">Reason: {reason}</p>}
      {log.ipAddress && (
        <p className="text-[11px] text-gray-400">IP: {log.ipAddress}</p>
      )}
    </div>
  );
});

interface ActivityCardListProps {
  logs: AuditLogEntry[];
}

export default function ActivityCardList({ logs }: ActivityCardListProps) {
  return (
    <div className="md:hidden divide-y divide-gray-100/80">
      {logs.map((log) => (
        <ActivityCard key={log.id} log={log} />
      ))}
    </div>
  );
}
