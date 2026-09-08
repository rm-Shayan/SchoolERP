'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Button, ConfirmDialog, EmptyState, StatsCard, ListSkeleton } from '@/features/shared/components';
import { circularService } from '@/lib/api';
import type { Circular } from '@/lib/api/circularService';
import { AUDIENCE_ICON } from './parts/audienceMeta';
import CircularFormModal from './parts/CircularFormModal';
import CircularItem from './parts/CircularItem';
import toast from 'react-hot-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';

export default function CircularsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const { role } = useRoleAccess();
  const isReadOnly = role === 'RECEPTIONIST';
  const schoolId = school?.id ?? user?.schoolId;
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<Circular | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      setCirculars(await circularService.getBySchool(schoolId));
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingId(deleting.id);
    try {
      await circularService.remove(deleting.id);
      toast.success('Announcement deleted');
      await load();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
      setDeleting(null);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = circulars.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return [
      { title: 'Total Circulars', value: circulars.length, icon: AUDIENCE_ICON.ALL, tint: 'sa-tint-1', subtitle: 'All time' },
      { title: 'This Month', value: thisMonth, icon: AUDIENCE_ICON.PARENTS, tint: 'sa-tint-2', subtitle: 'Published recently' },
      { title: 'To Parents', value: circulars.filter((c) => c.audience !== 'TEACHERS').length, icon: AUDIENCE_ICON.PARENTS, tint: 'sa-tint-3', subtitle: 'Incl. whole school' },
      { title: 'Teachers Only', value: circulars.filter((c) => c.audience === 'TEACHERS').length, icon: AUDIENCE_ICON.TEACHERS, tint: 'sa-tint-4', subtitle: 'Staff notices' },
    ];
  }, [circulars]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circulars"
        description="Create announcements for parents, teachers, or the whole school."
        actions={!isReadOnly && <Button onClick={() => setShowCreate(true)}>+ New Circular</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatsCard key={s.title} index={i} {...s} />
        ))}
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <ListSkeleton count={3} />
          ) : circulars.length === 0 ? (
            <EmptyState
              icon={AUDIENCE_ICON.ALL}
              title="No circulars yet"
              description="Publish your first announcement — parents and teachers will see it instantly."
              action={!isReadOnly && <Button onClick={() => setShowCreate(true)}>+ New Circular</Button>}
            />
          ) : (
            <ul className="space-y-3">
              {circulars.map((c) => (
                <CircularItem key={c.id} circular={c} deleting={deletingId === c.id} onDelete={isReadOnly ? undefined : setDeleting} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CircularFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={load}
        schoolId={schoolId ?? ''}
        defaultAudience="ALL"
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this announcement?"
        message={`"${deleting?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
