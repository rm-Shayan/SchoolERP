'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ptmService } from '@/lib/api';
import type { PTMEvent } from '@/lib/api/ptmService';
import { PageHeader, Card, CardContent, EmptyState, Badge } from '@/features/shared/components';
import { ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { formatDate } from '@/lib/utils';

type Tab = 'upcoming' | 'past';

export default function TeacherPTMPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [sessions, setSessions] = useState<PTMEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      setSessions(await ptmService.getBySchool(schoolId));
    } catch {
      toast.error('Failed to load PTM sessions');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['ptm_created', 'ptm_updated', 'ptm_deleted'], load);

  const mySessions = useMemo(() => {
    if (!user) return [];
    return sessions.filter(
      (s) => s.teachers?.some((t) => t.id === user.id) || s.scope === 'WHOLE_SCHOOL',
    );
  }, [sessions, user]);

  const now = new Date();
  const upcoming = useMemo(
    () => mySessions.filter((s) => new Date(s.scheduledAt) >= now && s.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [mySessions],
  );
  const past = useMemo(
    () => mySessions.filter((s) => new Date(s.scheduledAt) < now || s.status === 'CANCELLED'),
    [mySessions],
  );

  const active = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My PTM Sessions"
        description="Parent-teacher meetings you are assigned to."
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
          <p className="text-xs text-gray-500">Upcoming</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{past.length}</p>
          <p className="text-xs text-gray-500">Past</p>
        </div>
      </div>

      <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['upcoming', 'past'] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="capitalize">{key}</span>
            <Badge variant={tab === key ? 'success' : 'default'}>
              {key === 'upcoming' ? upcoming.length : past.length}
            </Badge>
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : active.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              title={tab === 'upcoming' ? 'No upcoming PTMs' : 'No past PTMs'}
              description={tab === 'upcoming' ? 'No parent-teacher meetings assigned to you yet.' : 'Previously conducted PTMs will appear here.'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((s) => (
            <Card key={s.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(s.scheduledAt)}</p>
                  {s.venue && <p className="text-xs text-gray-400 mt-0.5">📍 {s.venue}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Scope: {s.scopeLabel ?? s.scope}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={s.status === 'SCHEDULED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'info'}>
                    {s.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
