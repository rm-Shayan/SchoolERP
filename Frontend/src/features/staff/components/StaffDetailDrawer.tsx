'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { staffLeaveService } from '@/lib/api';
import { documentsApi } from '@/lib/api/documents';
import { Badge, Button, Card, CardContent } from '@/features/shared/components';
import { getRoleLabel, formatDate, cn } from '@/lib/utils';
import StaffAttendanceSummary from '@/features/staff/components/parts/StaffAttendanceSummary';
import type { StaffLeaveRequest } from '@/lib/api/staffLeaveService';

interface Props {
  member: User | null;
  onClose: () => void;
  onEdit: (m: User) => void;
  onBlock: (m: User) => void;
  onUnblock: (m: User) => void;
  onChanged: () => void;
}

type Tab = 'profile' | 'attendance' | 'leaves';
const tabs: { k: Tab; label: string }[] = [
  { k: 'profile', label: 'Profile' },
  { k: 'attendance', label: 'Attendance' },
  { k: 'leaves', label: 'Leaves' },
];

function InfoRow({ label, value, accent }: { label: string; value?: string | null; accent?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={cn('text-sm text-right', accent ? 'text-red-600 font-medium' : 'text-gray-900')}>{value}</span>
    </div>
  );
}

export default function StaffDetailDrawer({ member, onClose, onEdit, onBlock, onUnblock, onChanged }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [leaves, setLeaves] = useState<StaffLeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  useEffect(() => {
    if (tab === 'leaves' && member) {
      setLoadingLeaves(true);
      staffLeaveService
        .listAll({ staffId: member.id, limit: 50 })
        .then((r) => setLeaves(r.data.data.requests ?? []))
        .catch(() => setLeaves([]))
        .finally(() => setLoadingLeaves(false));
    }
  }, [tab, member]);

  if (!member) return null;
  const roleBadge = member.role === 'ADMIN' ? 'info' : member.role === 'TEACHER' ? 'success' : 'default';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-lg bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold shadow-lg">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">{member.name}</h2>
                <p className="text-sm text-white/70 truncate">{member.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={roleBadge}>{getRoleLabel(member.role)}</Badge>
                  <Badge variant={member.isActive ? 'success' : 'danger'}>{member.isActive ? 'Active' : 'Blocked'}</Badge>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-200">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={cn('flex-1 px-2 py-3 text-xs font-semibold transition-all border-b-2',
                tab === t.k ? 'text-primary-700 border-primary-600 bg-primary-50/50' : 'text-gray-400 border-transparent hover:text-gray-600')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'profile' && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <InfoRow label="Email" value={member.email} />
                <InfoRow label="Phone" value={member.phone} />
                <InfoRow label="Username" value={member.username} />
                <InfoRow label="Joined" value={formatDate(member.createdAt)} />
                {!member.isActive && member.blockedByName && <InfoRow label="Blocked by" value={member.blockedByName} accent />}
                {!member.isActive && member.blockedReason && <InfoRow label="Reason" value={member.blockedReason} accent />}
              </CardContent>
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => documentsApi.staffIdCard(member.id)}>ID Card</Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(member)}>Edit</Button>
                <Button size="sm" variant={member.isActive ? 'danger' : 'outline'}
                  onClick={() => { member.isActive ? onBlock(member) : onUnblock(member); onChanged(); }}>
                  {member.isActive ? 'Block' : 'Unblock'}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'attendance' && <StaffAttendanceSummary staffId={member.id} />}

          {tab === 'leaves' && (loadingLeaves ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No leave requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {leaves.map((l) => (
                <li key={l.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={l.status === 'APPROVED_LEAVE' ? 'success' : l.status === 'REJECTED_LEAVE' ? 'danger' : 'info'}>{l.status?.replace('_LEAVE', '')}</Badge>
                    <span className="text-xs text-gray-400">{l.createdAt ? formatDate(l.createdAt) : ''}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{l.reason ?? 'No reason provided'}</p>
                </li>
              ))}
            </ul>
          ))}

        </div>
      </aside>
    </div>
  );
}
