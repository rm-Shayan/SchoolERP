import { Card, CardContent } from '@/features/shared/components';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

export interface PortalChildBrief {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  sectionId?: string | null;
  className?: string | null;
  sectionName?: string | null;
  imageUrl?: string | null;
}

export function groupByChild<T>(
  items: T[],
  children: PortalChildBrief[],
  match: (item: T, child: PortalChildBrief) => boolean
): { child: PortalChildBrief; items: T[] }[] {
  return children
    .map((child) => ({ child, items: items.filter((i) => match(i, child)) }))
    .filter((g) => g.items.length > 0);
}

export function ChildSectionHeader({ child, count, hint }: { child: PortalChildBrief; count: number; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      {child.imageUrl ? (
        <img src={child.imageUrl} alt={`${child.firstName} ${child.lastName}`} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
      ) : (
        <AvatarPlaceholder className="h-9 w-9 shrink-0 rounded-xl" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-gray-900">{child.firstName} {child.lastName}</p>
        <p className="truncate text-xs text-gray-500">
          {[child.className, child.sectionName].filter(Boolean).join(' · ') || 'Roll #' + child.rollNumber}
          {count > 0 ? ` · ${count} record${count > 1 ? 's' : ''}` : ''} {hint ?? ''}
        </p>
      </div>
    </div>
  );
}

export function ChildEmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-sm text-gray-500">{message}</p>
      </CardContent>
    </Card>
  );
}
