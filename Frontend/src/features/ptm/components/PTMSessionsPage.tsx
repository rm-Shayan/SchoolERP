'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ptmService } from '@/lib/api';
import type { PTMEvent } from '@/lib/api/ptmService';
import { academicService, type Class } from '@/lib/api/academicService';
import { PageHeader, Button, Card, CardContent, EmptyState, Badge } from '@/features/shared/components';
import { ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PTMForm from './parts/PTMForm';
import PTMSessionCard from './parts/PTMSessionCard';
import PTMFilterBar from './parts/PTMFilterBar';

type Tab = 'upcoming' | 'past';

export default function PTMSessionsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const { isReadOnly } = useRoleAccess();
  const schoolId = school?.id ?? user?.schoolId;
  const [sessions, setSessions] = useState<PTMEvent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PTMEvent | null>(null);
  const [selClass, setSelClass] = useState('');
  const [selSection, setSelSection] = useState('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [sess, cls] = await Promise.all([
        ptmService.getBySchool(schoolId),
        academicService.getClassesBySchool(schoolId),
      ]);
      setSessions(sess);
      setClasses(cls);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load PTM sessions');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['ptm_created', 'ptm_updated', 'ptm_deleted'], load);

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const now = new Date();
  const upcoming = safeSessions.filter((s) => new Date(s.scheduledAt) >= now && s.status !== 'CANCELLED');
  const past = safeSessions.filter((s) => new Date(s.scheduledAt) < now || s.status === 'CANCELLED');

  const matchesFilter = useCallback((s: PTMEvent) => {
    if (!selSection && !selClass) return true;
    if (s.scope === 'WHOLE_SCHOOL') return true;
    const inClass = !selClass || s.classIds?.includes(selClass);
    const inSection = !selSection || s.sectionIds?.includes(selSection);
    return Boolean(inClass && inSection);
  }, [selClass, selSection]);
  const filteredUpcoming = useMemo(() => upcoming.filter(matchesFilter), [upcoming, matchesFilter]);
  const filteredPast = useMemo(() => past.filter(matchesFilter), [past, matchesFilter]);
  const active = tab === 'upcoming' ? filteredUpcoming : filteredPast;

  const remove = async (id: string) => {
    if (!confirm('Delete this PTM session?')) return;
    try { await ptmService.remove(id); toast.success('PTM session deleted'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent-Teacher Meetings"
        description="Schedule PTM sessions — parents will be notified automatically."
        actions={!isReadOnly && <Button size="sm" className="shadow-lg shadow-primary-500/20" onClick={() => { setEditing(null); setShowForm(true); }}>Schedule PTM</Button>}
      />
      <PTMForm key={editing?.id ?? 'new'} open={showForm} schoolId={schoolId ?? ''} school={school} classes={classes} session={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); load(); }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"><p className="text-2xl font-bold text-gray-900">{filteredUpcoming.length}</p><p className="text-xs text-gray-500">Upcoming meetings</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"><p className="text-2xl font-bold text-gray-900">{filteredPast.length}</p><p className="text-xs text-gray-500">Past meetings</p></div>
        <div className="col-span-2 rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 sm:col-span-1"><p className="text-2xl font-bold text-primary-700">{classes.length}</p><p className="text-xs text-primary-700/70">Classes available</p></div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <PTMFilterBar classes={classes} selectedClassId={selClass} selectedSectionId={selSection}
        onClassChange={setSelClass} onSectionChange={setSelSection}
        onClear={() => { setSelClass(''); setSelSection(''); }} />
      </div>
      <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['upcoming', 'past'] as Tab[]).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="capitalize">{key}</span>
            <Badge variant={tab === key ? 'success' : 'default'}>{key === 'upcoming' ? filteredUpcoming.length : filteredPast.length}</Badge>
          </button>
        ))}
      </div>
      {loading ? <ListSkeleton count={4} /> : active.length === 0 ? (
        <Card><CardContent className="py-16"><EmptyState
          title={tab === 'upcoming' ? 'No upcoming PTMs' : 'No past PTMs'}
          description={tab === 'upcoming' ? 'Schedule a new PTM session to notify parents.' : 'Previously conducted PTM sessions will appear here.'} /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {active.map((s) => <PTMSessionCard key={s.id} session={s} onEdit={isReadOnly ? undefined : (sess) => { setEditing(sess); setShowForm(true); }} onDelete={isReadOnly ? undefined : remove} />)}
        </div>
      )}
    </div>
  );
}
