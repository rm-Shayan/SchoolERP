'use client';

import { memo } from 'react';
import type { AuditLogEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import { ActionBadge, EntityBadge } from './ActivityBadges';

interface ActivityCardProps {
  log: AuditLogEntry;
}

const ActivityCard = memo(function ActivityCard({ log }: ActivityCardProps) {
  let reason: string | null = null;
  if (log.details) {
    try {
      reason = JSON.parse(log.details).reason ?? null;
    } catch {
      reason = null;
    }
  }

  return (
    <div className="p-4 flex flex-col gap-2 hover:bg-gray-50/50 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 break-words">
          {log.actorName ?? 'System'}
          {log.entityName && <span className="text-gray-400 font-normal"> → {log.entityName}</span>}
        </p>
        <span className="shrink-0 text-xs text-gray-400 tabular-nums">{formatDate(log.createdAt)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionBadge action={log.action} />
        <EntityBadge entityType={log.entityType} />
      </div>
      {reason && <p className="text-xs text-gray-500 truncate">Reason: {reason}</p>}
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
