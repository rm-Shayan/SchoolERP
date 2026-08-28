'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Modal } from '@/features/shared/components';
import { feeService, studentService } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Student } from '@/types';
import StudentSelectList from './StudentSelectList';

interface Props {
  open: boolean;
  schoolId: string;
  month: string;
  year: string;
  onClose: () => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STORAGE_KEY = 'bulkVoucher:lastClassId';

export default function BulkPrintVoucherModal({ open, schoolId, month, year, onClose }: Props) {
  const [classId, setClassId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`${STORAGE_KEY}:${schoolId}`) || '';
  });
  const [printMonth, setPrintMonth] = useState(month);
  const [printYear, setPrintYear] = useState(year);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    feeService.getAllStructures().then((res) => {
      const m = new Map<string, string>();
      res.forEach((s) => s.classes?.forEach((c) => m.set(c.id, c.name)));
      const list = [...m.entries()].map(([id, name]) => ({ id, name }));
      setClasses(list);
      // Restore saved class if still valid
      if (classId && !list.some((c) => c.id === classId)) setClassId('');
    }).catch(() => setClasses([]));
  }, [open]);

  useEffect(() => {
    if (!classId || !schoolId) { setStudents([]); setSelected(new Set()); return; }
    setFetching(true);
    studentService.getAll({ schoolId, classId, status: 'ACTIVE', pageSize: 200 })
      .then((items) => { setStudents(items); setSelected(new Set(items.map((s) => s.id))); })
      .catch(() => { setStudents([]); setSelected(new Set()); })
      .finally(() => setFetching(false));
  }, [classId, schoolId]);

  const allSelected = useMemo(() => students.length > 0 && selected.size === students.length, [students, selected]);
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (!open) return null;

  const handleClassChange = (id: string) => {
    setClassId(id);
    if (id) localStorage.setItem(`${STORAGE_KEY}:${schoolId}`, id);
    else localStorage.removeItem(`${STORAGE_KEY}:${schoolId}`);
  };

  const handlePrint = async () => {
    if (classId && selected.size === 0) { toast.error('Select at least one student'); return; }
    setLoading(true);
    try {
      await feeService.getBulkVouchersPdf({ classId, month: Number(printMonth), year: Number(printYear), studentIds: [...selected] });
      toast.success(classId ? `${selected.size} voucher(s) downloaded` : 'All classes vouchers downloaded');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.includes('No fee records found')) {
        toast.error('No fee records for this month. Generate records first from Fee Records page.');
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to generate vouchers'));
      }
    } finally { setLoading(false); }
  };

  const handleView = async () => {
    setLoading(true);
    try {
      const url = await feeService.getBulkVouchersViewUrl({ classId: classId || undefined, month: Number(printMonth), year: Number(printYear) });
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) { toast.error(getApiErrorMessage(err, 'Failed to open vouchers')); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Fee Vouchers" size="lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-3 text-xs text-primary-800">Choose a class for selected students, or All Classes for one school-wide PDF.</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select value={classId} onChange={(e) => handleClassChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <select value={printMonth} onChange={(e) => setPrintMonth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <select value={printYear} onChange={(e) => setPrintYear(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                {[0, 1, 2].map((off) => { const y = new Date().getFullYear() + off; return <option key={y} value={String(y)}>{y}</option>; })}
              </select>
            </div>
          </div>
          {classId && (
            <StudentSelectList students={students} selected={selected} loading={fetching}
              onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected} someSelected={someSelected} />
          )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="outline" loading={loading} onClick={handleView}>View PDF</Button>
          <Button size="sm" loading={loading} onClick={handlePrint} disabled={classId ? selected.size === 0 : false}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 disabled:opacity-50">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download {classId && selected.size > 0 ? `(${selected.size})` : 'All'}
          </Button>
        </div>
        </div>
    </Modal>
  );
}
