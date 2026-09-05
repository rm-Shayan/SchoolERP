'use client';

import { useAppSelector } from '@/store/hooks';

const READ_ONLY_ROLES = ['RECEPTIONIST'];

export function useRoleAccess() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isReadOnly = !!role && READ_ONLY_ROLES.includes(role);

  return {
    isReadOnly,
    canCreate: !isReadOnly,
    canEdit: !isReadOnly,
    canDelete: !isReadOnly && role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    role,
  };
}
