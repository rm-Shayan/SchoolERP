'use client';

import { memo } from 'react';
import type { AuditLogsResponse } from '@/types';
import { EmptyState } from '@/features/shared/components';
import ActivityRow from './ActivityRow';
import ActivityCardList from './ActivityCardList';

interface ActivityTableProps {
  loading: boolean;
  data: AuditLogsResponse | null;
  isFiltered?: boolean;
}

const ActivityTable = memo(function ActivityTable({ loading, data, isFiltered = false }: ActivityTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-6 animate-pulse">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gradient-to-r from-violet-100/40 to-violet-50/30 rounded-xl border border-violet-200/20" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title={isFiltered ? 'No activity matches these filters' : 'No activity yet'}
          description={
            isFiltered
              ? 'Try changing the search, action, or entity filters to see more results.'
              : 'Logins, block/unblock actions, and organization/branch/staff changes will show up here.'
          }
        />
      </div>
    );
  }

  return (
    <>
      <ActivityCardList logs={data.items} />
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/60 to-transparent">
              <th className="py-3.5 px-4 font-medium">Actor</th>
              <th className="py-3.5 px-4 font-medium">Action</th>
              <th className="py-3.5 px-4 font-medium">Entity</th>
              <th className="py-3.5 px-4 font-medium">Name</th>
              <th className="py-3.5 px-4 font-medium">Reason</th>
              <th className="py-3.5 px-4 font-medium">IP</th>
              <th className="py-3.5 px-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((log) => (
              <ActivityRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

export default ActivityTable;
