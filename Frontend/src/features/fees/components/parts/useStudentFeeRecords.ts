'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { feeService } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import type { FeeRecord, FeeSummary } from '@/types';
import toast from 'react-hot-toast';

export interface StudentFeeGroup {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  className?: string;
  sectionName?: string;
  records: FeeRecord[];
  totalCharged: number;
  totalPaid: number;
  outstanding: number;
  openMonths: number;
}

export function useStudentFeeRecords(classId?: string) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;

  const [students, setStudents] = useState<StudentFeeGroup[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const bulk = await feeService.getBulkRecords({ schoolId });
      const byStudent = new Map<string, StudentFeeGroup>();
      for (const [sid, recs] of Object.entries(bulk)) {
        const filtered = classId ? recs.filter((r) => r.student?.section?.class?.id === classId) : recs;
        if (!filtered.length) continue;
        const s = filtered[0].student;
        if (!s) continue;
        const paid = filtered.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
        const charged = filtered.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
        const outstanding = filtered.filter((r) => r.status !== 'PAID').reduce((s, r) => s + Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0)), 0);
        byStudent.set(sid, {
          studentId: sid, firstName: s.firstName, lastName: s.lastName,
          rollNumber: s.rollNumber, className: s.section?.class?.name,
          sectionName: s.section?.name, records: filtered,
          totalCharged: charged, totalPaid: paid, outstanding,
          openMonths: filtered.filter((r) => r.status !== 'PAID').length,
        });
      }
      const groups = Array.from(byStudent.values()).sort((a, b) => a.lastName.localeCompare(b.lastName));
      setStudents(groups);
      const total = groups.reduce((s, g) => s + g.records.length, 0);
      const collected = groups.reduce((s, g) => s + g.totalPaid, 0);
      const outst = groups.reduce((s, g) => s + g.outstanding, 0);
      setSummary({ total, collected, outstanding: outst, totalCharges: 0,
        counts: { UNPAID: groups.reduce((s, g) => s + g.records.filter((r) => r.status === 'UNPAID').length, 0),
          PARTIAL: groups.reduce((s, g) => s + g.records.filter((r) => r.status === 'PARTIAL').length, 0),
          PAID: 0, OVERDUE: groups.reduce((s, g) => s + g.records.filter((r) => r.status === 'OVERDUE').length, 0) } });
    } catch (err) { toast.error(getApiErrorMessage(err, 'Failed to load fee records')); }
    finally { setLoading(false); }
  }, [schoolId, classId]);

  useEffect(() => { load(); }, [load]);

  return { students, summary, loading, load };
}
