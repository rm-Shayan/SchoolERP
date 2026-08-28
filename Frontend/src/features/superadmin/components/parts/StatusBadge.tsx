import { Badge } from '@/features/shared/components';
import type { OrgStatus, SchoolStatus } from '@/types';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const ORG_STATUS: Record<OrgStatus, { label: string; variant: Variant }> = {
  ACTIVE: { label: 'Delivered', variant: 'success' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
  PARTIALLY_BLOCKED: { label: 'Partially Blocked', variant: 'warning' },
  SETUP_PENDING: { label: 'Not delivered', variant: 'warning' },
};

const SCHOOL_STATUS: Record<SchoolStatus, { label: string; variant: Variant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
};

export function OrgStatusBadge({ status }: { status?: OrgStatus }) {
  const s = ORG_STATUS[status ?? 'SETUP_PENDING'] ?? ORG_STATUS.SETUP_PENDING;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function SchoolStatusBadge({ status }: { status?: SchoolStatus }) {
  const s = SCHOOL_STATUS[status ?? 'ACTIVE'] ?? SCHOOL_STATUS.ACTIVE;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
