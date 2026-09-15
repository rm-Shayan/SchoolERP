'use client';

import { useCallback, useEffect, useState } from 'react';
import { homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import { Card, EmptyState, CardGridSkeleton, Pagination, Button } from '@/features/shared/components';
import HomeworkCard from './HomeworkCard';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

interface HomeworkListProps {
  userId?: string;
  reloadKey: number;
  onEdit: (hw: Homework) => void;
  onDelete: (hw: Homework) => void;
  onNeedCreate: () => void;
}

export default function HomeworkList({ userId, reloadKey, onEdit, onDelete, onNeedCreate }: HomeworkListProps) {
  const [items, setItems] = useState<Homework[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await homeworkService.getAll({ page, pageSize: PAGE_SIZE });
      setItems(list.items);
      setTotal(list.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) return <CardGridSkeleton count={4} />;
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No homework yet"
          description="Post the first homework assignment for your sections."
          action={<Button size="sm" onClick={onNeedCreate}>New Homework</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((hw) => (
          <HomeworkCard
            key={hw.id}
            homework={hw}
            isOwner={hw.createdById === userId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}