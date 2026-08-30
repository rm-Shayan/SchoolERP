'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { timetableService } from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { PageHeader, Card, CardContent, EmptyState, Select, Button, ConfirmDialog, TableSkeleton } from '@/features/shared/components';
import useSectionOptions from './parts/useSectionOptions';
import TimetableSlotModal from './parts/TimetableSlotModal';
import TimetableImportModal from './parts/TimetableImportModal';
import WeeklyTimetableGrid from './parts/WeeklyTimetableGrid';
import TimetableStats from './parts/TimetableStats';
import DraggableDaySlots from './parts/DraggableDaySlots';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

export default function BranchTimetablePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const sections = useSectionOptions(schoolId);
  const [sectionId, setSectionId] = useState('');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [deleting, setDeleting] = useState<TimetableSlot | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [clearDay, setClearDay] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = all days

  const load = useCallback(async (sid: string) => {
    if (!sid) { setSlots([]); return; }
    setLoading(true);
    try { setSlots(await timetableService.getBySection(sid)); }
    catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (sectionId) load(sectionId); }, [sectionId, load]);
  useRealtimeRefresh(['timetable_slot_created', 'timetable_slot_updated', 'timetable_slot_deleted', 'timetable_cleared'], () => { if (sectionId) load(sectionId); });

  const todayDow = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const slotCounts = useMemo(() => { const m = new Map<number, number>(); slots.forEach((s) => m.set(s.dayOfWeek, (m.get(s.dayOfWeek) ?? 0) + 1)); return m; }, [slots]);

  const filteredSlots = useMemo(() => selectedDay ? slots.filter((s) => s.dayOfWeek === selectedDay) : slots, [slots, selectedDay]);
  const sortedSlots = useMemo(() => [...filteredSlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)), [filteredSlots]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try { await timetableService.deleteSlot(deleting.id); toast.success('Deleted'); setDeleting(null); load(sectionId); }
    catch { toast.error('Failed to delete'); }
    finally { setDeleteBusy(false); }
  };

  const handleClear = async () => {
    if (!sectionId) return;
    setClearBusy(true);
    try { const r = await timetableService.clearAllSlots(sectionId, clearDay ? Number(clearDay) : undefined); toast.success(`${r.deletedCount} cleared`); setShowClear(false); setClearDay(''); load(sectionId); }
    catch { toast.error('Failed to clear'); }
    finally { setClearBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable Management" description="Create and manage class timetables."
        actions={sectionId ? <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>Import</Button>
          <Button size="sm" variant="outline" onClick={async () => { await timetableService.exportCsv(sectionId); toast.success('Exported'); }}>Export</Button>
          {slots.length > 0 && <Button size="sm" variant="outline" onClick={() => timetableService.downloadSectionPdf(sectionId)}>PDF</Button>}
          {slots.length > 0 && <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowClear(true)}>Clear</Button>}
          <Button size="sm" onClick={() => { setEditing(null); setShowModal(true); }}>+ Add</Button>
        </div> : undefined} />

      <div className="max-w-xs">
        <Select label="Select Section" placeholder="Choose a section" options={sections.map((s) => ({ value: s.id, label: s.label }))}
          value={sectionId} onChange={(e) => { setSectionId(e.target.value); setSelectedDay(null); }} />
      </div>

      {sectionId && !loading && slots.length > 0 && <TimetableStats slots={slots} todayDow={todayDow} />}
      {/* Day picker chips */}
      {sectionId && !loading && slots.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSelectedDay(null)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', !selectedDay ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>All Days</button>
          {DAY_COLS.map((d) => {
            const count = slotCounts.get(d) ?? 0;
            const active = selectedDay === d;
            return <button key={d} onClick={() => setSelectedDay(d)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', active ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200', d === todayDow && !active && 'ring-1 ring-primary-300')}>
              {DAY_NAMES[d].slice(0, 3)}{count > 0 && <span className={cn('ml-1 text-[9px] px-1 py-px rounded-full font-bold', active ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500')}>{count}</span>}
            </button>;
          })}
        </div>
      )}

      <TimetableSlotModal key={editing?.id ?? 'new'} open={showModal} sectionId={sectionId} schoolId={schoolId} editing={editing}
        onClose={() => { setShowModal(false); setEditing(null); }} onSaved={() => { setShowModal(false); setEditing(null); load(sectionId); }} />
      <TimetableImportModal open={showImport} sectionId={sectionId} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); load(sectionId); }} />

      {!sectionId ? <Card><EmptyState title="Select a section" description="Choose a section above to view its timetable." /></Card>
      : loading ? <Card><CardContent><TableSkeleton rows={5} cols={7} /></CardContent></Card>
      : slots.length === 0 ? <Card><EmptyState title="No slots" description="Click '+ Add' to create the first entry." /></Card>
      : selectedDay ? (
        /* Single day draggable list */
        sortedSlots.length === 0 ? <Card><EmptyState title="No slots" description={`No entries for ${DAY_NAMES[selectedDay]}.`} /></Card>
        : <DraggableDaySlots slots={sortedSlots} sectionId={sectionId} dayOfWeek={selectedDay}
            onReordered={() => load(sectionId)}
            onEdit={(s) => { setEditing(s); setShowModal(true); }}
            onDelete={setDeleting} />
      ) : (
        /* Full weekly grid */
        <WeeklyTimetableGrid slots={slots} onEdit={(s) => { setEditing(s); setShowModal(true); }} onDelete={setDeleting} />
      )}

      <ConfirmDialog open={Boolean(deleting)} title="Delete slot?" message="This slot will be permanently removed."
        confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
      <ConfirmDialog open={showClear} title="Clear timetable?" message="Select which slots to clear."
        confirmLabel={clearDay ? `Clear ${DAY_NAMES[Number(clearDay)]}` : 'Clear All'} loading={clearBusy} onConfirm={handleClear}
        onCancel={() => { setShowClear(false); setClearDay(''); }}>
        <select value={clearDay} onChange={(e) => setClearDay(e.target.value)} className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All days</option>
          {DAY_NAMES.slice(1).map((d, i) => <option key={i + 1} value={String(i + 1)}>{d}</option>)}
        </select>
      </ConfirmDialog>
    </div>
  );
}
