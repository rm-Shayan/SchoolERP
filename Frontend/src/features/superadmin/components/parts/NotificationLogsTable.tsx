'use client';

import { memo } from 'react';
import { Badge, EmptyState } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';
import type { NotificationLogsResponse } from '@/types';

const CHANNEL_BADGE: Record<string, 'info' | 'warning' | 'default'> = {
  EMAIL: 'info',
  SMS: 'warning',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  SENT: 'success',
  DELIVERED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
};

function ChannelIcon({ channel }: { channel: string }) {
  return channel === 'EMAIL' ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>;
}
function StatusIcon({ status }: { status: string }) { return status === 'FAILED' ? <span className="text-rose-500">!</span> : status === 'PENDING' ? <span className="text-amber-500">◷</span> : <span className="text-emerald-500">✓</span>; }

interface NotificationLogsTableProps {
  loading: boolean;
  data: NotificationLogsResponse | null;
}

const NotificationLogsTable = memo(function NotificationLogsTable({ loading, data }: NotificationLogsTableProps) {
  if (loading && !data) {
    return (
      <div className="p-8 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gradient-to-r from-violet-100/40 to-violet-50/30 rounded-xl animate-pulse border border-violet-200/20" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        description="Notifications appear here as emails/SMS messages are sent."
      />
    );
  }

  return (
    <div>
      <div className="space-y-3 p-3 sm:hidden">
        {items.map((log) => (
          <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><ChannelIcon channel={log.channel} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{log.recipient}</p><p className="mt-0.5 truncate text-xs text-slate-500">{log.school?.name || 'All branches'}</p></div>
              <Badge variant={STATUS_BADGE[log.status] ?? 'default'}><StatusIcon status={log.status} /> {log.status}</Badge>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{log.message}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><Badge variant={CHANNEL_BADGE[log.channel] ?? 'default'}>{log.channel}</Badge><span className="text-[11px] font-medium text-slate-400">{formatDate(log.createdAt)}</span></div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3.5 font-medium">Recipient / Branch</th>
            <th className="px-4 py-3.5 font-medium">Channel</th>
            <th className="px-4 py-3.5 font-medium">Status</th>
            <th className="px-4 py-3.5 font-medium">Message</th>
            <th className="px-5 py-3.5 text-right font-medium">Sent At</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => (
            <tr key={log.id} className="border-b border-slate-100 transition-colors hover:bg-primary-50/30">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><ChannelIcon channel={log.channel} /></div><div className="min-w-0"><p className="max-w-[220px] truncate font-bold text-slate-900">{log.recipient}</p><p className="mt-0.5 text-xs text-slate-400">{log.school?.name || 'All branches'}</p></div></div></td>
              <td className="px-4 py-3.5">
                <Badge variant={CHANNEL_BADGE[log.channel] ?? 'default'}>{log.channel}</Badge>
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={STATUS_BADGE[log.status] ?? 'default'}>{log.status}</Badge>
              </td>
              <td className="max-w-[360px] truncate px-4 py-4 text-slate-600" title={log.message}>
                {log.message}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-right text-xs font-medium text-slate-400">{formatDate(log.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
});

export default NotificationLogsTable;
