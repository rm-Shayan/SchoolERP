'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { timetableService } from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { PageHeader, Card, CardContent, EmptyState, Select, Button, ConfirmDialog, TableSkeleton } from '@/features/shared/components';
import useSectionOptions from './parts/useSectionOptions';
import TimetableSlotModal from './parts/TimetableSlotModal';
import TimetableImportModal from './parts/TimetableImportModal';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const load = useCallback(async (sid: string) => {
    if (!sid) { setSlots([]); return; }
    setLoading(true);
    try {
      setSlots(await timetableService.getBySection(sid));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (sectionId) load(sectionId); }, [sectionId, load]);
  useRealtimeRefresh(
    ['timetable_slot_created', 'timetable_slot_updated', 'timetable_slot_deleted', 'timetable_cleared'],
    () => { if (sectionId) load(sectionId); }
  );

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>();
    slots.forEach((s) => {
      const rawDay = Number(s.dayOfWeek);
      // Some older rows used JS convention 0=Sunday..6=Saturday; current API
      // uses 1=Monday..7=Sunday. Normalize both without shifting valid Monday.
      const day = rawDay === 0 ? 1 : rawDay;
      if (!Number.isInteger(day) || day < 1 || day > 7) return;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    });
    map.forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [slots]);

  const handleDelete = async () => { if (!deleting) return; setDeleteBusy(true); try { await timetableService.deleteSlot(deleting.id); toast.success('Slot deleted'); setDeleting(null); load(sectionId); } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to delete'); } finally { setDeleteBusy(false); } };
  const handleClear = async () => { if (!sectionId) return; setClearBusy(true); try { const dayNum = clearDay ? Number(clearDay) : undefined; const r = await timetableService.clearAllSlots(sectionId, dayNum); toast.success(`${r.deletedCount} slot(s) cleared`); setShowClear(false); setClearDay(''); load(sectionId); } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to clear'); } finally { setClearBusy(false); } };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Management"
        description="Create and manage class timetables — assign subjects, teachers and time slots."
        actions={sectionId ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setShowImport(true)}>Import Excel</Button><Button size="sm" variant="outline" onClick={async () => { await timetableService.exportCsv(sectionId); toast.success('Timetable exported'); }}>Export CSV</Button>{slots.length > 0 && <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowClear(true)}>Clear All</Button>}<Button size="sm" onClick={() => { setEditing(null); setShowModal(true); }}>+ Add Slot</Button></div> : undefined}
      />

      <div className="max-w-xs">
        <Select label="Select Section" placeholder="Choose a section" options={sections.map((s) => ({ value: s.id, label: s.label }))}
          value={sectionId} onChange={(e) => setSectionId(e.target.value)} />
      </div>

      <TimetableSlotModal key={editing?.id ?? 'new'} open={showModal} sectionId={sectionId} schoolId={schoolId} editing={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={() => { setShowModal(false); setEditing(null); load(sectionId); }} />

      <TimetableImportModal open={showImport} sectionId={sectionId}
        onClose={() => setShowImport(false)}
        onImported={() => { setShowImport(false); load(sectionId); }} />

      {!sectionId ? (
        <Card><EmptyState title="Select a section" description="Choose a section above to view and manage its timetable." /></Card>
      ) : loading ? (
        <Card><CardContent><TableSkeleton rows={5} cols={7} /></CardContent></Card>
      ) : slots.length === 0 ? (
        <Card><EmptyState title="No timetable slots" description="Click 'Add Slot' to create the first timetable entry for this section." /></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {DAYS_FULL.map((d) => (
                    <th key={d} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS_FULL.map((_, dayIdx) => {
                    // Backend stores ISO weekdays: 1 = Monday ... 7 = Sunday.
                    const daySlots = byDay.get(dayIdx + 1) || [];
                    return (
                      <td key={dayIdx} className="px-3 py-3 align-top border-r border-gray-50 last:border-0 min-w-[100px]">
                        {daySlots.length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="space-y-2">
                            {daySlots.map((slot) => (
                              <div key={slot.id} className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 group relative">
                                <p className="text-xs font-mono text-primary-600">{slot.startTime}–{slot.endTime}</p>
                                <p className="text-sm font-medium text-primary-800 truncate">{slot.subject?.name ?? slot.subjectId}</p>
                                <p className="text-xs text-primary-500 truncate">{slot.teacher?.name ?? slot.teacherId}</p>
                                <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                  <button onClick={() => { setEditing(slot); setShowModal(true); }} className="p-1 rounded bg-white shadow text-gray-500 hover:text-primary-600">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => setDeleting(slot)} className="p-1 rounded bg-white shadow text-gray-500 hover:text-red-600">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={Boolean(deleting)} title="Delete slot?" message="This timetable slot will be permanently removed."
        confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
      <ConfirmDialog open={showClear} title="Clear timetable slots?" message={`Select which slots to clear for this section.`}
        confirmLabel={clearDay ? `Clear ${DAYS_FULL[Number(clearDay) - 1]}` : 'Clear All Days'} loading={clearBusy} onConfirm={handleClear} onCancel={() => { setShowClear(false); setClearDay(''); }}>
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Clear specific day (optional)</label>
          <select value={clearDay} onChange={(e) => setClearDay(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All days (full clear)</option>
            {DAYS_FULL.map((d, i) => <option key={i + 1} value={String(i + 1)}>{d}</option>)}
          </select>
        </div>
      </ConfirmDialog>
    </div>
  );
}
