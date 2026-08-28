import { Button, Card, CardContent, Badge } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';
import type { PTMEvent } from '@/lib/api/ptmService';
import { cn } from '@/lib/utils';

interface PTMSessionCardProps {
  session: PTMEvent;
  onEdit: (s: PTMEvent) => void;
  onDelete: (id: string) => void;
}

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function getStatusConfig(session: PTMEvent) {
  const now = new Date();
  if (session.status === 'CANCELLED') return { label: 'Cancelled', variant: 'danger' as const, accent: 'bg-red-400' };
  if (new Date(session.scheduledAt) < now) return { label: 'Completed', variant: 'default' as const, accent: 'bg-gray-400' };
  const diff = new Date(session.scheduledAt).getTime() - now.getTime();
  if (diff < 7 * 24 * 60 * 60 * 1000) return { label: 'This Week', variant: 'warning' as const, accent: 'bg-amber-400' };
  return { label: 'Upcoming', variant: 'success' as const, accent: 'bg-emerald-400' };
}

export default function PTMSessionCard({ session, onEdit, onDelete }: PTMSessionCardProps) {
  const status = getStatusConfig(session);
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200/60">
      <div className="flex">
        {/* Left accent */}
        <div className={cn('w-1 shrink-0', status.accent)} />

        <CardContent className="flex-1 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="font-semibold text-gray-900 truncate text-[15px]">{session.title}</h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon /> {formatDate(session.scheduledAt)}
                </span>
                {session.venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon /> {session.venue}
                  </span>
                )}
              </div>
              {session.scopeLabel && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-50 border border-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                    {session.scopeLabel}
                  </span>
                  {session.teachers?.length > 0 && (
                    <span className="text-xs text-gray-500">
                      Teachers: {session.teachers.map((t) => t.name).join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => onEdit(session)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(session.id)}>Delete</Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
