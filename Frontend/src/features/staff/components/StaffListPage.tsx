'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService, moderationService } from '@/lib/api';
import type { User } from '@/types';
import { PageHeader, Button, EmptyState, Card, Pagination, Modal, Input, ConfirmDialog } from '@/features/shared/components';
import toast from 'react-hot-toast';
import StaffToolbar from './parts/StaffToolbar';
import StaffTable from './parts/StaffTable';
import StaffListSkeleton from './parts/StaffListSkeleton';
import StaffCreateModal from './StaffCreateModal';
import StaffImportModal from './StaffImportModal';
import StaffEditModal from './StaffEditModal';
import StaffDetailDrawer from './StaffDetailDrawer';

export default function StaffListPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editMember, setEditMember] = useState<User | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockBusy, setBlockBusy] = useState(false);
  const [unblockTarget, setUnclockTarget] = useState<User | null>(null);
  const [unblockBusy, setUnblockBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await staffService.getAll({ schoolId, pageSize: 500 });
      setStaff(result.items);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to load staff'); }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const staffOnly = useMemo(() => staff.filter((s) => s.role !== 'ADMIN'), [staff]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffOnly.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone ?? '').includes(q);
      return matchQ && (!roleFilter || s.role === roleFilter);
    });
  }, [staffOnly, search, roleFilter]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleBlock = useCallback(async () => {
    if (!blockTarget) return;
    setBlockBusy(true);
    try {
      await moderationService.blockUser(blockTarget.id, blockReason.trim() || undefined);
      toast.success(`${blockTarget.name} blocked`);
      setBlockTarget(null);
      setBlockReason('');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to block staff'); }
    finally { setBlockBusy(false); }
  }, [blockTarget, blockReason, load]);

  const handleUnblock = useCallback(async () => {
    if (!unblockTarget) return;
    setUnblockBusy(true);
    try {
      await moderationService.unblockUser(unblockTarget.id);
      toast.success(`${unblockTarget.name} unblocked`);
      setUnclockTarget(null);
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to unblock staff'); }
    finally { setUnblockBusy(false); }
  }, [unblockTarget, load]);

  const handleExport = async () => {
    try {
      const blob = await staffService.exportExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `staff-export-${school?.name ?? 'all'}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Staff exported');
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Export failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" description="Create, import, update and manage staff accounts."
        actions={<>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={staff.length === 0} title={staff.length === 0 ? 'No staff to export' : undefined}>Export Excel</Button>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>Import Excel</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Add Staff</Button>
        </>}
      />
      <StaffToolbar search={search} onSearchChange={setSearch} roleFilter={roleFilter} onRoleFilterChange={setRoleFilter} />
      {loading && staff.length === 0 ? <StaffListSkeleton />
        : staff.length === 0 ? <Card><EmptyState title="No staff yet" description="Create staff accounts or import via Excel." action={<Button onClick={() => setShowCreate(true)}>Add Staff</Button>} /></Card>
        : <>
          <StaffTable members={pageItems} onBlock={setBlockTarget} onUnblock={setUnclockTarget} onEdit={setEditMember} onSelect={setSelected} />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      }
      {showCreate && <StaffCreateModal open onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {showImport && <StaffImportModal open onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); load(); }} />}
      {editMember && <StaffEditModal open member={editMember} onClose={() => setEditMember(null)} onUpdated={() => { setEditMember(null); load(); }} />}
      {selected && <StaffDetailDrawer member={selected} onClose={() => setSelected(null)} onEdit={(m) => { setSelected(null); setEditMember(m); }} onBlock={setBlockTarget} onUnblock={setUnclockTarget} onChanged={load} />}

      <Modal open={!!blockTarget} onClose={() => { setBlockTarget(null); setBlockReason(''); }} title="Block Staff" size="sm">
        <p className="text-sm text-gray-600 mb-4">Blocking <b>{blockTarget?.name}</b> revokes their login and portal access immediately.</p>
        <Input label="Reason (optional)" placeholder="e.g. Left the school" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => { setBlockTarget(null); setBlockReason(''); }}>Cancel</Button>
          <Button variant="danger" loading={blockBusy} onClick={handleBlock}>Block Staff</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!unblockTarget} title="Unblock staff?" message={`Restore login access for ${unblockTarget?.name}?`} confirmLabel="Unblock" loading={unblockBusy} onConfirm={handleUnblock} onCancel={() => setUnclockTarget(null)} />
    </div>
  );
}
