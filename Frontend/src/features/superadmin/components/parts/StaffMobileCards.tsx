import { Badge } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import UserAvatar from '@/features/shared/components/UserAvatar';
import { cn, formatDate, getRoleLabel } from '@/lib/utils';
import type { OrgStaffRow } from '@/types';

const roleBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ADMIN: 'warning', RECEPTIONIST: 'default', TEACHER: 'success', SUPER_ADMIN: 'info',
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xs font-medium text-slate-700" title={value}>{value}</p>
    </div>
  );
}

export default function StaffMobileCards({ staff }: { staff: OrgStaffRow[] }) {
  if (!staff.length) {
    return <p className="px-4 py-12 text-center text-sm text-slate-400">No staff match these filters.</p>;
  }

  return (
    <div className="space-y-3 bg-slate-50/70 p-3 sm:p-4">
      {staff.map((member) => (
        <article key={member.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 items-center gap-3 p-4">
             <UserAvatar src={member.avatarUrl} name={member.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
              <span className="mt-0.5 truncate text-xs text-slate-500 flex items-center gap-1.5">
                <Logo src={member.schoolLogoUrl} name={member.schoolName ?? ''} size="sm" />
                {member.schoolName ?? 'No branch assigned'}
              </span>
            </div>
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
            <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p><Badge variant={roleBadge[member.role] || 'default'}>{getRoleLabel(member.role)}</Badge></div>
            <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p><Badge variant={member.status === 'ACTIVE' ? 'success' : 'danger'}>{member.status === 'ACTIVE' ? 'Active' : 'Blocked'}</Badge></div>
            <Detail label="Join date" value={formatDate(member.joinedAt)} />
            <Detail label="Block reason" value={member.blockedReason ?? '—'} />
          </div>
        </article>
      ))}
    </div>
  );
}
