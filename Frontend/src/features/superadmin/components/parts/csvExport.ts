'use client';

import type { User } from '@/types';
import { getRoleLabel, formatDate } from '@/lib/utils';

export function exportUsersCsv(users: User[]) {
  const header = ['Name', 'Email', 'Role', 'Organization', 'Branch', 'Status', 'Block Reason', 'Joined'];
  const rows = users.map((u) => [
    u.name,
    u.email,
    getRoleLabel(u.role),
    u.organization?.name ?? '',
    u.school?.name ?? '',
    u.isActive ? 'Active' : 'Blocked',
    u.blockedReason ?? '',
    formatDate(u.createdAt),
  ]);

  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
