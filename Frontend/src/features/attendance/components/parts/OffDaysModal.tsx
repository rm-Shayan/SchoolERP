'use client';

import { useCallback, useEffect, useState } from 'react';
import { attendanceService } from '@/lib/api/attendanceService';
import type { OffDay } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  open: boolean;
  schoolId: string;
  /** current weekly-off weekdays [0..6]; default [0,6] */
  weeklyOff?: number[];
  onClose: () => void;
}

export default function OffDaysModal({ open, schoolId, weeklyOff, onClose }: Props) {
  const [list, setList] = useState<OffDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [weekly, setWeekly] = useState<number[]>(weeklyOff ?? [0, 6]);
  const [savingWeekly, setSavingWeekly] = useState(false);

  useEffect(() => {
    if (open) setWeekly(weeklyOff ?? [0, 6]);
  }, [open, weeklyOff]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const data = await attendanceService.getOffDays(schoolId);
      setList([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } catch { toast.error('Failed to load off days'); }
    finally { setLoading(false); }
  }, [open, schoolId]);
  useEffect(() => { load(); }, [load]);

  if (!open) return null;

  const add = async () => {
    if (!date) { toast.error('Pick a date'); return; }
    setBusy(true);
    try {
      const res = await attendanceService.addOffDay({ schoolId, date, reason: reason.trim() || undefined });
      setList([...res.offDays].sort((a, b) => b.date.localeCompare(a.date)));
      setDate(''); setReason('');
      toast.success('Off day added');
    } catch { toast.error('Failed to add'); }
    finally { setBusy(false); }
  };

  const remove = async (d: string) => {
    setBusy(true);
    try {
      const res = await attendanceService.removeOffDay(d, schoolId);
      setList([...res.offDays].sort((a, b) => b.date.localeCompare(a.date)));
      toast.success('Removed');
    } catch { toast.error('Failed to remove'); }
    finally { setBusy(false); }
  };

  const saveWeekly = async () => {
    setSavingWeekly(true);
    try {
      const res = await attendanceService.updateWeeklyOff({ schoolId, weekdays: weekly });
      setWeekly(res.weeklyOff);
      toast.success('Weekly off days saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingWeekly(false); }
  };

  const toggleWeekday = (d: number) =>
    setWeekly((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)));

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Off Days & Holidays</h2>
            <p className="text-[11px] text-gray-400">Pick the weekly off days + add holidays for specific dates.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-gray-100 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Weekly Off Days</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => (
                <button key={name} onClick={() => toggleWeekday(i)}
                  className={cn('h-8 rounded-lg px-3 text-[11px] font-semibold transition-all',
                    weekly.includes(i) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">{weekly.length === 0 ? 'School is open every day.' : `Off on: ${weekly.map((d) => DAY_NAMES[d]).join(', ')}`}</p>
              <button onClick={saveWeekly} disabled={savingWeekly}
                className={cn('rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all', savingWeekly ? 'cursor-not-allowed bg-gray-300' : 'bg-primary-600 hover:bg-primary-700')}>
                {savingWeekly ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. Eid, Summer break)"
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
            <button onClick={add} disabled={busy || !date}
              className={cn('h-10 rounded-lg px-4 text-xs font-semibold text-white transition-all', busy || !date ? 'cursor-not-allowed bg-gray-300' : 'bg-primary-600 hover:bg-primary-700')}>
              Add
            </button>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto">
            {loading ? <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
              : list.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No holidays added yet.</p>
              : (
              list.map((o) => (
                <div key={o.date} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{fmt(o.date)}</p>
                    <p className="truncate text-[11px] text-gray-400">{o.reason || 'School Off'}</p>
                  </div>
                  <button onClick={() => remove(o.date)} disabled={busy}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-50 hover:text-red-600">
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}