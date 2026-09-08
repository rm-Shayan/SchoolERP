'use client';

import { useAppSelector } from '@/store/hooks';

export function useRoleAccess() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isReceptionist = role === 'RECEPTIONIST';

  return {
    isReadOnly: false,
    canCreate: !isReceptionist,
    canEdit: !isReceptionist,
    canDelete: role === 'SUPER_ADMIN' || role === 'ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isReceptionist,
    role,
  };
}
