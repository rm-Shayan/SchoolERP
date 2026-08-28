'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Badge, EmptyState, ListSkeleton } from '@/features/shared/components';
import { circularService } from '@/lib/api';
import type { Circular } from '@/lib/api/circularService';
import { formatDate } from '@/lib/utils';
import { AUDIENCE_BADGE, AUDIENCE_LABEL } from './parts/audienceMeta';
import toast from 'react-hot-toast';

export default function TeacherAnnouncementsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const all = await circularService.getBySchool(schoolId);
      setCirculars(all.filter((c) => c.audience === 'TEACHERS' || c.audience === 'ALL'));
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Circulars sent to you by the school admin."
      />
      <Card>
        <CardContent>
          {loading ? (
            <ListSkeleton count={3} />
          ) : circulars.length === 0 ? (
            <EmptyState title="No announcements yet" description="New announcements will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {circulars.map((c) => (
                <li key={c.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{c.title}</h3>
                    <Badge variant={AUDIENCE_BADGE[c.audience]}>{AUDIENCE_LABEL[c.audience]}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{c.content}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}