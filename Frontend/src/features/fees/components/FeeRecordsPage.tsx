'use client';

import { useState, useEffect } from 'react';
import { Card, Select } from '@/features/shared/components';
import { useAppSelector } from '@/store/hooks';
import { academicService, feeService } from '@/lib/api';
import GenerateMonthlyModal from './parts/GenerateMonthlyModal';
import DueDayEditor from './parts/DueDayEditor';
import FeeSummaryCards from './parts/FeeSummaryCards';
import StudentFeeRecordsTable from './parts/StudentFeeRecordsTable';
import { useStudentFeeRecords } from './parts/useStudentFeeRecords';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import toast from 'react-hot-toast';
import type { FeeRecord } from '@/types';
import BulkPrintVoucherModal from './parts/BulkPrintVoucherModal';
import FeeRecordsHero from './parts/FeeRecordsHero';
import { FeeTrendChart } from './parts/FeeTrendChart';
import { useRoleAccess } from '@/hooks/useRoleAccess';

export default function FeeRecordsPage() {
  const { user, school, organization } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const { role } = useRoleAccess();
  const isReadOnly = role === 'RECEPTIONIST';
  const [classId, setClassId] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editDueDay, setEditDueDay] = useState(false);
  const [dueDay, setDueDay] = useState(school?.monthlyFeeDueDay ?? 10);
  const month = String(new Date().getMonth() + 1);
  const year = String(new Date().getFullYear());
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { students, summary, loading, load } = useStudentFeeRecords(classId || undefined);
  useRealtimeRefresh(['fee_payment_recorded', 'fees_generated', 'fee_due_date_updated'], load);

  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId).then((c) => setClasses(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => {});
  }, [schoolId]);

  const generate = async (m: string, y: string, d: number) => {
    if (!schoolId) return;
    try {
      const res = await feeService.generateMonthly({ schoolId, month: Number(m), year: Number(y), dueDay: d });
      setDueDay(res.dueDay);
      toast.success(`${res.created} voucher(s) generated — due ${res.dueDay}th`);
      if (Number(m) === Number(month) && Number(y) === Number(year)) load();
    } catch (err) { toast.error('Failed to generate vouchers'); }
  };

  const remind = async (rec: FeeRecord) => {
    try {
      await feeService.sendRecordReminder(rec.id);
      toast.success('Reminder sent to parent');
    } catch (err) { toast.error('Failed to send reminder'); }
  };

  const remindAll = async () => {
    const openRecords = students.flatMap((g) => g.records.filter((r) => r.status !== 'PAID'));
    if (!openRecords.length) return toast.error('No open records to remind');
    setBulkBusy(true);
    try {
      await Promise.allSettled(openRecords.map((r) => feeService.sendRecordReminder(r.id)));
      toast.success(`Reminders sent to ${students.length} student(s)`);
    } catch { toast.error('Failed to send reminders'); }
    finally { setBulkBusy(false); }
  };

  const markAllPaid = async () => {
    const openRecords = students.flatMap((g) => g.records.filter((r) => r.status !== 'PAID'));
    if (!openRecords.length) return toast.error('No open records to mark paid');
    if (!window.confirm(`Mark ${openRecords.length} voucher(s) as PAID? This action cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      await Promise.allSettled(openRecords.map((r) => {
        const bal = Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0));
        return feeService.recordPayment(r.id, { amount: bal, method: 'CASH', reference: 'Bulk mark paid' });
      }));
      toast.success(`${openRecords.length} voucher(s) marked as PAID`);
      load();
    } catch { toast.error('Failed to mark paid'); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="min-h-full space-y-5 pb-8">
      <FeeRecordsHero summary={summary} dueDay={dueDay} themeColor={school?.themeColor || organization?.themeColor} logoUrl={school?.logoUrl || organization?.logoUrl} schoolName={school?.name} onGenerate={() => setShowGenerate(true)} onBulk={() => setShowBulk(true)} onDueDay={() => setEditDueDay(true)} readOnly={isReadOnly} />

      <div className="rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Student ledger</p>
              <p className="text-xs text-slate-500">Review balances and collect full or partial monthly fees.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {classes.length > 1 && <Select name="classId" placeholder="All classes" value={classId} onChange={(e) => setClassId(e.target.value)} options={[{ value: '', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} className="w-full sm:w-52" />}
          </div>
        </div>
      </div>

      {editDueDay && schoolId && (
        <DueDayEditor schoolId={schoolId} currentDueDay={dueDay} onSaved={(d) => { setDueDay(d); setEditDueDay(false); }} onCancel={() => setEditDueDay(false)} />
      )}

      <FeeSummaryCards summary={summary} themeColor={school?.themeColor || organization?.themeColor} />

      <FeeTrendChart themeColor={school?.themeColor || organization?.themeColor} />

      <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Students with open fees</h2>
              <p className="text-xs text-slate-500">Collect one or multiple months in a single payment.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">{students.length} students</span>
            {students.length > 0 && !isReadOnly && (
              <>
                <button onClick={remindAll} disabled={bulkBusy} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  Remind All
                </button>
                <button onClick={markAllPaid} disabled={bulkBusy} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Mark All Paid
                </button>
              </>
            )}
          </div>
        </div>
        <StudentFeeRecordsTable students={students} loading={loading} onRemind={isReadOnly ? undefined : remind} onChanged={load} readOnly={isReadOnly} />
      </Card>

      {showGenerate && (
        <GenerateMonthlyModal open month={month} year={year} dueDay={dueDay} onClose={() => setShowGenerate(false)} onGenerate={generate} />
      )}
      {showBulk && schoolId && <BulkPrintVoucherModal open schoolId={schoolId} month={month} year={year} onClose={() => setShowBulk(false)} />}
    </div>
  );
}
