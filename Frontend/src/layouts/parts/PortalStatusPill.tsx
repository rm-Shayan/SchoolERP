import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import type { OrgStatus } from '@/types';

// Delivery-cycle labels (user spec): "Delivered" only after the first login,
// "Not delivered" after create, "Blocked"/"Partially Blocked" via moderation.
const STYLES: Record<OrgStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Delivered', cls: 'bg-green-100 text-green-800' },
  BLOCKED: { label: 'Blocked', cls: 'bg-red-100 text-red-800' },
  PARTIALLY_BLOCKED: { label: 'Partially Blocked', cls: 'bg-amber-100 text-amber-800' },
  SETUP_PENDING: { label: 'Not delivered', cls: 'bg-amber-100 text-amber-800' },
};

export default function PortalStatusPill() {
  const orgStatus = useAppSelector((s) => s.portalStatus.orgStatus);
  if (!orgStatus) return null;
  const s = STYLES[orgStatus] ?? STYLES.ACTIVE;
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  );
}
