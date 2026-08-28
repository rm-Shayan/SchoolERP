'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { feeService } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import type { FeeRecord, FeeSummary } from '@/types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

function monthRange(month: number, year: number) {
  const after = new Date(Date.UTC(year, month - 1, 1));
  const before = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { dueDateAfter: after.toISOString(), dueDateBefore: before.toISOString() };
}

export function useFeeRecords() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState('');
  const [classId, setClassId] = useState('');
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dueDay, setDueDay] = useState(school?.monthlyFeeDueDay ?? 10);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [data, sum] = await Promise.all([
        feeService.getPage({
          schoolId,
          classId: classId || undefined,
          status: status || undefined,
          ...monthRange(Number(month), Number(year)),
          page,
          pageSize: PAGE_SIZE,
        }),
        feeService.getSummary({ schoolId, month: Number(month), year: Number(year) }),
      ]);
      setRecords(data.items);
      setTotal(data.total);
      setSummary(sum);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load fee records'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, month, year, status, classId, page]);

  useEffect(() => {
    load();
    if (schoolId) {
      feeService.getSchoolDueDay(schoolId).then((d) => setDueDay(d.monthlyFeeDueDay)).catch(() => {});
    }
  }, [load, schoolId]);

  const generate = async (m: string, y: string, d: number) => {
    if (!schoolId) return;
    try {
      const res = await feeService.generateMonthly({ schoolId, month: Number(m), year: Number(y), dueDay: d });
      setDueDay(res.dueDay);
      toast.success(`${res.created} voucher(s) generated — due ${res.dueDay}th`);
      if (Number(m) === Number(month) && Number(y) === Number(year)) load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate vouchers'));
    }
  };

  const remind = async (rec: FeeRecord) => {
    try {
      await feeService.sendRecordReminder(rec.id);
      toast.success('Reminder sent to parent');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send reminder'));
    }
  };

  return {
    schoolId, month, year, status, classId, records, summary, total, page, loading, dueDay,
    setMonth, setYear, setStatus, setClassId, setPage, setDueDay,
    load, generate, remind,
  };
}
