import { Modal, Badge } from '@/features/shared/components';
import { formatDate, getRoleLabel } from '@/lib/utils';
import type { User } from '@/types';
import { ROLE_BADGE } from './helpers';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  if (!user) return null;
  const blocked = !user.isActive;

  return (
    <Modal open={true} onClose={onClose} title="User Profile" size="md">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-lg font-bold shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={ROLE_BADGE[user.role] ?? 'default'}>{getRoleLabel(user.role)}</Badge>
            <Badge variant={blocked ? 'danger' : 'success'}>{blocked ? 'Blocked' : 'Active'}</Badge>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <Field label="Staff ID / Username" value={user.username ?? 'Not set'} mono />
        <Field label="Organization" value={user.organization?.name ?? 'Not assigned'} />
        <Field label="Branch" value={user.school?.name ?? 'Not assigned'} />
        <Field label="Joined" value={formatDate(user.createdAt)} />
        <Field label="Account ID" value={user.id} mono />
        <Field label="Phone" value={user.phone ?? '—'} />
      </dl>

      {blocked && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Block details</p>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label="Reason" value={user.blockedReason ?? 'Not provided'} />
            <Field label="Blocked by" value={user.blockedByName ?? 'Not provided'} />
            <Field label="Blocked at" value={user.blockedAt ? formatDate(user.blockedAt) : 'Not available'} />
          </dl>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className={`mt-0.5 text-gray-900 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
