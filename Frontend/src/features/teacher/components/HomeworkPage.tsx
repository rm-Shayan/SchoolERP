'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import { PageHeader, Button, Card, Modal, EmptyState, CardGridSkeleton } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';
import HomeworkForm, { type SectionOption, type HomeworkFormValues } from './parts/HomeworkForm';
import toast from 'react-hot-toast';

export default function HomeworkPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [items, setItems] = useState<Homework[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, classes] = await Promise.all([
        homeworkService.getAll(),
        academicService.getClassesBySchool(schoolId ?? ''),
      ]);
      setItems(list.items);
      // Backend listClassesBySchool nested sections include karta hai — ek hi request
      const opts: SectionOption[] = [];
      for (const c of classes) {
        (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id }));
      }
      setSections(opts);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleCreate = async (values: HomeworkFormValues) => {
    try {
      const payload: any = { sectionId: values.sectionId, title: values.title, content: values.content };
      if (values.subjectIds?.length) payload.subjectIds = values.subjectIds;
      await homeworkService.create(payload);
      toast.success('Homework broadcast to parents');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post homework');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Post homework per section — parents get notified instantly."
        actions={<Button size="sm" onClick={() => setShowForm(true)}>New Homework</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Post Homework">
        <HomeworkForm
          sections={sections}
          sectionsLoading={loading && sections.length === 0}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card><EmptyState title="No homework yet" description="Post the first homework assignment for your sections." action={<Button size="sm" onClick={() => setShowForm(true)}>New Homework</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((hw) => (
            <Card key={hw.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hw.section?.class ? `${hw.section.class.name} — ${hw.section.name}` : 'Section'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(hw.sentAt)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{hw.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
