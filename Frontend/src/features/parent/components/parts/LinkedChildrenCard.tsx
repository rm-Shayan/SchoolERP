'use client';

import { Card, CardContent, Badge } from '@/features/shared/components';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';
import { PortalAvatar } from '../portalCards';
import toast from 'react-hot-toast';

export interface LinkedChildRow {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  rollNumber: string;
  className?: string | null;
  sectionName?: string | null;
  status: string;
}

interface LinkedChildrenCardProps {
  children: LinkedChildRow[];
  activeChildId: string;
  onChildChange: (id: string) => void;
}

/** Linked Children — har row clickable: jis child par click karo wo ACTIVE
 *  ho jata hai (same scene child switcher jaisa). */
export default function LinkedChildrenCard({ children: kids, activeChildId, onChildChange }: LinkedChildrenCardProps) {
  const color = getOrgThemeColor() || '#6366f1';
  if (kids.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Linked Children</h3>
          <Badge variant="info">{kids.length}</Badge>
        </div>
        <div className="space-y-2">
          {kids.map((child) => {
            const isViewing = child.id === activeChildId;
            const name = `${child.firstName} ${child.lastName}`;
            return (
              <button
                key={child.id}
                type="button"
                disabled={isViewing}
                onClick={() => {
                  onChildChange(child.id);
                  toast.success(`Now viewing ${name}'s data`);
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  isViewing
                    ? 'border-transparent ring-2 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                )}
                style={isViewing ? { boxShadow: `0 0 0 1px ${color}, 0 4px 12px ${color}22` } : undefined}
              >
                <PortalAvatar src={child.imageUrl} name={name} color={color} className="h-10 w-10 rounded-xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[child.className, child.sectionName].filter(Boolean).join(' · ') || '—'} · Roll #{child.rollNumber}
                  </p>
                </div>
                {isViewing ? (
                  <span
                    className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ background: color }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Viewing
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-medium text-gray-400 group-hover:text-primary-600">
                    {child.status === 'ACTIVE' ? 'Switch' : child.status.replace('_', ' ')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">Tap a child to view their attendance, fees and results.</p>
      </CardContent>
    </Card>
  );
}