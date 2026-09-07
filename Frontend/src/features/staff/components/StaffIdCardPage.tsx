'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService } from '@/lib/api';
import type { User } from '@/types';
import { PageHeader, Button, Card, CardContent, EmptyState, Input } from '@/features/shared/components';
import IdCardDesign from './parts/IdCardDesign';
import toast from 'react-hot-toast';

export default function StaffIdCardPage() {
  const { school, organization } = useAppSelector((s) => s.auth);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewAll, setViewAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await staffService.getAll({ pageSize: 500 });
      setStaff(result.items);
    } catch (err: any) { toast.error(err?.message ?? 'Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const staffOnly = useMemo(() => staff.filter((s) => s.role !== 'ADMIN'), [staff]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffOnly.filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.username ?? '').toLowerCase().includes(q));
  }, [staffOnly, search]);

  const displayList = useMemo(() => viewAll ? filtered : filtered.filter((s) => selectedIds.has(s.id)), [filtered, selectedIds, viewAll]);

  const toggleSelect = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));

  return (
    <>
      <div className="space-y-6 no-print">
        <PageHeader title="Staff ID Cards" description="Generate and print ID cards for staff members."
          actions={displayList.length > 0 ? (
            <Button onClick={() => window.print()}>
              Print {displayList.length} Card{displayList.length !== 1 ? 's' : ''}
            </Button>
          ) : undefined}
        />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>{selectedIds.size === filtered.length ? 'Deselect' : 'Select All'}</Button>
            <Button size="sm" variant={viewAll ? 'primary' : 'outline'} onClick={() => setViewAll((v) => !v)}>{viewAll ? 'Viewing All' : 'View All'}</Button>
          </div>
        </div>
        {loading ? (
          <Card><CardContent><div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-gray-100 rounded-xl" />)}
          </div></CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><EmptyState title="No staff found" description="Add staff members to generate ID cards." /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((member) => (
              <div key={member.id} onClick={() => toggleSelect(member.id)}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${(selectedIds.has(member.id) || viewAll) ? 'border-primary-500 bg-primary-50/30 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="font-bold text-primary-600 text-sm">{member.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role} · {member.username || 'No ID'}</p>
                  </div>
                </div>
                <IdCardDesign member={member} school={school} org={organization} />
              </div>
            ))}
          </div>
        )}
      </div>
      {displayList.length > 0 && (
        <div className="hidden print:block print:p-0">
          <style>{`@media print { body * { visibility: hidden; } .print-id-grid, .print-id-grid * { visibility: visible; } .print-id-grid { position: absolute; left: 0; top: 0; } .id-card { break-inside: avoid; page-break-inside: avoid; margin: 4mm; } }`}</style>
          <div className="print-id-grid print:flex print:flex-wrap print:gap-0">
            {displayList.map((m) => <div key={m.id} className="print:p-1"><IdCardDesign member={m} school={school} org={organization} /></div>)}
          </div>
        </div>
      )}
    </>
  );
}
