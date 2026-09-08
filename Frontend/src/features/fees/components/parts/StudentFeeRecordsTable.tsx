'use client';

import { useState, useMemo } from 'react';
import { Button, EmptyState } from '@/features/shared/components';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import VoucherViewModal from './VoucherViewModal';
import PaymentModal from '../PaymentModal';
import type { FeeRecord } from '@/types';
import type { StudentFeeGroup } from './useStudentFeeRecords';
import { feeService } from '@/lib/api';
import toast from 'react-hot-toast';
import { StatusDot, ProgressBar, MonthBadges } from './FeeTableHelpers';

const mLabel = (d: string) => new Date(d).toLocaleString('en-PK', { month: 'short', year: 'numeric' });
const CollectIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
const DownloadIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ViewIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const BellIcon = () => <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const SearchIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

function StudentRow({ g, onCollect, onViewVoucher, onRemind, readOnly }: {
  g: StudentFeeGroup; onCollect: (g: StudentFeeGroup) => void;
  onViewVoucher: (g: StudentFeeGroup) => void; onRemind?: (r: FeeRecord) => void; readOnly?: boolean;
}) {
  const tc = g.records.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const pct = tc > 0 ? Math.round((g.totalPaid / tc) * 100) : 0;
  return (
    <tr className="group transition-colors hover:bg-primary-50/30 border-b border-gray-50 last:border-0">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-xs font-bold text-white shadow-sm group-hover:scale-105 transition-transform">{g.firstName[0]}{g.lastName[0]}</div>
          <div className="min-w-0"><p className="font-semibold text-gray-900 text-sm">{g.firstName} {g.lastName}</p><p className="text-[11px] text-gray-400 truncate">{g.className} {g.sectionName} {g.rollNumber ? `· #${g.rollNumber}` : ''}</p></div>
        </div>
      </td>
      <td className="py-3.5 px-4 max-w-[260px]"><MonthBadges records={g.records} /></td>
      <td className="py-3.5 px-4 text-right">
        <p className="font-bold text-gray-900 text-sm">{formatCurrency(g.outstanding)}</p>
        {g.totalPaid > 0 && <p className="text-[10px] text-emerald-600 font-semibold">{formatCurrency(g.totalPaid)} paid</p>}
        <ProgressBar paid={pct} status={g.records[0]?.status || 'UNPAID'} />
      </td>
      <td className="py-3.5 px-4">
        <div className="flex flex-wrap items-center justify-end gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
          {!readOnly && <Button size="sm" onClick={() => onCollect(g)}><CollectIcon />Collect</Button>}
          {!readOnly && <Button size="sm" variant="outline" onClick={() => feeService.getVoucherPdf(g.records[0].id).catch(() => toast.error('Download failed'))}><DownloadIcon />Voucher</Button>}
          <Button size="sm" variant="ghost" onClick={() => onViewVoucher(g)}><ViewIcon />View</Button>
          {!readOnly && <Button size="sm" variant="ghost" onClick={() => onRemind?.(g.records[0])}><BellIcon />Remind</Button>}
        </div>
      </td>
    </tr>
  );
}

function StudentCard({ g, onCollect, onViewVoucher, readOnly }: {
  g: StudentFeeGroup; onCollect: (g: StudentFeeGroup) => void; onViewVoucher: (g: StudentFeeGroup) => void; readOnly?: boolean;
}) {
  const openRecs = g.records.filter((r) => r.status !== 'PAID');
  const tc = g.records.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const pct = tc > 0 ? Math.round((g.totalPaid / tc) * 100) : 0;
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">{g.firstName[0]}{g.lastName[0]}</div>
        <div className="min-w-0 flex-1"><p className="font-bold text-gray-900 text-sm truncate">{g.firstName} {g.lastName}</p><p className="text-[11px] text-gray-400">{g.className} {g.sectionName} {g.rollNumber ? `· #${g.rollNumber}` : ''}</p></div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {openRecs.slice(0, 4).map((r) => <span key={r.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${getStatusColor(r.status)}`}><StatusDot status={r.status} />{mLabel(r.dueDate)}</span>)}
        {openRecs.length > 4 && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500">+{openRecs.length - 4}</span>}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p><p className="text-xl font-extrabold text-slate-900">{formatCurrency(g.outstanding)}</p>
          {g.totalPaid > 0 && <p className="text-[10px] text-emerald-600 font-semibold">{formatCurrency(g.totalPaid)} paid</p>}<ProgressBar paid={pct} status={g.records[0]?.status || 'UNPAID'} /></div>
        <div className="flex gap-1.5 shrink-0">
          {!readOnly && <Button size="sm" onClick={() => onCollect(g)}><CollectIcon />Collect</Button>}
          {!readOnly && <Button size="sm" variant="outline" onClick={() => feeService.getVoucherPdf(g.records[0].id).catch(() => toast.error('Download failed'))}><DownloadIcon />Voucher</Button>}
          <Button size="sm" variant="ghost" onClick={() => onViewVoucher(g)}>View</Button>
        </div>
      </div>
    </div>
  );
}

interface Props { students: StudentFeeGroup[]; loading: boolean; onRemind?: (r: FeeRecord) => void; onChanged: () => void; readOnly?: boolean; }

export default function StudentFeeRecordsTable({ students, loading, onRemind, onChanged, readOnly }: Props) {
  const [payingStudent, setPayingStudent] = useState<StudentFeeGroup | null>(null);
  const [viewStudent, setViewStudent] = useState<StudentFeeGroup | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      (g.rollNumber ?? '').toLowerCase().includes(q) ||
      (g.className ?? '').toLowerCase().includes(q) ||
      (g.sectionName ?? '').toLowerCase().includes(q)
    );
  }, [students, search]);

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;
  if (!students.length) return <div className="py-12"><EmptyState title="No pending fees" description="All students are paid up for the current period." /></div>;

  return (
    <>
      {/* Search bar */}
      <div className="border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, roll number, class..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
        {search && <p className="mt-1.5 text-[11px] text-gray-400">{filtered.length} of {students.length} students</p>}
      </div>

      {/* No results */}
      {filtered.length === 0 && search && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No students match "<span className="font-semibold text-gray-600">{search}</span>"</p>
          <button onClick={() => setSearch('')} className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700">Clear search</button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-3 p-4 sm:hidden">
        {filtered.map((g) => <StudentCard key={g.studentId} g={g} onCollect={setPayingStudent} onViewVoucher={setViewStudent} readOnly={readOnly} />)}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50/80 text-left text-[10px] uppercase tracking-[0.14em] text-slate-400">
            <th className="py-3 px-4 font-bold w-[220px]">Student</th>
            <th className="py-3 px-4 font-bold">Open Months</th>
            <th className="py-3 px-4 font-bold text-right w-[140px]">Outstanding</th>
            {!readOnly && <th className="py-3 px-4 font-bold text-right w-[240px]">Actions</th>}
          </tr></thead>
          <tbody>{filtered.map((g) => <StudentRow key={g.studentId} g={g} onCollect={setPayingStudent} onViewVoucher={setViewStudent} onRemind={onRemind} readOnly={readOnly} />)}</tbody>
        </table>
      </div>

      {payingStudent && <PaymentModal record={payingStudent.records[0]} records={payingStudent.records} onClose={() => setPayingStudent(null)} onPaid={() => { setPayingStudent(null); onChanged(); }} />}
      {viewStudent && <VoucherViewModal open={!!viewStudent} feeRecordId={viewStudent.records[0]?.id} onClose={() => setViewStudent(null)} />}
    </>
  );
}
