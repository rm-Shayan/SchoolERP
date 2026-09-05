'use client';

import { memo, useCallback, useRef, useState } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { timetableService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';
import toast from 'react-hot-toast';

interface Props {
  slots: TimetableSlot[];
  sectionId: string;
  dayOfWeek: number;
  onReordered: () => void;
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
}

const DraggableDaySlots = memo(function DraggableDaySlots({ slots, sectionId, dayOfWeek, onReordered, onEdit, onDelete }: Props) {
  const [orderedSlots, setOrderedSlots] = useState<TimetableSlot[]>(slots);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragOverIdx = useRef<number | null>(null);

  // Sync with props when slots change
  if (slots !== orderedSlots && slots.length > 0 && JSON.stringify(slots.map((s) => s.id)) !== JSON.stringify(orderedSlots.map((s) => s.id))) {
    setOrderedSlots(slots);
  }

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback(async (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); return; }
    const newSlots = [...orderedSlots];
    const [moved] = newSlots.splice(dragIdx, 1);
    newSlots.splice(dropIdx, 0, moved);
    setOrderedSlots(newSlots);
    setDragIdx(null);
    // Persist to backend
    setSaving(true);
    try {
      await timetableService.reorderSlots(sectionId, dayOfWeek, newSlots.map((s) => s.id));
      toast.success('Order saved');
      onReordered();
    } catch { toast.error('Failed to save order'); }
    finally { setSaving(false); }
  }, [dragIdx, orderedSlots, sectionId, dayOfWeek, onReordered]);

  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className={cn('space-y-2', saving && 'opacity-60 pointer-events-none')}>
      {orderedSlots.map((slot, idx) => {
        const c = getSubjectColor(slot.subject?.name);
        const isDragging = idx === dragIdx;
        return (
          <div
            key={slot.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing',
              c.bg, c.border,
              isDragging && 'opacity-40 scale-95 shadow-lg',
              !isDragging && 'hover:shadow-md',
            )}
          >
            {/* Drag handle */}
            <div className="flex flex-col gap-0.5 shrink-0 text-gray-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
            </div>

            {/* Order number */}
            <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', 'bg-white/60', c.text)}>{idx + 1}</span>

            {/* Slot info */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold', c.text)}>{slot.subject?.name ?? '—'}</p>
              <p className={cn('text-xs', c.sub)}>{slot.teacher?.name} · {slot.startTime}–{slot.endTime}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(slot)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-white/60" title="Edit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onDelete(slot)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white/60" title="Delete">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default DraggableDaySlots;
