'use client';

import { memo } from 'react';
import { Select } from '@/features/shared/components';

const CHANNELS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
];

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' },
];

interface NotificationLogsToolbarProps {
  channel: string;
  status: string;
  total: number | null;
  onChannelChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  schoolId?: string;
  organizationId?: string;
  organizationOptions?: { value: string; label: string }[];
  onOrganizationChange?: (value: string) => void;
  schoolOptions?: { value: string; label: string }[];
  onSchoolChange?: (value: string) => void;
  onReset?: () => void;
}

const NotificationLogsToolbar = memo(function NotificationLogsToolbar({
  channel,
  status,
  total,
  onChannelChange,
  onStatusChange,
  schoolId,
  organizationId,
  organizationOptions,
  onOrganizationChange,
  schoolOptions,
  onSchoolChange,
  onReset,
}: NotificationLogsToolbarProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity stream</p><p className="mt-1 text-sm text-gray-500 tabular-nums">
          {total !== null ? <><span className="font-semibold text-gray-700">{total}</span> notification{total !== 1 ? 's' : ''} total</> : 'Loading...'}
        </p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {organizationOptions && onOrganizationChange && <div className="w-full sm:w-56"><Select label="Organization" value={organizationId ?? ''} onChange={(e) => onOrganizationChange(e.target.value)} placeholder="All organizations" options={organizationOptions} /></div>}
          {schoolOptions && onSchoolChange && (
            <div className="w-full sm:w-48">
              <Select
                label="Branch"
                value={schoolId ?? ''}
                onChange={(e) => onSchoolChange(e.target.value)}
                placeholder={organizationId ? 'All branches' : 'Select organization first'}
                options={schoolOptions}
              />
            </div>
          )}
          <div className="w-full sm:w-44">
            <Select
              label="Channel"
              value={channel}
              onChange={(e) => onChannelChange(e.target.value)}
              placeholder="All channels"
              options={CHANNELS}
            />
          </div>
          {onReset && <button type="button" onClick={onReset} className="h-10 rounded-xl px-3 text-xs font-bold text-primary-700 hover:bg-primary-50">Reset</button>}
          <div className="w-full sm:w-44">
            <Select
              label="Status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              placeholder="All statuses"
              options={STATUSES}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default NotificationLogsToolbar;
