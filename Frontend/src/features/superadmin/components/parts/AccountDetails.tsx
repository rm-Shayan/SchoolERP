import { formatDate, getRoleLabel } from '@/lib/utils';
import type { User } from '@/types';

interface AccountDetailsProps {
  user: User | null;
}

export default function AccountDetails({ user }: AccountDetailsProps) {
  const rows = [
    { label: 'Application', value: 'School Management System' },
    { label: 'Role', value: user ? getRoleLabel(user.role) : '—' },
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Phone', value: user?.phone ?? '—' },
    { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive', active: !!user?.isActive },
    { label: 'Joined', value: user ? formatDate(user.createdAt) : '—' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.03)]">
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2.5 tracking-tight">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 flex items-center justify-center shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        Account Details
      </h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Your account information and sign-in details.
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 group">
            <dt className="text-gray-400 mb-1 text-xs font-semibold uppercase tracking-wider">{row.label}</dt>
            <dd className={row.active ? 'font-bold text-emerald-600 flex items-center gap-1.5' : 'font-semibold text-gray-900 truncate'}>
              {row.active && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
