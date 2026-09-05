'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import {
  PageHeader, Card, EmptyState, Select, Button, CardGridSkeleton, ConfirmDialog,
} from '@/features/shared/components';
import TrackingStats from './parts/TrackingStats';
import HomeworkPostModal from './parts/HomeworkPostModal';
import HomeworkTeacherCard from './parts/HomeworkTeacherCard';
import useSectionOptions from './parts/useSectionOptions';
import toast from 'react-hot-toast';

interface TeacherGroup {
  id: string;
  name: string;
  items: Homework[];
}

export default function HomeworkTrackingPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [items, setItems] = useState<Homework[]>([]);
  const [total, setTotal] = useState(0);
  const sections = useSectionOptions(schoolId);
  const [sectionId, setSectionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [deleting, setDeleting] = useState<Homework | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (filterSectionId?: string) => {
    setLoading(true);
    try {
      const list = await homeworkService.getAll({
        pageSize: 100,
        ...(filterSectionId ? { sectionId: filterSectionId } : {}),
      });
      setItems(list.items);
      setTotal(list.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Teacher-wise grouping — ek card mein us teacher ke saare homework
  const groups: TeacherGroup[] = useMemo(() => {
    const map = new Map<string, TeacherGroup>();
    for (const hw of items) {
      const key = hw.createdBy?.id ?? 'staff';
      if (!map.has(key)) map.set(key, { id: key, name: hw.createdBy?.name ?? 'Staff', items: [] });
      map.get(key)!.items.push(hw);
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [items]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      totalHomework: total,
      thisWeek: items.filter((h) => new Date(h.sentAt).getTime() >= weekAgo).length,
      activeTeachers: groups.length,
    };
  }, [items, total, groups]);

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await homeworkService.remove(deleting.id);
      toast.success('Homework deleted');
      setDeleting(null);
      load(sectionId || undefined);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete homework');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework Tracking"
        description="Teacher-wise homework tracking — admin bhi teacher ki taraf se post/edit/delete kar sakta hai. Academic year end par purani homework auto-delete."
        actions={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>New Homework</Button>}
      />

      <HomeworkPostModal
        key={editing?.id ?? 'new'}
        open={showForm}
        editing={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); load(sectionId || undefined); }}
      />

      <TrackingStats {...stats} />

      <div className="max-w-xs">
        <Select
          label="Filter by Section"
          placeholder="All sections"
          options={sections.map((s) => ({ value: s.id, label: s.label }))}
          value={sectionId}
          onChange={(e) => { setSectionId(e.target.value); load(e.target.value || undefined); }}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState title="No homework found" description={sectionId ? 'No homework posted for this section yet.' : 'No teacher has posted homework yet.'} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {groups.map((g) => (
            <HomeworkTeacherCard
              key={g.id}
              name={g.name}
              items={g.items}
              onEdit={(hw) => { setEditing(hw); setShowForm(true); }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete homework?"
        message={`"${deleting?.title}" permanently delete ho jayega. Parents ko is baare mein koi notification nahi jayega.`}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
